package techpark_uq.modelo;

import techpark_uq.enums.TipoTicket;
import java.time.LocalDate;

public abstract class Ticket {

    protected String id;
    protected LocalDate fechaEmision;
    protected boolean activo;
    protected double costoBase;
    protected TipoTicket tipo;

    public Ticket(String id, double costoBase, TipoTicket tipo) {
        this.id = id;
        this.fechaEmision = LocalDate.now();
        this.activo = true;
        this.costoBase = costoBase;
        this.tipo = tipo;
    }

    public abstract int getPrioridad();

    public String getId() { return id; }

    public boolean isActivo() { return activo; }

    public double getCostoBase() { return costoBase; }

    public TipoTicket getTipo() { return tipo; }

    public LocalDate getFechaEmision() { return fechaEmision; }

    public void setActivo(boolean activo) { this.activo = activo; }
}
