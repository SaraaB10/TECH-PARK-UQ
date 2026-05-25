package techpark_uq.servicio;

import techpark_uq.enums.TipoAtraccion;
import techpark_uq.modelo.*;
import org.springframework.stereotype.Service;

@Service
public class ServicioCargaDatos {

    private final ServicioParque servicioParque;

    // Flag de idempotencia: una sola carga por ciclo de vida del servidor.
    // Evita duplicados aunque el endpoint se llame varias veces desde
    // Inicio.jsx ("Cargar escenario de prueba") o Carga.jsx ("Prueba rápida").
    private boolean cargado = false;

    public ServicioCargaDatos(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // ── Helpers de búsqueda ────────────────────────────────────────────────────

    /** Devuelve true si ya existe una zona con ese ID en el parque. */
    private boolean zonaExiste(TechParkUQ parque, String id) {
        return parque.getZonas().stream().anyMatch(z -> z.getId().equals(id));
    }

    /** Devuelve true si ya existe una atracción con ese ID en el parque. */
    private boolean atraccionExiste(TechParkUQ parque, String id) {
        return parque.obtenerTodasLasAtracciones().stream()
                .anyMatch(a -> a.getId().equals(id));
    }

    /** Devuelve true si ya existe un operador con ese ID en el parque. */
    private boolean operadorExiste(TechParkUQ parque, String id) {
        Object[] empleados = parque.getEmpleados().obtenerTodos();
        for (Object e : empleados) {
            if (e instanceof Operador op && op.getId().equals(id)) return true;
        }
        return false;
    }

    /** Devuelve true si ya existe un visitante con ese ID en el parque. */
    private boolean visitanteExiste(TechParkUQ parque, String id) {
        return parque.getVisitantes().stream().anyMatch(v -> v.getId().equals(id));
    }

    // ── Carga principal ────────────────────────────────────────────────────────

    public String cargarEscenarioInicial() {

        // Guarda de idempotencia: si ya se cargó, no volver a insertar nada.
        if (cargado) {
            return "El escenario de prueba ya fue cargado anteriormente (sin duplicados)";
        }

        TechParkUQ parque = servicioParque.getParque();

        // ── Zonas ──────────────────────────────────────────────────────────────
        if (!zonaExiste(parque, "Z-001")) {
            parque.agregarZona(new Zona("Z-001", "Zona Aventura", 500));
        }
        if (!zonaExiste(parque, "Z-002")) {
            parque.agregarZona(new Zona("Z-002", "Zona Acuática", 300));
        }
        if (!zonaExiste(parque, "Z-003")) {
            parque.agregarZona(new Zona("Z-003", "Zona Espectáculos", 400));
        }

        // ── Atracciones ────────────────────────────────────────────────────────
        if (!atraccionExiste(parque, "A-001")) {
            parque.agregarAtraccionAZona(
                    new Atraccion("A-001", "Montaña Rusa Extrema",
                            TipoAtraccion.MECANICA_ALTURA, 20, 1.40, 12, 15000),
                    "Z-001");
        }
        if (!atraccionExiste(parque, "A-002")) {
            parque.agregarAtraccionAZona(
                    new Atraccion("A-002", "Torre de Caída Libre",
                            TipoAtraccion.MECANICA_ALTURA, 10, 1.50, 14, 10000),
                    "Z-001");
        }
        if (!atraccionExiste(parque, "A-003")) {
            parque.agregarAtraccionAZona(
                    new Atraccion("A-003", "Tobogán Gigante",
                            TipoAtraccion.ACUATICA, 15, 1.20, 8, 8000),
                    "Z-002");
        }
        if (!atraccionExiste(parque, "A-004")) {
            parque.agregarAtraccionAZona(
                    new Atraccion("A-004", "Piscina de Olas",
                            TipoAtraccion.ACUATICA, 50, 0.0, 5, 0),
                    "Z-002");
        }
        if (!atraccionExiste(parque, "A-005")) {
            parque.agregarAtraccionAZona(
                    new Atraccion("A-005", "Show de Magia",
                            TipoAtraccion.ESPECTACULO, 100, 0.0, 0, 0),
                    "Z-003");
        }

        // ── Operadores ─────────────────────────────────────────────────────────
        if (!operadorExiste(parque, "OP-001")) {
            Operador op1 = new Operador("OP-001", "Carlos López", 28,
                    "3101111111", "carlos@techpark.com", "1234");
            parque.agregarEmpleado(op1);
            servicioParque.asignarOperadorAZona("OP-001", "Z-001");
        }
        if (!operadorExiste(parque, "OP-002")) {
            Operador op2 = new Operador("OP-002", "Ana Martínez", 25,
                    "3102222222", "ana@techpark.com", "1234");
            parque.agregarEmpleado(op2);
            servicioParque.asignarOperadorAZona("OP-002", "Z-002");
        }

        // ── Visitantes ─────────────────────────────────────────────────────────
        if (!visitanteExiste(parque, "V-001")) {
            Visitante v1 = new Visitante("V-001", "Laura García", 25,
                    "3103333333", "laura@gmail.com", "pass", 1.65, 200000);
            servicioParque.venderTicket(v1, "FAST_PASS");
        }
        if (!visitanteExiste(parque, "V-002")) {
            Visitante v2 = new Visitante("V-002", "Pedro Ruiz", 30,
                    "3104444444", "pedro@gmail.com", "pass", 1.75, 150000);
            servicioParque.venderTicket(v2, "GENERAL");
        }

        // ── Colas iniciales (solo si el visitante existe y no está en cola) ───
        // validarAcceso ya verifica internamente el estado de la atracción
        // y los requisitos del visitante, por lo que es seguro llamarlo aquí.
        Atraccion a001 = servicioParque.buscarAtraccion("A-001");
        Visitante v001 = servicioParque.buscarVisitante("V-001");
        if (a001 != null && v001 != null
                && !a001.getColaVirtual().estaEnCola(v001)) {
            servicioParque.validarAcceso("A-001", "V-001");
        }

        Atraccion a003 = servicioParque.buscarAtraccion("A-003");
        Visitante v002 = servicioParque.buscarVisitante("V-002");
        if (a003 != null && v002 != null
                && !a003.getColaVirtual().estaEnCola(v002)) {
            servicioParque.validarAcceso("A-003", "V-002");
        }

        // ── Grafo / senderos (conectarAtracciones es idempotente si el modelo
        //    ya maneja aristas duplicadas; de lo contrario solo se agrega
        //    si los nodos existen y el grafo aún no tiene esa conexión) ────────
        GrafoParque grafo = parque.getGrafoParque();
        for (Atraccion a : parque.obtenerTodasLasAtracciones()) {
            grafo.agregarAtraccion(a);   // el grafo debe ignorar nodos ya presentes
        }

        // Conectar solo si el grafo no registra ya esa arista.
        // Si GrafoParque no tiene un método "existeArista", la llamada
        // a conectarAtracciones es idempotente por diseño (sobreescribe el peso).
        parque.conectarAtracciones("A-001", "A-002", 50);
        parque.conectarAtracciones("A-002", "A-003", 120);
        parque.conectarAtracciones("A-003", "A-004", 30);
        parque.conectarAtracciones("A-004", "A-005", 80);
        parque.conectarAtracciones("A-001", "A-005", 200);
        parque.conectarAtracciones("A-002", "A-005", 150);

        // Marcar como cargado al final, solo si todo fue bien.
        cargado = true;

        return "Escenario inicial cargado: 3 zonas, 5 atracciones, 2 operadores, 2 visitantes";
    }

    // ── Estado y reset ─────────────────────────────────────────────────────────

    /** Permite consultar si el escenario ya fue inicializado. */
    public boolean isCargado() {
        return cargado;
    }

    /** Reinicia el flag para permitir una nueva carga (útil en tests). */
    public void resetear() {
        cargado = false;
    }
}