package techpark_uq;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import techpark_uq.enums.TipoAtraccion;
import techpark_uq.enums.TipoClima;
import techpark_uq.enums.EstadoAtraccion;
import techpark_uq.estructuras.ColaPrioridad;
import techpark_uq.estructuras.ListaEnlazada;
import techpark_uq.modelo.*;
import static org.junit.jupiter.api.Assertions.*;


public class TechParkUQTest {
    private Atraccion atraccion;
    private Visitante visitanteFastPass;
    private Visitante visitanteGeneral;
    private TechParkUQ parque;

    @BeforeEach
    void setUp() {
        atraccion = new Atraccion("A-001", "Montaña Rusa",
                TipoAtraccion.MECANICA_ALTURA, 20, 1.40, 12, 0);

        visitanteFastPass = new Visitante("V-001", "Laura", 25,
                "3101111111", "laura@test.com", "pass", 1.65, 200000);
        visitanteFastPass.setTicket(new TicketFastPass("TK-001"));

        visitanteGeneral = new Visitante("V-002", "Pedro", 30,
                "3102222222", "pedro@test.com", "pass", 1.75, 100000);
        visitanteGeneral.setTicket(new TicketGeneral("TK-002"));

        parque = new TechParkUQ("PQ-001", "Tech-Park Test",
                "Quindío", "3100000000", "test@park.com", 5000);
    }
}
