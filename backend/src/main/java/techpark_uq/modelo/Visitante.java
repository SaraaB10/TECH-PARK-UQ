package techpark_uq.modelo;
import techpark_uq.modelo.*;


public class Visitante extends Persona {

    //Atributos
    private double estatura;
    private double saldoVirtual;
    private String fotoPase;
    private Atraccion ubicacionActual;
    private ListaEnlazada<Atraccion> historialVisitas;
    private SetPropio<Atraccion> favoritos;
    private Ticket ticket;

    //Constructor
    public Visitante(String id, String nombre, int edad, String telefono,
                     String email, String contrasena, double estatura, double saldoVirtual) {
        super(id, nombre, edad, telefono, email, contrasena);
        this.estatura = estatura;
        this.saldoVirtual = saldoVirtual;
        this.historialVisitas = new ListaEnlazada<>();
        this.favoritos = new SetPropio<>();
    }

    //Metodo para agregar favorito
    public boolean agregarFavorito(Atraccion atraccion) {
        return favoritos.agregar(atraccion);
    }

    //Metodo para agregar historial
    public void agregarHistorial(Atraccion atraccion) {
        historialVisitas.agregar(atraccion);
    }

    //Metodo para verificar el saldo que sea suficiente
    public boolean tieneSaldoSuficiente(double costo) {
        return saldoVirtual >= costo;
    }

    //Metodo para descontar el saldo
    public void descontarSaldo(double costo) {
        saldoVirtual -= costo;
    }

    //Metodo para recargar el saldo
    public void recargarSaldo(double monto) {
        saldoVirtual += monto;
    }

    // Getters y Setters
    public double getEstatura() { return estatura; }
    public double getSaldoVirtual() { return saldoVirtual; }
    public String getFotoPase() { return fotoPase; }
    public Atraccion getUbicacionActual() { return ubicacionActual; }
    public ListaEnlazada<Atraccion> getHistorialVisitas() { return historialVisitas; }
    public SetPropio<Atraccion> getFavoritos() { return favoritos; }
    public Ticket getTicket() { return ticket; }

    public void setTicket(Ticket ticket) { this.ticket = ticket; }
    public void setUbicacionActual(Atraccion ubicacion) { this.ubicacionActual = ubicacion; }
    public void setFotoPase(String fotoPase) { this.fotoPase = fotoPase; }
}