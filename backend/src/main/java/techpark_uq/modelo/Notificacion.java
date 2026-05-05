package techpark_uq.modelo;

import techpark_uq.enums.TipoNotificacion;
import java.time.LocalDateTime;

public class Notificacion {

    private String id;
    private String mensaje;
    private LocalDateTime fechaEnvio;
    private Visitante destinatario;
    private TipoNotificacion tipo;

    public Notificacion(String id, String mensaje, Visitante destinatario, TipoNotificacion tipo) {
        this.id = id;
        this.mensaje = mensaje;
        this.fechaEnvio = LocalDateTime.now();
        this.destinatario = destinatario;
        this.tipo = tipo;
    }

    public String getId() { return id; }

    public String getMensaje() { return mensaje; }

    public LocalDateTime getFechaEnvio() { return fechaEnvio; }

    public Visitante getDestinatario() { return destinatario; }
    
    public TipoNotificacion getTipo() { return tipo; }

    @Override
    public String toString() {
        return "[" + tipo + "] " + mensaje + " → " + destinatario.getNombre();
    }
}
