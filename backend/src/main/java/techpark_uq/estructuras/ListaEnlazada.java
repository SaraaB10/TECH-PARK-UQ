package techpark_uq.estructuras;
import java.util.function.Predicate;

public class ListaEnlazada<T> {

    // Nodo interno
    private static class Nodo<T> {
        T dato;
        Nodo<T> siguiente;

        Nodo(T dato) {
            this.dato = dato;
            this.siguiente = null;
        }
    }

    // Atributos
    private Nodo<T> cabeza;
    private int tamaño;

    // Constructor
    public ListaEnlazada() {
        this.cabeza = null;
        this.tamaño = 0;
    }
}