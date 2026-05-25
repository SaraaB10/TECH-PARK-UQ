package techpark_uq.controlador;

import techpark_uq.servicio.ServicioReporte;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/reportes")

public class ReporteController {

    private final ServicioReporte servicioReporte;

    public ReporteController(ServicioReporte servicioReporte) {
        this.servicioReporte = servicioReporte;
    }

    // GET /api/reportes/jornada
    // Reporte completo con todas las estadísticas del día
    @GetMapping("/jornada")
    public ResponseEntity<Map<String, Object>> getReporteJornada() {
        return ResponseEntity.ok(servicioReporte.generarReporteCompleto());
    }

    // GET /api/reportes/resumen
    // Resumen rápido para el dashboard del frontend
    @GetMapping("/resumen")
    public ResponseEntity<Map<String, Object>> getResumen() {
        return ResponseEntity.ok(servicioReporte.resumenRapido());
    }
}