package techpark_uq.controlador;

import techpark_uq.modelo.Atraccion;
import techpark_uq.modelo.Zona;
import techpark_uq.servicio.ServicioParque;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/zonas")

public class ZonaController {

    private final ServicioParque servicioParque;

    public ZonaController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET /api/zonas
    @GetMapping
    public ResponseEntity<?> listarTodas() {
        List<Map<String, Object>> resultado = servicioParque
                .obtenerTodasLasZonas().stream()
                .map(z -> Map.<String, Object>of(
                        "id", z.getId(),
                        "nombre", z.getNombre(),
                        "capacidadMaxima", z.getCapacidadMaxima(),
                        "visitantesActuales", z.getVisitantesActuales(),
                        "cantidadAtracciones", z.getAtracciones().size(),
                        "estaLlena", z.estaLlena()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    // GET /api/zonas/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id) {
        Zona zona = servicioParque.obtenerZonaPorId(id);
        if (zona == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of(
                "id", zona.getId(),
                "nombre", zona.getNombre(),
                "capacidadMaxima", zona.getCapacidadMaxima(),
                "visitantesActuales", zona.getVisitantesActuales(),
                "estaLlena", zona.estaLlena()
        ));
    }

    // GET /api/zonas/{id}/atracciones
    @GetMapping("/{id}/atracciones")
    public ResponseEntity<?> obtenerAtracciones(@PathVariable String id) {
        Zona zona = servicioParque.obtenerZonaPorId(id);
        if (zona == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> atracciones = zona.getAtracciones()
                .stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "nombre", a.getNombre(),
                        "estado", a.getEstado(),
                        "tipo", a.getTipo(),
                        "visitantes", a.getColaVirtual().tamano()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "zona", zona.getNombre(),
                "atracciones", atracciones
        ));
    }

    // POST /api/zonas
    @PostMapping
    public ResponseEntity<String> crearZona(@RequestBody Map<String, Object> body) {
        String resultado = servicioParque.crearZona(
                (String) body.get("id"),
                (String) body.get("nombre"),
                (Integer) body.get("capacidadMaxima")
        );
        return ResponseEntity.ok(resultado);
    }

    // GET /api/zonas/{id}/operadores
    @GetMapping("/{id}/operadores")
    public ResponseEntity<?> obtenerOperadores(@PathVariable String id) {
        Zona zona = servicioParque.obtenerZonaPorId(id);
        if (zona == null) return ResponseEntity.notFound().build();

        Object[] operadores = zona.getOperadoresAsignados().obtenerTodos();
        return ResponseEntity.ok(Map.of(
                "zona", zona.getNombre(),
                "totalOperadores", operadores.length
        ));
    }
}
