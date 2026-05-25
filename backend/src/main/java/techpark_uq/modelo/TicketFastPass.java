package techpark_uq.modelo;

import techpark_uq.enums.TipoTicket;

public class TicketFastPass extends Ticket {

    public TicketFastPass(String id) {
        super(id, 120000, TipoTicket.FAST_PASS);
    }

    @Override
    public int getPrioridad() { return 1; }
}
