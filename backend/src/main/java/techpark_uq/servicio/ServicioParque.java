package techpark_uq.servicio;

import org.springframework.stereotype.Service;
import java.util.List;

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
}
