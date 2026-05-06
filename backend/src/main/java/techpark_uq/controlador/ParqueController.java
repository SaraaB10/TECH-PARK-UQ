package techpark_uq.controlador;

import techpark_uq.modelo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import techpark_uq.servicio.ServicioCargaDatos;
import techpark_uq.servicio.ServicioParque;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parque")

public class ParqueController {

    private final ServicioParque servicioParque;
    private final ServicioCargaDatos servicioCargaDatos;

    // Constructor
    public ParqueController(ServicioParque servicioParque, ServicioCargaDatos servicioCargaDatos) {
        this.servicioParque = servicioParque;
        this.servicioCargaDatos = servicioCargaDatos;
    }

    // GET: retorna información general del parque
    @GetMapping("/info")
    public ResponseEntity<?> getInfo() {
        TechParkUQ parque = servicioParque.getParque();
        return ResponseEntity.ok(Map.of(
                "nombre", parque.getNombre(),
                "capacidadMaxima", parque.getCapacidadMaxima(),
                "visitantesActuales", parque.getVisitantesActuales(),
                "estaAbierto", parque.isEstaAbierto(),
                "ingresosDiarios", parque.getIngresosDiarios()
        ));
    }

    // POST: carga datos iniciales del sistema
    @PostMapping("/cargar-datos")
    public ResponseEntity<String> cargarDatos() {
        String resultado = servicioCargaDatos.cargarEscenarioInicial();
        return ResponseEntity.ok(resultado);
    }

    // POST: activa una alerta climática según el tipo recibido
    @PostMapping("/alerta-climatica")
    public ResponseEntity<?> activarAlerta(@RequestBody Map<String, String> body) {
        String tipo = body.get("tipo");
        AlertaClimatica alerta = servicioParque.activarAlertaClimatica(tipo);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Alerta activada",
                "tipo", alerta.getTipo(),
                "atraccionesAfectadas", alerta.getAtraccionesAfectadas().size()
        ));
    }

    // GET: genera y retorna un reporte de la jornada
    @GetMapping("/reporte")
    public ResponseEntity<?> getReporte() {
        ReporteJornada reporte = servicioParque.getParque().generarReporte();
        return ResponseEntity.ok(Map.of(
                "fecha", reporte.getFecha().toString(),
                "ingresosDiarios", reporte.getIngresosDiarios(),
                "cierresPorClima", reporte.getCierresPorClima().size(),
                "alertasMantenimiento", reporte.getAlertasMantenimiento().size()
        ));
    }

    // GET /api/parque/mapa
    @GetMapping("/mapa")
    public ResponseEntity<?> getMapa() {
        GrafoParque grafo = servicioParque.getParque().getGrafoParque();
        return ResponseEntity.ok(Map.of(
                "nodos", grafo.getNodosParaMapa(),
                "aristas", grafo.getAristasParaMapa()
        ));
    }

    // GET /api/parque/ruta-optima
    @GetMapping("/ruta-optima")
    public ResponseEntity<?> getRutaOptima(
            @RequestParam String origen,
            @RequestParam String destino) {
        GrafoParque grafo = servicioParque.getParque().getGrafoParque();
        List<Atraccion> ruta = grafo.rutaOptima(origen, destino);

        List<Map<String, Object>> resultado = ruta.stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "nombre", a.getNombre(),
                        "estado", a.getEstado()
                ))
                .toList();

        return ResponseEntity.ok(Map.of(
                "origen", origen,
                "destino", destino,
                "ruta", resultado,
                "pasos", resultado.size()
        ));
    }
}