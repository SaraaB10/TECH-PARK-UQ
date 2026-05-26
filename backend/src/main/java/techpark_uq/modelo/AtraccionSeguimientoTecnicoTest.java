package techpark_uq.modelo;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import techpark_uq.enums.EstadoAtraccion;
import techpark_uq.enums.TipoAtraccion;

import static org.junit.jupiter.api.Assertions.*;

class AtraccionSeguimientoTecnicoTest {

    private Atraccion conSeguimiento;
    private Atraccion sinSeguimiento;

    @BeforeEach
    void setUp() {
        // id, nombre, tipo, capacidadMaximaPorCiclo, alturaMinima, edadMinima, costoAdicional
        conSeguimiento = new Atraccion("A1", "Montaña Rusa",
                TipoAtraccion.MECANICA_ALTURA, 20, 1.40, 12, 0);
        conSeguimiento.setRequiereSeguimientoTecnico(true);

        sinSeguimiento = new Atraccion("A2", "Carrusel",
                TipoAtraccion.OTRO, 30, 0, 3, 0);
        // requiereSeguimientoTecnico = false por defecto
    }

    // ── 1. Bloqueo automático al llegar a 500 ────────────────────────────────

    @Test
    void conSeguimiento_seBloquea_exactamenteEn500() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();

        assertEquals(EstadoAtraccion.EN_MANTENIMIENTO, conSeguimiento.getEstado());
        assertTrue(conSeguimiento.isRevisionTecnicaPendiente());
        assertFalse(conSeguimiento.estaActiva());
        assertNotNull(conSeguimiento.getMotivoCierre());
    }

    @Test
    void conSeguimiento_noSeBloquea_antes_de_500() {
        for (int i = 0; i < 499; i++) conSeguimiento.registrarVisitante();

        assertEquals(EstadoAtraccion.ACTIVA, conSeguimiento.getEstado());
        assertFalse(conSeguimiento.isRevisionTecnicaPendiente());
    }

    // ── 2. Sin seguimiento técnico nunca se bloquea ──────────────────────────

    @Test
    void sinSeguimiento_noSeBloquea_aunque_supere_500() {
        for (int i = 0; i < 600; i++) sinSeguimiento.registrarVisitante();

        assertEquals(EstadoAtraccion.ACTIVA, sinSeguimiento.getEstado());
        assertFalse(sinSeguimiento.isRevisionTecnicaPendiente());
        assertEquals(600, sinSeguimiento.getContadorVisitantes());
    }

    // ── 3. Bloqueada rechaza nuevos ingresos ─────────────────────────────────

    @Test
    void bloqueada_noAceptaMasVisitantes() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();

        int contadorAlBloqueo = conSeguimiento.getContadorVisitantes();
        conSeguimiento.registrarVisitante();
        conSeguimiento.registrarVisitante();

        assertEquals(contadorAlBloqueo, conSeguimiento.getContadorVisitantes());
    }

    // ── 4. Revisión técnica reactiva la atracción ────────────────────────────

    @Test
    void revisionSatisfactoria_reactivaAtraccion() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();

        conSeguimiento.registrarRevisionSatisfactoria();

        assertEquals(EstadoAtraccion.ACTIVA, conSeguimiento.getEstado());
        assertFalse(conSeguimiento.isRevisionTecnicaPendiente());
        assertTrue(conSeguimiento.estaActiva());
        assertNull(conSeguimiento.getMotivoCierre());
    }

    @Test
    void revisionSatisfactoria_reiniciaContador() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();

        conSeguimiento.registrarRevisionSatisfactoria();

        assertEquals(0, conSeguimiento.getContadorVisitantes());
    }

    @Test
    void trasRevision_aceptaVisitantesNuevamente() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();
        conSeguimiento.registrarRevisionSatisfactoria();

        conSeguimiento.registrarVisitante();
        conSeguimiento.registrarVisitante();

        assertEquals(2, conSeguimiento.getContadorVisitantes());
        assertTrue(conSeguimiento.estaActiva());
    }

    // ── 5. El ciclo de 500 se repite tras cada revisión ──────────────────────

    @Test
    void segundoCiclo_vuelveABloquearEn500() {
        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();
        conSeguimiento.registrarRevisionSatisfactoria();

        for (int i = 0; i < 500; i++) conSeguimiento.registrarVisitante();

        assertEquals(EstadoAtraccion.EN_MANTENIMIENTO, conSeguimiento.getEstado());
        assertTrue(conSeguimiento.isRevisionTecnicaPendiente());
    }
}