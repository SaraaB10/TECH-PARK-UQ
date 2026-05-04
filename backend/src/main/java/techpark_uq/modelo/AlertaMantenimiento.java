package techpark_uq.modelo;
import techpark_uq.modelo.*;
import java.time.LocalDateTime;

public class AlertaMantenimiento {

    // Atributos
    private String id;
    private Atraccion atraccion;
    private LocalDateTime fechaGeneracion;
    private int visitantesAlMomentoAlerta;
    private boolean resuelta;
    private LocalDateTime fechaResolucion;

    // Constructor
    public AlertaMantenimiento(String id, Atraccion atraccion) {
        this.id = id;
        this.atraccion = atraccion;
        this.fechaGeneracion = LocalDateTime.now();
        this.visitantesAlMomentoAlerta = atraccion.getContadorVisitantes();
        this.resuelta = false;
    }

    // Marca la alerta como resuelta y registra la fecha de resolución
    public void resolver() {
        this.resuelta = true;
        this.fechaResolucion = LocalDateTime.now();
    }

    // Retorna el identificador de la alerta
    public String getId() {
        return id;
    }

    // Retorna la atracción asociada a la alerta
    public Atraccion getAtraccion() {
        return atraccion;
    }

    // Indica si la alerta ya fue resuelta
    public boolean isResuelta() {
        return resuelta;
    }

    // Retorna la fecha en que se generó la alerta
    public LocalDateTime getFechaGeneracion() {
        return fechaGeneracion;
    }

    // Retorna la fecha de resolución de la alerta
    public LocalDateTime getFechaResolucion() {
        return fechaResolucion;
    }

    // Retorna la cantidad de visitantes al momento de la alerta
    public int getVisitantesAlMomentoAlerta() {
        return visitantesAlMomentoAlerta;
    }
}