package techpark_uq.modelo;
import java.time.LocalDate;
import java.util.*;

public class ReporteJornada {

    private LocalDate fecha;
    private double ingresosDiarios;
    private List<Atraccion> atraccionesMasVisitadas;
    private Map<String, Double> tiemposPromedioEspera;
    private List<AlertaClimatica> cierresPorClima;
    private List<AlertaMantenimiento> alertasMantenimiento;
    private Map<String, Integer> atraccionesConIncidentes;

    public ReporteJornada() {
        this.fecha = LocalDate.now();
        this.ingresosDiarios = 0;
        this.atraccionesMasVisitadas = new ArrayList<>();
        this.tiemposPromedioEspera = new HashMap<>();
        this.cierresPorClima = new ArrayList<>();
        this.alertasMantenimiento = new ArrayList<>();
        this.atraccionesConIncidentes = new HashMap<>();
    }

    // Ingresos diarios
    public void agregarIngreso(double monto) {
        this.ingresosDiarios += monto;
    }

    // Registro cierres por clima a traves de la alerta
    public void registrarCierrePorClima(AlertaClimatica alerta) {
        cierresPorClima.add(alerta);
    }

    // Registro alertas de mantenimiento
    public void registrarAlertaMantenimiento(AlertaMantenimiento alerta) {
        alertasMantenimiento.add(alerta);
    }

    // Registro inicidentes a traves de atraccion
    public void registrarIncidente(Atraccion atraccion) {
        atraccionesConIncidentes.merge(atraccion.getNombre(), 1, Integer::sum);
    }

    // Calcula las atracciones mas visitadas con la lista de atracciones
    public void calcularAtraccionesMasVisitadas(List<Atraccion> atracciones) {
        atraccionesMasVisitadas = new ArrayList<>(atracciones);
        atraccionesMasVisitadas.sort((a, b) ->
                b.getContadorVisitantes() - a.getContadorVisitantes());
    }

    // Getters
    public LocalDate getFecha() { return fecha; }

    public double getIngresosDiarios() { return ingresosDiarios; }

    public List<Atraccion> getAtraccionesMasVisitadas() { return atraccionesMasVisitadas; }

    public Map<String, Double> getTiemposPromedioEspera() { return tiemposPromedioEspera; }

    public List<AlertaClimatica> getCierresPorClima() { return cierresPorClima; }

    public List<AlertaMantenimiento> getAlertasMantenimiento() { return alertasMantenimiento; }

    public Map<String, Integer> getAtraccionesConIncidentes() { return atraccionesConIncidentes; }
}
