package techpark_uq.modelo;

import techpark_uq.estructuras.Grafo;
import java.util.*;

public class GrafoParque {
    private Grafo<String> grafo;
    private Map<String, Atraccion> nodos;

    public GrafoParque() {
        this.grafo = new Grafo<>(false);
        this.nodos = new HashMap<>();
    }

    // Agregar una nueva atraccion al grafo
    public void agregarAtraccion(Atraccion atraccion) {
        grafo.agregarNodo(atraccion.getId());
        nodos.put(atraccion.getId(), atraccion);
    }

    //Agregar una nueva arista al grafo
    public void agregarSendero(String idOrigen, String idDestino, double distancia) {
        grafo.agregarArista(idOrigen, idDestino, distancia);
    }

    // Ruta optima con Dijkstra
    public List<Atraccion> rutaOptima(String idOrigen, String idDestino) {
        List<String> ids = grafo.rutaOptima(idOrigen, idDestino);
        List<Atraccion> ruta = new ArrayList<>();
        for (String id : ids) {
            Atraccion a = nodos.get(id);
            if (a != null) ruta.add(a);
        }
        return ruta;
    }

}
