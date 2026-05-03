package techpark_uq.estructuras;
import java.util.*;

public class Grafo<T> {

    // ─── Arista interna ─────────────────────────────────────────
    public static class Arista<T> {
        T destino;
        double peso;

        public Arista(T destino, double peso) {
            this.destino = destino;
            this.peso = peso;
        }
    }

    // ─── Atributos ──────────────────────────────────────────────
    private final Map<T, List<Arista<T>>> listaAdyacencia;
    private final boolean dirigido;

    // ─── Constructor ────────────────────────────────────────────
    public Grafo(boolean dirigido) {
        this.listaAdyacencia = new HashMap<>();
        this.dirigido = dirigido;
    }

    // ─── Métodos ────────────────────────────────────────────────

    // Agrega un nodo al grafo
    public void agregarNodo(T nodo) {
        listaAdyacencia.putIfAbsent(nodo, new ArrayList<>());
    }

    // Agrega una arista entre dos nodos
    public void agregarArista(T origen, T destino, double peso) {
        listaAdyacencia.putIfAbsent(origen, new ArrayList<>());
        listaAdyacencia.putIfAbsent(destino, new ArrayList<>());
        listaAdyacencia.get(origen).add(new Arista<>(destino, peso));
        if (!dirigido) {
            listaAdyacencia.get(destino).add(new Arista<>(origen, peso));
        }
    }

    // Elimina un nodo y todas sus aristas
    public void eliminarNodo(T nodo) {
        listaAdyacencia.remove(nodo);
        for (List<Arista<T>> aristas : listaAdyacencia.values()) {
            aristas.removeIf(a -> a.destino.equals(nodo));
        }
    }

    // Retorna los vecinos de un nodo
    public List<Arista<T>> obtenerVecinos(T nodo) {
        return listaAdyacencia.getOrDefault(nodo, new ArrayList<>());
    }

    // Retorna todos los nodos
    public Set<T> obtenerNodos() {
        return listaAdyacencia.keySet();
    }

    // Verifica si existe un nodo
    public boolean contieneNodo(T nodo) {
        return listaAdyacencia.containsKey(nodo);
    }

    // BFS — recorrido por anchura
    public List<T> bfs(T origen) {
        List<T> visitados = new ArrayList<>();
        if (!contieneNodo(origen)) return visitados;

        Queue<T> cola = new LinkedList<>();
        Set<T> vistos = new HashSet<>();

        cola.add(origen);
        vistos.add(origen);

        while (!cola.isEmpty()) {
            T actual = cola.poll();
            visitados.add(actual);
            for (Arista<T> arista : obtenerVecinos(actual)) {
                if (!vistos.contains(arista.destino)) {
                    vistos.add(arista.destino);
                    cola.add(arista.destino);
                }
            }
        }
        return visitados;
    }

    // Dijkstra — ruta más corta entre origen y destino
    public Map<T, Double> dijkstra(T origen) {
        Map<T, Double> distancias = new HashMap<>();
        PriorityQueue<T> pq = new PriorityQueue<>(
                Comparator.comparingDouble(distancias::get)
        );
        Set<T> visitados = new HashSet<>();

        for (T nodo : listaAdyacencia.keySet()) {
            distancias.put(nodo, Double.MAX_VALUE);
        }
        distancias.put(origen, 0.0);
        pq.add(origen);

        while (!pq.isEmpty()) {
            T actual = pq.poll();
            if (visitados.contains(actual)) continue;
            visitados.add(actual);

            for (Arista<T> arista : obtenerVecinos(actual)) {
                double nuevaDist = distancias.get(actual) + arista.peso;
                if (nuevaDist < distancias.get(arista.destino)) {
                    distancias.put(arista.destino, nuevaDist);
                    pq.add(arista.destino);
                }
            }
        }
        return distancias;
    }

    // Retorna la ruta exacta de origen a destino
    public List<T> rutaOptima(T origen, T destino) {
        Map<T, Double> distancias = new HashMap<>();
        Map<T, T> anteriores = new HashMap<>();
        PriorityQueue<T> pq = new PriorityQueue<>(
                Comparator.comparingDouble(distancias::get)
        );
        Set<T> visitados = new HashSet<>();

        for (T nodo : listaAdyacencia.keySet()) {
            distancias.put(nodo, Double.MAX_VALUE);
        }
        distancias.put(origen, 0.0);
        pq.add(origen);

        while (!pq.isEmpty()) {
            T actual = pq.poll();
            if (visitados.contains(actual)) continue;
            visitados.add(actual);

            for (Arista<T> arista : obtenerVecinos(actual)) {
                double nuevaDist = distancias.get(actual) + arista.peso;
                if (nuevaDist < distancias.get(arista.destino)) {
                    distancias.put(arista.destino, nuevaDist);
                    anteriores.put(arista.destino, actual);
                    pq.add(arista.destino);
                }
            }
        }

        // Reconstruir ruta
        List<T> ruta = new ArrayList<>();
        T paso = destino;
        while (paso != null) {
            ruta.add(0, paso);
            paso = anteriores.get(paso);
        }
        return ruta.isEmpty() || !ruta.get(0).equals(origen) ? new ArrayList<>() : ruta;
    }

    public int cantidadNodos() {
        return listaAdyacencia.size();
    }
}
