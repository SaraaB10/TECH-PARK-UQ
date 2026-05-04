package techpark_uq.controlador;
import techpark_uq.modelo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import techpark_uq.servicio.ServicioParque;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/atracciones")
@CrossOrigin(origins = "http://localhost:5173")
public class AtraccionController {

    private final ServicioParque servicioParque;

    public AtraccionController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET /api/atracciones
    @GetMapping
    public ResponseEntity<?> listarTodas() {
        List<Map<String, Object>> resultado = servicioParque
                .obtenerTodasLasAtracciones().stream()
                .map(a -> Map.<String, Object>of(
                        "id", a.getId(),
                        "nombre", a.getNombre(),
                        "tipo", a.getTipo(),
                        "estado", a.getEstado(),
                        "contadorVisitantes", a.getContadorVisitantes(),
                        "tiempoEsperaEstimado", a.getTiempoEsperaEstimado(),
                        "alturaMinima", a.getAlturaMinima(),
                        "edadMinima", a.getEdadMinima(),
                        "costoAdicional", a.getCostoAdicional()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    // POST /api/atracciones/{id}/ingresar
    @PostMapping("/{id}/ingresar")
    public ResponseEntity<String> ingresarAtraccion(
            @PathVariable String id,
            @RequestParam String idVisitante) {
        String resultado = servicioParque.validarAcceso(id, idVisitante);
        return ResponseEntity.ok(resultado);
    }

    // POST /api/atracciones/{id}/procesar-cola
    @PostMapping("/{id}/procesar-cola")
    public ResponseEntity<?> procesarCola(@PathVariable String id) {
        Visitante siguiente = servicioParque.procesarCola(id);
        if (siguiente == null) {
            return ResponseEntity.ok(Map.of("mensaje", "Cola vacía"));
        }
        return ResponseEntity.ok(Map.of(
                "mensaje", "Visitante procesado",
                "visitante", siguiente.getNombre()
        ));
    }

    // PUT /api/atracciones/{id}/estado
    @PutMapping("/{id}/estado")
    public ResponseEntity<String> cambiarEstado(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String resultado = servicioParque.cambiarEstadoAtraccion(id, body.get("estado"));
        return ResponseEntity.ok(resultado);
    }

    // POST /api/atracciones/{id}/revision-tecnica
    @PostMapping("/{id}/revision-tecnica")
    public ResponseEntity<String> revisionTecnica(@PathVariable String id) {
        String resultado = servicioParque.registrarRevisionTecnica(id);
        return ResponseEntity.ok(resultado);
    }

    // GET /api/atracciones/{id}/cola
    @GetMapping("/{id}/cola")
    public ResponseEntity<?> verCola(@PathVariable String id) {
        Atraccion atraccion = servicioParque.buscarAtraccion(id);
        if (atraccion == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of(
                "atraccion", atraccion.getNombre(),
                "visitantesEnCola", atraccion.getColaVirtual().tamano()
        ));
    }
}
