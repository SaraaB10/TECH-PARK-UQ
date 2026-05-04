package techpark_uq.modelo;

public abstract class Persona {

    //Atributos
    protected String id;
    protected String nombre;
    protected int edad;
    protected String telefono;
    protected String email;
    protected String contrasena;

    //Constructor
    public Persona(String id, String nombre, int edad,
                   String telefono, String email, String contrasena) {
        this.id = id;
        this.nombre = nombre;
        this.edad = edad;
        this.telefono = telefono;
        this.email = email;
        this.contrasena = contrasena;
    }

    // Getters y Setters
    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public int getEdad() { return edad; }
    public String getTelefono() { return telefono; }
    public String getEmail() { return email; }
    public String getContrasena() { return contrasena; }

    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setTelefono(String telefono) { this.telefono = telefono; }
    public void setEmail(String email) { this.email = email; }
    public void setContrasena(String contrasena) { this.contrasena = contrasena; }

    @Override
    public String toString() {
        return "Persona{id='" + id + "', nombre='" + nombre + "', edad=" + edad + "}";
    }
}