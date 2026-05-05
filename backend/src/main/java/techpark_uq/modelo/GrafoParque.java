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

}
