package techpark_uq.modelo;

import techpark_uq.estructuras.ColaPrioridad;

public class ColaVirtual {

    private Atraccion atraccion;
    private ColaPrioridad<Visitante> cola;

    public ColaVirtual(Atraccion atraccion) {
        this.atraccion = atraccion;
        this.cola = new ColaPrioridad<>();
    }

    public void agregarVisitante(Visitante visitante) {
        int prioridad = visitante.getTicket().getPrioridad();
        cola.encolar(visitante, prioridad);
    }

    public Visitante siguienteVisitante() {
        return cola.desencolar();
    }

    public Visitante verFrente() {
        return cola.verFrente();
    }

    public boolean estaVacia() {
        return cola.estaVacia();
    }

    public int tamano() {
        return cola.tamano();
    }

    public Atraccion getAtraccion() { return atraccion; }
}
