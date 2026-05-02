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
    private int tamano;

    // Constructor
    public ListaEnlazada() {
        this.cabeza = null;
        this.tamano = 0;
    }

    //------------- Métodos -------------------------------------------------------

    // Agrega al final de la lista
    public void agregar(T elemento) {
        Nodo<T> nuevo = new Nodo<>(elemento);
        if (cabeza == null) {
            cabeza = nuevo;
        } else {
            Nodo<T> actual = cabeza;
            while (actual.siguiente != null) {
                actual = actual.siguiente;
            }
            actual.siguiente = nuevo;
        }
        tamano++;
    }

    // Elimina la primera ocurrencia del elemento
    public boolean eliminar(T elemento) {
        if (cabeza == null) return false;

        if (cabeza.dato.equals(elemento)) {
            cabeza = cabeza.siguiente;
            tamano--;
            return true;
        }

        Nodo<T> actual = cabeza;
        while (actual.siguiente != null) {
            if (actual.siguiente.dato.equals(elemento)) {
                actual.siguiente = actual.siguiente.siguiente;
                tamano--;
                return true;
            }
            actual = actual.siguiente;
        }
        return false;
    }

    // Busca un elemento por criterio
    public T buscar(Predicate<T> criterio) {
        Nodo<T> actual = cabeza;
        while (actual != null) {
            if (criterio.test(actual.dato)) {
                return actual.dato;
            }
            actual = actual.siguiente;
        }
        return null;
    }

    // Retorna todos los elementos en un arreglo de Object
    public Object[] obtenerTodos() {
        Object[] resultado = new Object[tamano];
        Nodo<T> actual = cabeza;
        int i = 0;
        while (actual != null) {
            resultado[i++] = actual.dato;
            actual = actual.siguiente;
        }
        return resultado;
    }

    // Verifica si la lista contiene un elemento
    public boolean contiene(T elemento) {
        return buscar(e -> e.equals(elemento)) != null;
    }

    // Retorna el tamaño
    public int tamano() {
        return tamano;
    }

    // Verifica si está vacía
    public boolean estaVacia() {
        return tamano == 0;
    }

    // Limpia la lista
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
            sb.append(actual.dato);
            if (actual.siguiente != null) sb.append(" → ");
            actual = actual.siguiente;
        }
        sb.append("]");
        return sb.toString();
    }
}