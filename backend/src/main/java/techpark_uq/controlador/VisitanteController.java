package techpark_uq.controlador;

import techpark_uq.modelo.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import techpark_uq.servicio.ServicioParque;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/visitantes")

public class VisitanteController {

    private final ServicioParque servicioParque;

    // Constructor
    public VisitanteController(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    // GET: lista todos los visitantes registrados
    @GetMapping
    public ResponseEntity<?> listarTodos() {
        List<Map<String, Object>> resultado = servicioParque.getParque().getVisitantes()
                .stream()
                .map(v -> {
                    String tipoTicket = "GENERAL";
                    if (v.getTicket() != null) {
                        tipoTicket = v.getTicket().getTipo().name();
                    }
                    return Map.<String, Object>of(
                            "id",          v.getId(),
                            "nombre",      v.getNombre(),
                            "email",       v.getEmail(),
                            "edad",        v.getEdad(),
                            "tipoTicket",  tipoTicket,
                            "saldo",       v.getSaldoVirtual()
                    );
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(resultado);
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

    // POST: login de visitante por email y contraseña
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body) {
        String email     = (String) body.get("email");
        String contrasena = (String) body.get("contrasena");

        if (email == null || contrasena == null)
            return ResponseEntity.badRequest().body("Email y contraseña son obligatorios");

        Visitante visitante = servicioParque.getParque().getVisitantes().stream()
                .filter(v -> email.equals(v.getEmail()) && contrasena.equals(v.getContrasena()))
                .findFirst().orElse(null);

        if (visitante == null)
            return ResponseEntity.status(401).body("Credenciales incorrectas");

        String tipoTicket = "GENERAL";
        if (visitante.getTicket() != null) {
            tipoTicket = visitante.getTicket().getTipo().name();
        }

        return ResponseEntity.ok(Map.of(
                "idVisitante", visitante.getId(),
                "nombre",      visitante.getNombre(),
                "email",       visitante.getEmail(),
                "tipoTicket",  tipoTicket,
                "saldo",       visitante.getSaldoVirtual()
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
                        .filter(o -> o instanceof Atraccion)
                        .map(o -> ((Atraccion) o).getNombre())
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