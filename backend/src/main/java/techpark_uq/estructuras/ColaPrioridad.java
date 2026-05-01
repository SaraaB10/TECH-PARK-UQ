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

    // ─── Métodos ────────────────────────────────────────────────

    // Encola respetando prioridad (1 antes que 2)
    public void encolar(T dato, int prioridad) {
        // Primero validar
        if (prioridad != 1 && prioridad != 2) {
            throw new IllegalArgumentException("Prioridad debe ser 1 (FastPass) o 2 (General)");
        }
        // Luego crear el nodo
        Nodo<T> nuevo = new Nodo<>(new Elemento<>(dato, prioridad));

        // Si la cola está vacía o el nuevo tiene mayor prioridad que el primero
        if (cabeza == null || prioridad < cabeza.elemento.prioridad) {
            nuevo.siguiente = cabeza;
            cabeza = nuevo;
        } else {
            Nodo<T> actual = cabeza;
            while (actual.siguiente != null &&
                    actual.siguiente.elemento.prioridad <= prioridad) {
                actual = actual.siguiente;
            }
            nuevo.siguiente = actual.siguiente;
            actual.siguiente = nuevo;
        }
        tamano++;
    }

    // Elimina y retorna el elemento de mayor prioridad
    public T desencolar() {
        if (estaVacia()) return null;
        T dato = cabeza.elemento.dato;
        cabeza = cabeza.siguiente;
        tamano--;
        return dato;
    }

    // Ver el frente sin eliminarlo
    public T verFrente() {
        if (estaVacia()) return null;
        return cabeza.elemento.dato;
    }

    // Ver la prioridad del frente
    public int prioridadFrente() {
        if (estaVacia()) return -1;
        return cabeza.elemento.prioridad;
    }

    // Verifica si está vacía
    public boolean estaVacia() {
        return tamano == 0;
    }

    // Retorna el tamaño
    public int tamaño() {
        return tamano;
    }

    // Limpia la cola
    public void limpiar() {
        cabeza = null;
        tamano = 0;
    }

    // Representación en texto
    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder("[");
        Nodo<T> actual = cabeza;
        while (actual != null) {
            sb.append(actual.elemento.dato)
                    .append("(P").append(actual.elemento.prioridad).append(")");
            if (actual.siguiente != null) sb.append(" → ");
            actual = actual.siguiente;
        }
        sb.append("]");
        return sb.toString();
    }

}