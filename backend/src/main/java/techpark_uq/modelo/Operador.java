package techpark_uq.modelo;

import techpark_uq.estructuras.ListaEnlazada;

public class Operador extends Persona {

    private Zona zonaAsignada;
    private ListaEnlazada<Atraccion> atraccionesResponsable;

    // Constructor
    public Operador(String id, String nombre, int edad, String telefono, String email, String contrasena) {
        super(id, nombre, edad, telefono, email, contrasena);
        this.atraccionesResponsable = new ListaEnlazada<>();
    }

    // Asigna una zona al operador
    public void asignarZona(Zona zona) {
        this.zonaAsignada = zona;
    }

    // Agrega una atracción a la lista de responsabilidades del operador
    public void agregarAtraccionResponsable(Atraccion atraccion) {
        atraccionesResponsable.agregar(atraccion);
    }

    // Verifica si el operador puede gestionar una atracción según su zona asignada
    public boolean puedeGestionarAtraccion(Atraccion atraccion) {
        if (zonaAsignada == null) return false;
        return zonaAsignada.getAtracciones().contains(atraccion);
    }

    // Retorna la zona asignada al operador
    public Zona getZonaAsignada() {
        return zonaAsignada;
    }

    // Retorna la lista de atracciones a cargo del operador
    public ListaEnlazada<Atraccion> getAtraccionesResponsable() {
        return atraccionesResponsable;
    }
}