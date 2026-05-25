package techpark_uq.estructuras;
import java.util.ArrayList;
import java.util.List;

public class SetPropio<T> {

    // Atributos
    private final List<T> elementos;

    // Constructor
    public SetPropio() {
        this.elementos = new ArrayList<>();
    }

    // Métodos

    // Agrega solo si no existe (sin duplicados)
    public boolean agregar(T elemento) {
        if (contiene(elemento)) return false;
        elementos.add(elemento);
        return true;
    }

    // Verifica si el elemento existe
    public boolean contiene(T elemento) {
        for (T e : elementos) {
            if (e.equals(elemento)) return true;
        }
        return false;
    }

    // Elimina un elemento
    public boolean eliminar(T elemento) {
        return elementos.remove(elemento);
    }

    // Retorna todos los elementos
    public List<T> obtenerTodos() {
        return new ArrayList<>(elementos);
    }

    // Retorna el tamaño
    public int tamaño() {
        return elementos.size();
    }

    // Verifica si está vacío
    public boolean estaVacio() {
        return elementos.isEmpty();
    }

    // Limpia el set
    public void limpiar() {
        elementos.clear();
    }

    @Override
    public String toString() {
        return elementos.toString();
    }
}