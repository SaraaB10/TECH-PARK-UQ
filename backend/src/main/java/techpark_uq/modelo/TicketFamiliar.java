package techpark_uq.modelo;

import techpark_uq.enums.TipoTicket;

public class TicketFamiliar extends Ticket {

    private double porcentajeDescuento;

    public TicketFamiliar(String id, double porcentajeDescuento) {
        super(id, 70000, TipoTicket.FAMILIAR);
        this.porcentajeDescuento = porcentajeDescuento;
    }

    public double calcularDescuento() {
        return costoBase - (costoBase * porcentajeDescuento / 100);
    }

    @Override
    public int getPrioridad() { return 2; }

    public double getPorcentajeDescuento() { return porcentajeDescuento; }
}