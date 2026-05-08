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

    // POST /api/alertas/mantenimiento/{idAlerta}/resolver
    // Operador resuelve una alerta y reactiva la atracción
    @PostMapping("/mantenimiento/{idAlerta}/resolver")
    public ResponseEntity<String> resolverAlerta(@PathVariable String idAlerta) {
        String resultado = servicioParque.resolverAlertaMantenimiento(idAlerta);
        return ResponseEntity.ok(resultado);
    }

    // GET /api/alertas/climaticas
    // Lista todas las alertas climáticas registradas
    @GetMapping("/climaticas")
    public ResponseEntity<List<Map<String, Object>>> getAlertasClimaticas() {
        return ResponseEntity.ok(
                servicioParque.obtenerAlertasClimaticas()
        );
    }

    // GET /api/alertas/climaticas/activas
    // Solo las alertas climáticas activas en este momento
    @GetMapping("/climaticas/activas")
    public ResponseEntity<List<Map<String, Object>>> getAlertasClimaticasActivas() {
        List<Map<String, Object>> todas =
                servicioParque.obtenerAlertasClimaticas();
        List<Map<String, Object>> activas = todas.stream()
                .filter(a -> (boolean) a.get("activa"))
                .toList();
        return ResponseEntity.ok(activas);
    }

    // POST /api/alertas/climaticas
    // Activar nueva alerta climática
    @PostMapping("/climaticas")
    public ResponseEntity<?> activarAlertaClimatica(
            @RequestBody Map<String, String> body) {
        String tipo = body.get("tipo");
        AlertaClimatica alerta = servicioParque.activarAlertaClimatica(tipo);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Alerta climática activada",
                "id", alerta.getId(),
                "tipo", alerta.getTipo(),
                "atraccionesAfectadas", alerta.getAtraccionesAfectadas().size()
        ));
    }

    // POST /api/alertas/climaticas/{idAlerta}/desactivar
    // Desactivar una alerta y reabrir atracciones
    @PostMapping("/climaticas/{idAlerta}/desactivar")
    public ResponseEntity<String> desactivarAlertaClimatica(
            @PathVariable String idAlerta) {
        String resultado = servicioParque.desactivarAlertaClimatica(idAlerta);
        return ResponseEntity.ok(resultado);
    }

    // GET /api/alertas/notificaciones/{idVisitante}
    // Notificaciones recibidas por un visitante
    @GetMapping("/notificaciones/{idVisitante}")
    public ResponseEntity<List<Map<String, Object>>> getNotificaciones(
            @PathVariable String idVisitante) {
        return ResponseEntity.ok(
                servicioParque.obtenerNotificaciones(idVisitante)
        );
    }
}
