package techpark_uq.estructuras;

import java.util.ArrayList;
import java.util.List;

public class ArbolBinarioBusqueda<T extends Comparable<T>> {

    // Nodo interno
    private static class Nodo<T> {
        T dato;
        Nodo<T> izquierdo;
        Nodo<T> derecho;

        Nodo(T dato) {
            this.dato = dato;
        }
    }

    // Atributos
    private Nodo<T> raiz;
    private int tamaño;

    // Constructor
    public ArbolBinarioBusqueda() {
        this.raiz = null;
        this.tamaño = 0;
    }

    // Métodos públicos

    public void insertar(T elemento) {
        raiz = insertarRec(raiz, elemento);
        tamaño++;
    }

    public boolean buscar(T elemento) {
        return buscarRec(raiz, elemento);
    }

    public void eliminar(T elemento) {
        raiz = eliminarRec(raiz, elemento);
        tamaño--;
    }

    // Recorrido inorden → retorna elementos ordenados
    public List<T> inorden() {
        List<T> resultado = new ArrayList<>();
        inordenRec(raiz, resultado);
        return resultado;
    }

    // Recorrido preorden
    public List<T> preorden() {
        List<T> resultado = new ArrayList<>();
        preordenRec(raiz, resultado);
        return resultado;
    }

    public boolean estaVacio() {
        return raiz == null;
    }

    public int tamaño() {
        return tamaño;
    }

    // Métodos privados recursivos

    private Nodo<T> insertarRec(Nodo<T> nodo, T elemento) {
        if (nodo == null) return new Nodo<>(elemento);
        int cmp = elemento.compareTo(nodo.dato);
        if (cmp < 0) nodo.izquierdo = insertarRec(nodo.izquierdo, elemento);
        else if (cmp > 0) nodo.derecho = insertarRec(nodo.derecho, elemento);
        return nodo;
    }

    private boolean buscarRec(Nodo<T> nodo, T elemento) {
        if (nodo == null) return false;
        int cmp = elemento.compareTo(nodo.dato);
        if (cmp == 0) return true;
        if (cmp < 0) return buscarRec(nodo.izquierdo, elemento);
        return buscarRec(nodo.derecho, elemento);
    }

    private Nodo<T> eliminarRec(Nodo<T> nodo, T elemento) {
        if (nodo == null) return null;
        int cmp = elemento.compareTo(nodo.dato);
        if (cmp < 0) {
            nodo.izquierdo = eliminarRec(nodo.izquierdo, elemento);
        } else if (cmp > 0) {
            nodo.derecho = eliminarRec(nodo.derecho, elemento);
        } else {
            if (nodo.izquierdo == null) return nodo.derecho;
            if (nodo.derecho == null) return nodo.izquierdo;
            Nodo<T> sucesor = minimo(nodo.derecho);
            nodo.dato = sucesor.dato;
            nodo.derecho = eliminarRec(nodo.derecho, sucesor.dato);
        }
        return nodo;
    }

    private Nodo<T> minimo(Nodo<T> nodo) {
        while (nodo.izquierdo != null) nodo = nodo.izquierdo;
        return nodo;
    }

    private void inordenRec(Nodo<T> nodo, List<T> resultado) {
        if (nodo == null) return;
        inordenRec(nodo.izquierdo, resultado);
        resultado.add(nodo.dato);
        inordenRec(nodo.derecho, resultado);
    }

    private void preordenRec(Nodo<T> nodo, List<T> resultado) {
        if (nodo == null) return;
        resultado.add(nodo.dato);
        preordenRec(nodo.izquierdo, resultado);
        preordenRec(nodo.derecho, resultado);
    }
}