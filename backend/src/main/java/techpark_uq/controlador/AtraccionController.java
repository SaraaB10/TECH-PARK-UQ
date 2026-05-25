package techpark_uq.controlador;

import techpark_uq.enums.TipoAtraccion;
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

    // POST: crea una nueva atracción, la agrega a una zona y la conecta al grafo
    @PostMapping
    public ResponseEntity<String> crearAtraccion(@RequestBody Map<String, Object> body) {
        String id     = (String) body.get("id");
        String nombre = (String) body.get("nombre");
        String tipo   = (String) body.get("tipo");
        String zonaId = (String) body.get("zonaId");

        if (id == null || nombre == null || zonaId == null)
            return ResponseEntity.badRequest().body("id, nombre y zonaId son obligatorios");

        int    capacidad  = body.get("capacidadMaxima")      != null ? ((Number) body.get("capacidadMaxima")).intValue()      : 20;
        double altura     = body.get("alturaMinima")          != null ? ((Number) body.get("alturaMinima")).doubleValue()      : 0;
        int    edad       = body.get("edadMinima")            != null ? ((Number) body.get("edadMinima")).intValue()           : 0;
        int    tiempoEsp  = body.get("tiempoEsperaEstimado") != null ? ((Number) body.get("tiempoEsperaEstimado")).intValue() : 0;
        double distancia  = body.get("distancia")            != null ? ((Number) body.get("distancia")).doubleValue()         : 50;

        techpark_uq.enums.TipoAtraccion tipoEnum;
        try {
            tipoEnum = techpark_uq.enums.TipoAtraccion.valueOf(tipo != null ? tipo : "OTRO");
        } catch (IllegalArgumentException ex) {
            tipoEnum = techpark_uq.enums.TipoAtraccion.OTRO;
        }

        Atraccion nueva = new Atraccion(id, nombre, tipoEnum, capacidad, altura, edad, tiempoEsp);
        String resultado = servicioParque.crearAtraccionEnZona(nueva, zonaId, distancia);
        return ResponseEntity.ok(resultado);
    }
}