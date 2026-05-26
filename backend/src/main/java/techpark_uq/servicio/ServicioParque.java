package techpark_uq.servicio;

import techpark_uq.enums.EstadoAtraccion;
import techpark_uq.enums.TipoClima;
import techpark_uq.modelo.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ServicioParque {

    private TechParkUQ parque;

    // Minutos promedio por ciclo de una atracción
    private static final int MINUTOS_POR_CICLO = 5;

    public ServicioParque() {
        this.parque = new TechParkUQ(
                "PQ-001", "Tech-Park UQ",
                "Quindío, Colombia",
                "3101234567",
                "info@techparkuq.com",
                5000
        );
    }

    // Acceso al parque
    public TechParkUQ getParque() { return parque; }

    // Venta de tickets
    public Ticket venderTicket(Visitante visitante, String tipoTicket) {
        if (!parque.verificarAforo()) {
            throw new RuntimeException("El parque ha alcanzado su capacidad máxima");
        }
        return parque.venderTicket(visitante, tipoTicket);
    }

    // ── Helper: recalcula tiempos de espera diferenciados por prioridad ──────
    // Usa el tiempoEsperaBase configurado en Administración como duración
    // de un ciclo, en vez de un valor fijo hardcodeado.
    // FastPass (prioridad 1) solo espera a los FastPass que van delante.
    // General  (prioridad 2) espera a todos los FastPass + los General delante.
    private void recalcularTiempoEspera(Atraccion atraccion) {
        int fastPassEnCola  = atraccion.getColaVirtual().tamanoFastPass();
        int generalesEnCola = atraccion.getColaVirtual().tamanoGeneral();
        int capacidad       = atraccion.getCapacidadMaximaPorCiclo();
        if (capacidad <= 0) capacidad = 1;

        // Duración real de un ciclo: el valor configurado en Administración.
        // Si aún no fue configurado (0), cae al default de 5 min.
        int minutosPorCiclo = atraccion.getTiempoEsperaBase() > 0
                ? atraccion.getTiempoEsperaBase()
                : MINUTOS_POR_CICLO;

        // FastPass: solo espera los ciclos ocupados por FastPass delante
        int ciclosFastPass = (int) Math.ceil((double) fastPassEnCola / capacidad);
        int tiempoFastPass = Math.max(ciclosFastPass, colaVaciaEsZero(fastPassEnCola)) * minutosPorCiclo;

        // General: espera todos los FastPass + todos los generales delante
        int ciclosGeneral  = (int) Math.ceil((double) (fastPassEnCola + generalesEnCola) / capacidad);
        int tiempoGeneral  = Math.max(ciclosGeneral,  colaVaciaEsZero(fastPassEnCola + generalesEnCola)) * minutosPorCiclo;

        atraccion.setTiempoEsperaFastPass(tiempoFastPass);
        atraccion.setTiempoEsperaEstimado(tiempoGeneral); // General / valor general
    }

    // Retorna 0 si la cola está vacía (sin espera), 1 si hay al menos uno
    private int colaVaciaEsZero(int enCola) {
        return enCola > 0 ? 1 : 0;
    }

    // Validar acceso a atracción
    public String validarAcceso(String idAtraccion, String idVisitante) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        Visitante visitante = buscarVisitante(idVisitante);

        if (atraccion == null) return "Atracción no encontrada";
        if (visitante == null) return "Visitante no encontrado";
        if (!atraccion.estaActiva()) return "La atracción no está activa: " + atraccion.getEstado();

        if (visitante.getEstatura() < atraccion.getAlturaMinima())
            return "Estatura insuficiente. Mínimo: " + atraccion.getAlturaMinima() + "m";

        if (visitante.getEdad() < atraccion.getEdadMinima())
            return "Edad insuficiente. Mínimo: " + atraccion.getEdadMinima() + " años";

        // Sin cobro de costoAdicional: la cola es solo de prioridad por ticket
        // (costoAdicional existe en el modelo pero no aplica en el flujo de cola virtual)

        // Agregar visitante a la cola
        atraccion.getColaVirtual().agregarVisitante(visitante);

        // ── NUEVO: incrementar visitantesActuales de la zona ──────────────────
        // Zona siempre está seteada via agregarAtraccionAZona()
        Zona zona = atraccion.getZona();
        if (zona != null) {
            boolean yaContadoEnZona = zona.getAtracciones().stream()
                    .filter(a -> !a.getId().equals(idAtraccion))
                    .anyMatch(a -> a.getColaVirtual().estaEnCola(visitante));
            if (!yaContadoEnZona) {
                zona.incrementarVisitantes();
            }
        }

        // ── NUEVO: recalcular tiempo de espera con la cola actualizada ────────
        recalcularTiempoEspera(atraccion);
        visitante.agregarHistorial(atraccion);

        return "Visitante agregado a la cola correctamente";
    }

    // Procesar cola
    public Visitante procesarCola(String idAtraccion) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (atraccion == null) return null;

        Visitante siguiente = atraccion.getColaVirtual().siguienteVisitante();
        if (siguiente != null) {
            // Registra la visita (incrementa contadorVisitantes de la atracción)
            boolean estabaActiva = atraccion.estaActiva();
            atraccion.registrarVisitante();

            // Si registrarVisitante activó el bloqueo, crear alerta de mantenimiento
            if (estabaActiva && !atraccion.estaActiva() && atraccion.isRequiereSeguimientoTecnico()) {
                String idAlerta = "AM-" + System.currentTimeMillis();
                AlertaMantenimiento alerta = new AlertaMantenimiento(idAlerta, atraccion);
                parque.getAlertasMantenimiento().add(alerta);
            }
            siguiente.agregarHistorial(atraccion);
            siguiente.setUbicacionActual(atraccion);

            // ── NUEVO: decrementar visitantesActuales de la zona ──────────────
            // El visitante salió de la cola y "pasó" por la atracción
            Zona zona = atraccion.getZona();
            if (zona != null) {
                boolean sigueEnOtraCola = zona.getAtracciones().stream()
                        .filter(a -> !a.getId().equals(idAtraccion))
                        .anyMatch(a -> a.getColaVirtual().estaEnCola(siguiente));
                if (!sigueEnOtraCola) {
                    zona.decrementarVisitantes();
                }
            }

            // ── NUEVO: recalcular tiempo de espera tras procesar uno ──────────
            recalcularTiempoEspera(atraccion);
        }
        return siguiente;
    }

    // Cambiar estado atracción
    public String cambiarEstadoAtraccion(String idAtraccion, String nuevoEstado) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (atraccion == null) return "Atracción no encontrada";

        atraccion.setEstado(EstadoAtraccion.valueOf(nuevoEstado));
        return "Estado actualizado a: " + nuevoEstado;
    }

    public String registrarRevisionTecnica(String idAtraccion) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (atraccion == null) return "Atracción no encontrada";
        if (!atraccion.isRevisionTecnicaPendiente()) return "La atracción no tiene revisión técnica pendiente";

        atraccion.registrarRevisionSatisfactoria();

        // Resolver la alerta de mantenimiento pendiente asociada
        parque.getAlertasMantenimiento().stream()
                .filter(am -> am.getAtraccion().getId().equals(idAtraccion) && !am.isResuelta())
                .forEach(AlertaMantenimiento::resolver);

        return "Revisión técnica registrada. Atracción reactivada: " + atraccion.getNombre();
    }

    // Alerta climática
    public AlertaClimatica activarAlertaClimatica(String tipoClima) {
        TipoClima tipo = TipoClima.valueOf(tipoClima);
        return parque.activarAlertaClimatica(tipo);
    }

    //  Asignar operador a zona
    public String asignarOperadorAZona(String idOperador, String idZona) {
        Persona persona = parque.getEmpleados().buscar(
                e -> e.getId().equals(idOperador)
        );
        if (!(persona instanceof Operador operador))
            return "Operador no encontrado";

        Zona zona = parque.buscarZona(idZona);
        if (zona == null) return "Zona no encontrada";

        operador.asignarZona(zona);
        zona.agregarOperador(operador);
        return "Operador asignado correctamente a zona: " + zona.getNombre();
    }

    //  Favoritos
    public String agregarFavorito(String idVisitante, String idAtraccion) {
        Visitante visitante = buscarVisitante(idVisitante);
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (visitante == null || atraccion == null) return "No encontrado";
        visitante.agregarFavorito(atraccion);
        return "Atracción agregada a favoritos";
    }

    // Búsquedas internas
    public Atraccion buscarAtraccion(String id) {
        return parque.obtenerTodasLasAtracciones().stream()
                .filter(a -> a.getId().equals(id))
                .findFirst().orElse(null);
    }

    public Visitante buscarVisitante(String id) {
        return parque.getVisitantes().stream()
                .filter(v -> v.getId().equals(id))
                .findFirst().orElse(null);
    }

    public List<Atraccion> obtenerTodasLasAtracciones() {
        return parque.obtenerTodasLasAtracciones();
    }

    // Zonas
    public List<Zona> obtenerTodasLasZonas() {
        return parque.getZonas();
    }

    public Zona obtenerZonaPorId(String id) {
        return parque.buscarZona(id);
    }

    public String crearZona(String id, String nombre, int capacidadMaxima) {
        Zona zona = new Zona(id, nombre, capacidadMaxima);
        parque.agregarZona(zona);
        return "Zona creada correctamente: " + nombre;
    }

    public String crearAtraccionEnZona(Atraccion atraccion, String zonaId, double distancia) {
        Zona zona = parque.buscarZona(zonaId);
        if (zona == null) return "Zona no encontrada: " + zonaId;
        parque.agregarAtraccionAZona(atraccion, zonaId, distancia);
        return "Atracción creada correctamente: " + atraccion.getNombre();
    }

    // Operadores
    public String crearOperador(String id, String nombre, int edad,
                                String telefono, String email, String contrasena) {
        Operador operador = new Operador(id, nombre, edad, telefono, email, contrasena);
        parque.agregarEmpleado(operador);
        return "Operador creado correctamente: " + nombre;
    }

    public List<Operador> obtenerTodosLosOperadores() {
        List<Operador> operadores = new ArrayList<>();
        Object[] empleados = parque.getEmpleados().obtenerTodos();
        for (Object e : empleados) {
            if (e instanceof Operador) {
                operadores.add((Operador) e);
            }
        }
        return operadores;
    }

    public Operador obtenerOperadorPorId(String id) {
        Object[] empleados = parque.getEmpleados().obtenerTodos();
        for (Object e : empleados) {
            if (e instanceof Operador op && op.getId().equals(id)) {
                return op;
            }
        }
        return null;
    }

    public String eliminarOperador(String id) {
        Operador operador = obtenerOperadorPorId(id);
        if (operador == null) return "Operador no encontrado";
        parque.eliminarEmpleado(operador);
        return "Operador eliminado correctamente";
    }

    // Alertas de mantenimiento
    public List<Map<String, Object>> obtenerAlertasMantenimiento() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (AlertaMantenimiento am : parque.getAlertasMantenimiento()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", am.getId());
            item.put("atraccion", am.getAtraccion().getNombre());
            item.put("idAtraccion", am.getAtraccion().getId());
            item.put("fecha", am.getFechaGeneracion().toString());
            item.put("resuelta", am.isResuelta());
            item.put("visitantesAlMomento", am.getVisitantesAlMomentoAlerta());
            if (am.getFechaResolucion() != null) {
                item.put("fechaResolucion", am.getFechaResolucion().toString());
            }
            resultado.add(item);
        }
        return resultado;
    }

    public String resolverAlertaMantenimiento(String idAlerta) {
        for (AlertaMantenimiento am : parque.getAlertasMantenimiento()) {
            if (am.getId().equals(idAlerta)) {
                if (am.isResuelta()) return "La alerta ya estaba resuelta";
                am.resolver();
                am.getAtraccion().setEstado(
                        techpark_uq.enums.EstadoAtraccion.ACTIVA
                );
                am.getAtraccion().setMotivoCierre(null);
                return "Alerta resuelta. Atracción reactivada: "
                        + am.getAtraccion().getNombre();
            }
        }
        return "Alerta no encontrada";
    }

    public List<Map<String, Object>> obtenerAlertasClimaticas() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (AlertaClimatica ac : parque.getAlertasClimaticas()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", ac.getId());
            item.put("tipo", ac.getTipo());
            item.put("fechaActivacion", ac.getFechaActivacion().toString());
            item.put("activa", ac.isActiva());
            item.put("atraccionesAfectadas",
                    ac.getAtraccionesAfectadas().stream()
                            .map(Atraccion::getNombre)
                            .toList()
            );
            resultado.add(item);
        }
        return resultado;
    }

    public String desactivarAlertaClimatica(String idAlerta) {
        for (AlertaClimatica ac : parque.getAlertasClimaticas()) {
            if (ac.getId().equals(idAlerta)) {
                if (!ac.isActiva()) return "La alerta ya estaba desactivada";
                ac.desactivar();
                for (Atraccion a : ac.getAtraccionesAfectadas()) {
                    if (a.getEstado() == techpark_uq.enums.EstadoAtraccion.CERRADA) {
                        a.setEstado(techpark_uq.enums.EstadoAtraccion.ACTIVA);
                        a.setMotivoCierre(null);
                    }
                }
                return "Alerta climática desactivada. Atracciones reabiertas.";
            }
        }
        return "Alerta no encontrada";
    }

    public List<Map<String, Object>> obtenerNotificaciones(String idVisitante) {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Notificacion n : parque.getNotificaciones()) {
            if (n.getDestinatario().getId().equals(idVisitante)) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", n.getId());
                item.put("mensaje", n.getMensaje());
                item.put("tipo", n.getTipo());
                item.put("fechaEnvio", n.getFechaEnvio().toString());
                resultado.add(item);
            }
        }
        return resultado;
    }
}