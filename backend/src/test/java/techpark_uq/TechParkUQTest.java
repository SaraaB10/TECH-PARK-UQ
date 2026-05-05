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

    // Test 1
    @Test
    void testColaPrioridadFastPassPrimero() {
        ColaPrioridad<Visitante> cola = new ColaPrioridad<>();

        cola.encolar(visitanteGeneral, 2);
        cola.encolar(visitanteFastPass, 1);

        Visitante primero = cola.desencolar();
        assertEquals("Laura", primero.getNombre(),
                "FastPass debe tener prioridad sobre General");

        Visitante segundo = cola.desencolar();
        assertEquals("Pedro", segundo.getNombre(),
                "General debe salir después del FastPass");
    }

    // Test 2
    @Test
    void testMantenimientoPreventivo500Visitantes() {
        for (int i = 0; i < 499; i++) {
            atraccion.registrarVisitante();
        }
        assertEquals(EstadoAtraccion.ACTIVA, atraccion.getEstado(),
                "Con 499 visitantes debe seguir ACTIVA");

        atraccion.registrarVisitante();
        assertEquals(EstadoAtraccion.EN_MANTENIMIENTO, atraccion.getEstado(),
                "Al visitante 500 debe cambiar a EN_MANTENIMIENTO");
    }

    // Test 3
    @Test
    void testAlertaClimaticaCierraAtraccionesCorrectas() {
        Zona zona = new Zona("Z-001", "Zona Test", 500);

        Atraccion acuatica = new Atraccion("A-001", "Tobogán",
                TipoAtraccion.ACUATICA, 15, 1.20, 8, 0);
        Atraccion mecanica = new Atraccion("A-002", "Torre",
                TipoAtraccion.MECANICA_ALTURA, 10, 1.50, 14, 0);
        Atraccion espectaculo = new Atraccion("A-003", "Show",
                TipoAtraccion.ESPECTACULO, 100, 0.0, 0, 0);

        parque.agregarZona(zona);
        parque.agregarAtraccionAZona(acuatica, "Z-001");
        parque.agregarAtraccionAZona(mecanica, "Z-001");
        parque.agregarAtraccionAZona(espectaculo, "Z-001");

        parque.activarAlertaClimatica(TipoClima.TORMENTA_ELECTRICA);

        assertEquals(EstadoAtraccion.CERRADA, acuatica.getEstado(),
                "Atracción ACUATICA debe cerrarse");
        assertEquals(EstadoAtraccion.CERRADA, mecanica.getEstado(),
                "Atracción MECANICA_ALTURA debe cerrarse");
        assertEquals(EstadoAtraccion.ACTIVA, espectaculo.getEstado(),
                "ESPECTACULO NO debe cerrarse por clima");
    }
}
