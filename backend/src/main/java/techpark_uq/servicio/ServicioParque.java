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

}
