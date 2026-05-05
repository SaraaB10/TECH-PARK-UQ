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

    // Obtener los nodos para el mapa
    public List<Map<String, Object>> getNodosParaMapa() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Atraccion a : nodos.values()) {
            Map<String, Object> nodo = new HashMap<>();
            nodo.put("id", a.getId());
            nodo.put("nombre", a.getNombre());
            nodo.put("estado", a.getEstado().toString());
            nodo.put("tipo", a.getTipo().toString());
            resultado.add(nodo);
        }
        return resultado;
    }

    // Obtener las aristas para el mapa
    public List<Map<String, Object>> getAristasParaMapa() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (String idOrigen : grafo.obtenerNodos()) {
            for (Grafo.Arista<String> arista : grafo.obtenerVecinos(idOrigen)) {
                Map<String, Object> aristaMap = new HashMap<>();
                aristaMap.put("from", idOrigen);
                aristaMap.put("to", arista.destino);
                aristaMap.put("peso", arista.peso);
                resultado.add(aristaMap);
            }
        }
        return resultado;
    }

    public Map<String, Atraccion> getNodos() { return nodos; }
    public Grafo<String> getGrafo() { return grafo; }
}
