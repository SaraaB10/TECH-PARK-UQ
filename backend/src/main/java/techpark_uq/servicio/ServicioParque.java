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

        if (atraccion.getCostoAdicional() > 0) {
            if (!visitante.tieneSaldoSuficiente(atraccion.getCostoAdicional()))
                return "Saldo insuficiente. Costo adicional: $" + atraccion.getCostoAdicional();
            visitante.descontarSaldo(atraccion.getCostoAdicional());
        }

        atraccion.getColaVirtual().agregarVisitante(visitante);
        return "Visitante agregado a la cola correctamente";
    }

    // Procesar cola
    public Visitante procesarCola(String idAtraccion) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (atraccion == null) return null;

        Visitante siguiente = atraccion.getColaVirtual().siguienteVisitante();
        if (siguiente != null) {
            atraccion.registrarVisitante();
            siguiente.agregarHistorial(atraccion);
            siguiente.setUbicacionActual(atraccion);
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

    // Revisión técnica
    public String registrarRevisionTecnica(String idAtraccion) {
        Atraccion atraccion = buscarAtraccion(idAtraccion);
        if (atraccion == null) return "Atracción no encontrada";

        atraccion.setEstado(EstadoAtraccion.ACTIVA);
        atraccion.setMotivoCierre(null);
        return "Revisión técnica registrada. Atracción reactivada.";
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

    //Agregación de nuevos metodos

    // Metodo para obtener alertas de mantenimiento con su información principal
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

    //Metodo que resuelve una alerta de mantenimiento y reactiva la atracción asociada
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

    //Metodo que obtiene y retorna la lista de alertas climáticas registradas en el parque
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

    //Metodo que desactiva una alerta climática y reactiva las atracciones afectadas
    public String desactivarAlertaClimatica(String idAlerta) {
        for (AlertaClimatica ac : parque.getAlertasClimaticas()) {
            if (ac.getId().equals(idAlerta)) {
                if (!ac.isActiva()) return "La alerta ya estaba desactivada";
                ac.desactivar();
                // Reactivar atracciones afectadas que no estén en mantenimiento
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

}
