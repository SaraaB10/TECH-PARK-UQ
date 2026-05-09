package techpark_uq.servicio;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import techpark_uq.enums.TipoAtraccion;
import techpark_uq.modelo.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import java.io.InputStream;

@Service
public class ServicioCargaJson {

    private final ServicioParque servicioParque;
    private final ObjectMapper objectMapper;
    private boolean cargado = false;

    // Constructor que inicializa el servicio y el lector JSON
    public ServicioCargaJson(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
        this.objectMapper = new ObjectMapper();
    }

    public String cargarDesdeJson() {
        if (cargado) return "El escenario ya fue cargado anteriormente";

        try {
            // Leer el archivo JSON desde resources/datos/
            ClassPathResource resource =
                    new ClassPathResource("datos/escenario.json");
            InputStream inputStream = resource.getInputStream();
            JsonNode root = objectMapper.readTree(inputStream);

            TechParkUQ parque = servicioParque.getParque();
            int zonas = 0, atracciones = 0, operadores = 0, visitantes = 0;

            // Cargar Zonas registradas en el archivo JSON
            for (JsonNode z : root.get("zonas")) {
                Zona zona = new Zona(
                        z.get("id").asText(),
                        z.get("nombre").asText(),
                        z.get("capacidadMaxima").asInt()
                );
                parque.agregarZona(zona);
                zonas++;
            }

            // Cargar Atracciones y las asigna a su zona correspondiente
            for (JsonNode a : root.get("atracciones")) {
                Atraccion atraccion = new Atraccion(
                        a.get("id").asText(),
                        a.get("nombre").asText(),
                        TipoAtraccion.valueOf(a.get("tipo").asText()),
                        a.get("capacidadMaximaPorCiclo").asInt(),
                        a.get("alturaMinima").asDouble(),
                        a.get("edadMinima").asInt(),
                        a.get("costoAdicional").asDouble()
                );
                parque.agregarAtraccionAZona(
                        atraccion, a.get("idZona").asText()
                );
                atracciones++;
            }

            // Cargar Operadores y los asigna a una zona del parque
            for (JsonNode op : root.get("operadores")) {
                String resultado = servicioParque.crearOperador(
                        op.get("id").asText(),
                        op.get("nombre").asText(),
                        op.get("edad").asInt(),
                        op.get("telefono").asText(),
                        op.get("email").asText(),
                        op.get("contrasena").asText()
                );
                servicioParque.asignarOperadorAZona(
                        op.get("id").asText(),
                        op.get("idZona").asText()
                );
                operadores++;
            }

            // Cargar Visitantes y les asigna un tipo de ticket
            for (JsonNode v : root.get("visitantes")) {
                Visitante visitante = new Visitante(
                        v.get("id").asText(),
                        v.get("nombre").asText(),
                        v.get("edad").asInt(),
                        v.get("telefono").asText(),
                        v.get("email").asText(),
                        v.get("contrasena").asText(),
                        v.get("estatura").asDouble(),
                        v.get("saldoVirtual").asDouble()
                );
                servicioParque.venderTicket(
                        visitante, v.get("tipoTicket").asText()
                );
                visitantes++;
            }

            // Cargar Senderos en el Grafo
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

            // Marca el escenario como cargado correctamente
            cargado = true;
            // Retorna un resumen de los datos cargados desde el JSON
            return String.format(
                    "Escenario cargado desde JSON: %d zonas, %d atracciones, " +
                            "%d operadores, %d visitantes",
                    zonas, atracciones, operadores, visitantes
            );

            // Captura y retorna errores durante la carga del escenario
        } catch (Exception e) {
            return "Error al cargar el escenario: " + e.getMessage();
        }
    }

    // Verifica si el escenario ya fue cargado previamente
    public boolean isCargado() {
        return cargado;
    }

    // Reinicia el estado de carga del escenario
    public void resetear() {
        cargado = false;
    }

}