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

    // Cantidad de visitantes FastPass (prioridad 1) en la cola
    public int tamanoFastPass() {
        return cola.tamanoConPrioridad(1);
    }

    // Cantidad de visitantes General/Familiar (prioridad 2) en la cola
    public int tamanoGeneral() {
        return cola.tamanoConPrioridad(2);
    }

    public Atraccion getAtraccion() { return atraccion; }

    public boolean estaEnCola(Visitante visitante) {
        return cola.contiene(visitante);
    }

    public boolean remover(Visitante visitante) {
        return cola.remover(visitante);
    }
}