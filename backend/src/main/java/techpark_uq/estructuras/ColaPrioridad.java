package techpark_uq.estructuras;

public class ColaPrioridad<T> {

    // Elemento interno con prioridad
    private static class Elemento<T> {
        T dato;
        int prioridad; // 1 = FastPass (mayor prioridad), 2 = General

        Elemento(T dato, int prioridad) {
            this.dato = dato;
            this.prioridad = prioridad;
        }
    }

    // Nodo de la lista enlazada interna
    private static class Nodo<T> {
        Elemento<T> elemento;
        Nodo<T> siguiente;

        Nodo(Elemento<T> elemento) {
            this.elemento = elemento;
            this.siguiente = null;
        }
    }

    // Atributos
    private Nodo<T> cabeza;
    private int tamano;

    // Constructor
    public ColaPrioridad() {
        this.cabeza = null;
        this.tamano = 0;
    }

}