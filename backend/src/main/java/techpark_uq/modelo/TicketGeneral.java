package techpark_uq.modelo;

import techpark_uq.enums.TipoTicket;

public class TicketGeneral extends Ticket {

    public TicketGeneral(String id) {
        super(id, 50000, TipoTicket.GENERAL);
    }

    @Override
    public int getPrioridad() { return 2; }
}
