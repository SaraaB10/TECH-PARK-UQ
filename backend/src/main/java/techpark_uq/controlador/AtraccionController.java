package techpark_uq.controlador;

import techpark_uq.modelo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import techpark_uq.servicio.ServicioParque;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/atracciones")

public class AtraccionController {

    private final ServicioParque servicioParque;

    // Constructor
    public AtraccionController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET: lista todas las atracciones con sus datos principales
    // Cambios respecto al original:
    // + visitantesEnCola  → tamaño real de la ColaVirtual (lo que la UI necesita para mostrar ocupación)
    // + zona              → nombre de la zona (para agrupación en frontend)
    // - costoAdicional    → eliminado de la respuesta (la cola no cobra extra al visitante)
    @GetMapping
    public ResponseEntity<?> listarTodas() {
        List<Map<String, Object>> resultado = servicioParque
                .obtenerTodasLasAtracciones().stream()
                .map(a -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",                   a.getId());
                    m.put("nombre",               a.getNombre());
                    m.put("tipo",                 a.getTipo());
                    m.put("estado",               a.getEstado());
                    m.put("contadorVisitantes",   a.getContadorVisitantes());
                    m.put("visitantesEnCola",     a.getColaVirtual().tamano());
                    m.put("tiempoEsperaEstimado", a.getTiempoEsperaEstimado());
                    m.put("alturaMinima",         a.getAlturaMinima());
                    m.put("edadMinima",           a.getEdadMinima());
                    m.put("zona",                 a.getZona() != null ? a.getZona().getNombre() : "");
                    m.put("zonaId",               a.getZona() != null ? a.getZona().getId()     : "");
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
    }

    // POST: valida e ingresa un visitante a una atracción
    @PostMapping("/{id}/ingresar")
    public ResponseEntity<String> ingresarAtraccion(
            @PathVariable String id,
            @RequestParam String idVisitante) {
        String resultado = servicioParque.validarAcceso(id, idVisitante);
        return ResponseEntity.ok(resultado);
    }

    // POST: procesa el siguiente visitante en la cola virtual
    @PostMapping("/{id}/procesar-cola")
    public ResponseEntity<?> procesarCola(@PathVariable String id) {
        Visitante siguiente = servicioParque.procesarCola(id);

        // Si no hay visitantes en cola
        if (siguiente == null) {
            return ResponseEntity.ok(Map.of("mensaje", "Cola vacía"));
        }

        // Retorna el visitante procesado
        return ResponseEntity.ok(Map.of(
                "mensaje", "Visitante procesado",
                "visitante", siguiente.getNombre()
        ));
    }

    // PUT: cambia el estado de una atracción
    @PutMapping("/{id}/estado")
    public ResponseEntity<String> cambiarEstado(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String resultado = servicioParque.cambiarEstadoAtraccion(id, body.get("estado"));
        return ResponseEntity.ok(resultado);
    }

    // POST: registra una revisión técnica en la atracción
    @PostMapping("/{id}/revision-tecnica")
    public ResponseEntity<String> revisionTecnica(@PathVariable String id) {
        String resultado = servicioParque.registrarRevisionTecnica(id);
        return ResponseEntity.ok(resultado);
    }

    // GET: consulta la cantidad de visitantes en la cola de una atracción
    @GetMapping("/{id}/cola")
    public ResponseEntity<?> verCola(@PathVariable String id) {
        Atraccion atraccion = servicioParque.buscarAtraccion(id);

        if (atraccion == null) return ResponseEntity.notFound().build();

        return ResponseEntity.ok(Map.of(
                "atraccion",       atraccion.getNombre(),
                "visitantesEnCola", atraccion.getColaVirtual().tamano(),
                "tiempoEsperaEstimado", atraccion.getTiempoEsperaEstimado()
        ));
    }
}