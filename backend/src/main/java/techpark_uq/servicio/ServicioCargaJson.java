package techpark_uq.servicio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import techpark_uq.enums.TipoAtraccion;
import techpark_uq.modelo.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.InputStream;
import java.util.List;

@Service
public class ServicioCargaJson {

    private final ServicioParque servicioParque;
    private final ObjectMapper objectMapper;
    private boolean cargado = false;

    public ServicioCargaJson(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
        this.objectMapper = new ObjectMapper();
    }

    public String cargarDesdeJson() {
        // Guarda de idempotencia: rechaza la carga si ya se ejecutó antes.
        if (cargado) return "El escenario ya fue cargado anteriormente";

        try {
            ClassPathResource resource =
                    new ClassPathResource("datos/escenario.json");
            InputStream inputStream = resource.getInputStream();
            JsonNode root = objectMapper.readTree(inputStream);

            TechParkUQ parque = servicioParque.getParque();
            int zonas = 0, atracciones = 0, operadores = 0, visitantes = 0;

            // ── Zonas: insertar solo si el ID no existe aún ───────────────────
            for (JsonNode z : root.get("zonas")) {
                String id = z.get("id").asText();
                boolean yaExiste = parque.getZonas().stream()
                        .anyMatch(zona -> zona.getId().equals(id));
                if (yaExiste) continue;

                parque.agregarZona(new Zona(
                        id,
                        z.get("nombre").asText(),
                        z.get("capacidadMaxima").asInt()
                ));
                zonas++;
            }

            // ── Atracciones: insertar solo si el ID no existe aún ─────────────
            for (JsonNode a : root.get("atracciones")) {
                String id = a.get("id").asText();
                boolean yaExiste = parque.obtenerTodasLasAtracciones().stream()
                        .anyMatch(atr -> atr.getId().equals(id));
                if (yaExiste) continue;

                parque.agregarAtraccionAZona(
                        new Atraccion(
                                id,
                                a.get("nombre").asText(),
                                TipoAtraccion.valueOf(a.get("tipo").asText()),
                                a.get("capacidadMaximaPorCiclo").asInt(),
                                a.get("alturaMinima").asDouble(),
                                a.get("edadMinima").asInt(),
                                a.get("costoAdicional").asDouble()
                        ),
                        a.get("idZona").asText()
                );
                atracciones++;
            }

            // ── Operadores: insertar solo si el ID no existe aún ─────────────
            for (JsonNode op : root.get("operadores")) {
                String id = op.get("id").asText();
                Object[] empleados = parque.getEmpleados().obtenerTodos();
                boolean yaExiste = false;
                for (Object e : empleados) {
                    if (e instanceof Operador existente
                            && existente.getId().equals(id)) {
                        yaExiste = true;
                        break;
                    }
                }
                if (yaExiste) continue;

                servicioParque.crearOperador(
                        id,
                        op.get("nombre").asText(),
                        op.get("edad").asInt(),
                        op.get("telefono").asText(),
                        op.get("email").asText(),
                        op.get("contrasena").asText()
                );
                servicioParque.asignarOperadorAZona(id, op.get("idZona").asText());
                operadores++;
            }

            // ── Visitantes: insertar solo si el ID no existe aún ─────────────
            for (JsonNode v : root.get("visitantes")) {
                String id = v.get("id").asText();
                boolean yaExiste = parque.getVisitantes().stream()
                        .anyMatch(vis -> vis.getId().equals(id));
                if (yaExiste) continue;

                Visitante visitante = new Visitante(
                        id,
                        v.get("nombre").asText(),
                        v.get("edad").asInt(),
                        v.get("telefono").asText(),
                        v.get("email").asText(),
                        v.get("contrasena").asText(),
                        v.get("estatura").asDouble(),
                        v.get("saldoVirtual").asDouble()
                );
                servicioParque.venderTicket(visitante, v.get("tipoTicket").asText());
                visitantes++;
            }

            // ── Grafo / senderos ──────────────────────────────────────────────
            // agregarAtraccion en el grafo debe ignorar nodos ya registrados.
            // conectarAtracciones sobreescribe el peso si la arista ya existe,
            // lo cual es seguro (idempotente en valor).
            GrafoParque grafo = parque.getGrafoParque();
            for (Atraccion a : parque.obtenerTodasLasAtracciones()) {
                grafo.agregarAtraccion(a);
            }
            for (JsonNode s : root.get("senderos")) {
                parque.conectarAtracciones(
                        s.get("origen").asText(),
                        s.get("destino").asText(),
                        s.get("distancia").asDouble()
                );
            }

            // ── Colas iniciales: solo agregar si el visitante no está en cola ─
            List<Visitante> todosVisitantes  = parque.getVisitantes();
            List<Atraccion> todasAtracciones = parque.obtenerTodasLasAtracciones();
            for (int i = 0; i < todosVisitantes.size() && i < todasAtracciones.size(); i++) {
                Visitante v    = todosVisitantes.get(i);
                Atraccion a    = todasAtracciones.get(i);
                boolean cumple = v.getEstatura() >= a.getAlturaMinima()
                        && v.getEdad()     >= a.getEdadMinima();
                // Verificar también que no esté ya en la cola para evitar duplicados
                if (cumple && !a.getColaVirtual().estaEnCola(v)) {
                    servicioParque.validarAcceso(a.getId(), v.getId());
                }
            }

            // Marcar como cargado solo al final, cuando todo fue exitoso.
            // (el flag aparecía duplicado en la versión original — eliminado)
            cargado = true;

            return String.format(
                    "Escenario cargado desde JSON: %d zonas, %d atracciones, " +
                            "%d operadores, %d visitantes",
                    zonas, atracciones, operadores, visitantes
            );

        } catch (Exception e) {
            return "Error al cargar el escenario: " + e.getMessage();
        }
    }

    /** Verifica si el escenario ya fue cargado previamente. */
    public boolean isCargado() {
        return cargado;
    }

    /** Reinicia el estado de carga del escenario (útil en tests). */
    public void resetear() {
        cargado = false;
    }
}