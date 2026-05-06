package techpark_uq.controlador;

import techpark_uq.modelo.Operador;
import techpark_uq.servicio.ServicioParque;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/operadores")
@CrossOrigin(origins = "http://localhost:5173")
public class OperadorController {

    private final ServicioParque servicioParque;

    public OperadorController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET /api/operadores
    @GetMapping
    public ResponseEntity<?> listarTodos() {
        List<Map<String, Object>> resultado = servicioParque
                .obtenerTodosLosOperadores().stream()
                .map(op -> Map.<String, Object>of(
                        "id", op.getId(),
                        "nombre", op.getNombre(),
                        "edad", op.getEdad(),
                        "email", op.getEmail(),
                        "zonaAsignada", op.getZonaAsignada() != null
                                ? op.getZonaAsignada().getNombre()
                                : "Sin zona asignada"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    // GET /api/operadores/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPorId(@PathVariable String id) {
        Operador op = servicioParque.obtenerOperadorPorId(id);
        if (op == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of(
                "id", op.getId(),
                "nombre", op.getNombre(),
                "edad", op.getEdad(),
                "email", op.getEmail(),
                "telefono", op.getTelefono(),
                "zonaAsignada", op.getZonaAsignada() != null
                        ? op.getZonaAsignada().getNombre()
                        : "Sin zona asignada"
        ));
    }

    // POST /api/operadores
    @PostMapping
    public ResponseEntity<String> crearOperador(@RequestBody Map<String, Object> body) {
        String resultado = servicioParque.crearOperador(
                (String) body.get("id"),
                (String) body.get("nombre"),
                (Integer) body.get("edad"),
                (String) body.get("telefono"),
                (String) body.get("email"),
                (String) body.get("contrasena")
        );
        return ResponseEntity.ok(resultado);
    }

    // POST /api/operadores/{id}/asignar-zona
    @PostMapping("/{id}/asignar-zona")
    public ResponseEntity<String> asignarZona(
            @PathVariable String id,
            @RequestParam String idZona) {
        String resultado = servicioParque.asignarOperadorAZona(id, idZona);
        return ResponseEntity.ok(resultado);
    }

    // DELETE /api/operadores/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarOperador(@PathVariable String id) {
        String resultado = servicioParque.eliminarOperador(id);
        return ResponseEntity.ok(resultado);
    }

    // GET /api/operadores/{id}/atracciones
    @GetMapping("/{id}/atracciones")
    public ResponseEntity<?> obtenerAtracciones(@PathVariable String id) {
        Operador op = servicioParque.obtenerOperadorPorId(id);
        if (op == null) return ResponseEntity.notFound().build();

        Object[] atracciones = op.getAtraccionesResponsable().obtenerTodos();
        return ResponseEntity.ok(Map.of(
                "operador", op.getNombre(),
                "totalAtracciones", atracciones.length
        ));
    }
}
