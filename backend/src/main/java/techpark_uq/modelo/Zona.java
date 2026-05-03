package techpark_uq.modelo;

import techpark_uq.estructuras.ListaEnlazada;
import java.util.ArrayList;
import java.util.List;

public class Zona {

    private String id;
    private String nombre;
    private int capacidadMaxima;
    private int visitantesActuales;
    private List<Atraccion> atracciones;
    private ListaEnlazada<Operador> operadoresAsignados;

    public Zona(String id, String nombre, int capacidadMaxima) {
        this.id = id;
        this.nombre = nombre;
        this.capacidadMaxima = capacidadMaxima;
        this.visitantesActuales = 0;
        this.atracciones = new ArrayList<>();
        this.operadoresAsignados = new ListaEnlazada<>();
    }

    public boolean agregarAtraccion(Atraccion atraccion) {
        atracciones.add(atraccion);
        return true;
    }

    public boolean agregarOperador(Operador operador) {
        operadoresAsignados.agregar(operador);
        return true;
    }

    public boolean estaLlena() {
        return visitantesActuales >= capacidadMaxima;
    }

    public void incrementarVisitantes() { visitantesActuales++; }
    public void decrementarVisitantes() {
        if (visitantesActuales > 0) visitantesActuales--;
    }

    // Getters y Setters
    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public int getCapacidadMaxima() { return capacidadMaxima; }
    public int getVisitantesActuales() { return visitantesActuales; }
    public List<Atraccion> getAtracciones() { return atracciones; }
    public ListaEnlazada<Operador> getOperadoresAsignados() { return operadoresAsignados; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setCapacidadMaxima(int capacidadMaxima) { this.capacidadMaxima = capacidadMaxima; }
}