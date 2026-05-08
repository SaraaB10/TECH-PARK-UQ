package techpark_uq.controlador;


import techpark_uq.modelo.AlertaClimatica;
import techpark_uq.servicio.ServicioParque;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alertas")
public class AlertaController {

    private final ServicioParque servicioParque;

    public AlertaController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET /api/alertas/mantenimiento
    // Lista todas las alertas de mantenimiento
    @GetMapping("/mantenimiento")
    public ResponseEntity<List<Map<String, Object>>> getAlertasMantenimiento() {
        return ResponseEntity.ok(
                servicioParque.obtenerAlertasMantenimiento()
        );
    }

    // GET /api/alertas/mantenimiento/pendientes
    // Solo las alertas sin resolver
    @GetMapping("/mantenimiento/pendientes")
    public ResponseEntity<List<Map<String, Object>>> getAlertasPendientes() {
        List<Map<String, Object>> todas =
                servicioParque.obtenerAlertasMantenimiento();
        List<Map<String, Object>> pendientes = todas.stream()
                .filter(a -> !(boolean) a.get("resuelta"))
                .toList();
        return ResponseEntity.ok(pendientes);
    }
}
