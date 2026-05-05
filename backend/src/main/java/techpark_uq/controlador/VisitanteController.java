package techpark_uq.controlador;

import techpark_uq.modelo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import techpark_uq.servicio.ServicioParque;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visitantes")
@CrossOrigin(origins = "http://localhost:5173")
public class VisitanteController {

    private final ServicioParque servicioParque;

    // Constructor
    public VisitanteController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // POST: registra un nuevo visitante y genera su ticket
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody Map<String, Object> body) {

        // Construcción del visitante con datos recibidos
        Visitante v = new Visitante(
                "V-" + System.currentTimeMillis(),
                (String) body.get("nombre"),
                (Integer) body.get("edad"),
                (String) body.get("telefono"),
                (String) body.get("email"),
                (String) body.get("contrasena"),
                ((Number) body.get("estatura")).doubleValue(),
                ((Number) body.get("saldoVirtual")).doubleValue()
        );

        // Venta de ticket (control de aforo)
        Ticket ticket = servicioParque.venderTicket(v, (String) body.get("tipoTicket"));

        // Si no hay capacidad disponible
        if (ticket == null) return ResponseEntity.badRequest().body("Aforo completo");

        // Retorna datos del visitante y ticket generado
        return ResponseEntity.ok(Map.of(
                "mensaje", "Visitante registrado correctamente",
                "idVisitante", v.getId(),
                "idTicket", ticket.getId(),
                "tipoTicket", ticket.getTipo()
        ));
    }

    // GET: obtiene el historial de visitas de un visitante
    @GetMapping("/{id}/historial")
    public ResponseEntity<?> getHistorial(@PathVariable String id) {
        Visitante visitante = servicioParque.buscarVisitante(id);

        // Si el visitante no existe
        if (visitante == null) return ResponseEntity.notFound().build();

        // Convierte el historial a lista de strings
        Object[] historial = visitante.getHistorialVisitas().obtenerTodos();
        return ResponseEntity.ok(Map.of(
                "visitante", visitante.getNombre(),
                "historial", Arrays.stream(historial)
                        .map(Object::toString)
                        .collect(Collectors.toList())
        ));
    }

    // POST: agrega una atracción a favoritos del visitante
    @PostMapping("/{id}/favorito")
    public ResponseEntity<String> agregarFavorito(
            @PathVariable String id,
            @RequestParam String idAtraccion) {
        String resultado = servicioParque.agregarFavorito(id, idAtraccion);
        return ResponseEntity.ok(resultado);
    }

    // GET: consulta el saldo virtual del visitante
    @GetMapping("/{id}/saldo")
    public ResponseEntity<?> getSaldo(@PathVariable String id) {
        Visitante visitante = servicioParque.buscarVisitante(id);

        // Si el visitante no existe
        if (visitante == null) return ResponseEntity.notFound().build();

        // Retorna saldo actual
        return ResponseEntity.ok(Map.of(
                "visitante", visitante.getNombre(),
                "saldo", visitante.getSaldoVirtual()
        ));
    }
}