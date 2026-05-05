package techpark_uq.modelo;

import techpark_uq.enums.TipoClima;
import techpark_uq.enums.TipoAtraccion;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AlertaClimatica {

    //Atributos
    private String id;
    private TipoClima tipo;
    private LocalDateTime fechaActivacion;
    private boolean activa;
    private List<Atraccion> atraccionesAfectadas;

    //Constructor
    public AlertaClimatica(String id, TipoClima tipo) {
        this.id = id;
        this.tipo = tipo;
        this.fechaActivacion = LocalDateTime.now();
        this.activa = true;
        this.atraccionesAfectadas = new ArrayList<>();
    }

    // Cierra automáticamente las atracciones afectadas
    public void aplicarCierres(List<Atraccion> todasLasAtracciones) {
        for (Atraccion a : todasLasAtracciones) {
            if (a.getTipo() == TipoAtraccion.ACUATICA ||
                    a.getTipo() == TipoAtraccion.MECANICA_ALTURA) {
                a.cerrarPorClima("Cierre por alerta climática: " + tipo);
                atraccionesAfectadas.add(a);
            }
        }
    }
    // Desactiva la alerta climática
    public void desactivar() { this.activa = false; }


    // Retorna el ID de la alerta
    public String getId() {
        return id;
    }

    // Retorna el tipo de clima de la alerta
    public TipoClima getTipo() {
        return tipo;
    }

    // Indica si la alerta está activa
    public boolean isActiva() {
        return activa;
    }

    // Retorna la lista de atracciones afectadas
    public List<Atraccion> getAtraccionesAfectadas() {
        return atraccionesAfectadas;
    }

    // Retorna la fecha de activación de la alerta
    public LocalDateTime getFechaActivacion() {
        return fechaActivacion;
    }
}