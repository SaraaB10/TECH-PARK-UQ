package techpark_uq.modelo;

import techpark_uq.enums.TipoClima;
import techpark_uq.enums.TipoNotificacion;
import techpark_uq.estructuras.ArbolBinarioBusqueda;
import techpark_uq.estructuras.ListaEnlazada;
import java.util.ArrayList;
import java.util.List;

public class TechParkUQ {

    private String id;
    private String nombre;
    private String ubicacion;
    private String telefono;
    private String email;
    private int capacidadMaxima;
    private boolean estaAbierto;
    private double ingresosDiarios;
    private int visitantesActuales;
    private GrafoParque grafoParque;

    private List<Zona> zonas;
    private List<Visitante> visitantes;
    private ListaEnlazada<Persona> empleados;
    private ArbolBinarioBusqueda<String> catalogoAtracciones;
    private List<AlertaMantenimiento> alertasMantenimiento;
    private List<AlertaClimatica> alertasClimaticas;
    private List<Notificacion> notificaciones;
    private ReporteJornada reporteActual;

    public TechParkUQ(String id, String nombre, String ubicacion, String telefono, String email, int capacidadMaxima) {
        this.id = id;
        this.nombre = nombre;
        this.ubicacion = ubicacion;
        this.telefono = telefono;
        this.email = email;
        this.capacidadMaxima = capacidadMaxima;
        this.estaAbierto = true;
        this.ingresosDiarios = 0;
        this.visitantesActuales = 0;
        this.grafoParque = new GrafoParque();
        this.zonas = new ArrayList<>();
        this.visitantes = new ArrayList<>();
        this.empleados = new ListaEnlazada<>();
        this.catalogoAtracciones = new ArbolBinarioBusqueda<>();
        this.alertasMantenimiento = new ArrayList<>();
        this.alertasClimaticas = new ArrayList<>();
        this.notificaciones = new ArrayList<>();
        this.reporteActual = new ReporteJornada();
    }

    // Zonas
    public void agregarZona(Zona zona) {
        zonas.add(zona);
    }

    public Zona buscarZona(String id) {
        return zonas.stream()
                .filter(z -> z.getId().equals(id))
                .findFirst().orElse(null);
    }

    // Visitantes
    public boolean verificarAforo() {
        return visitantesActuales < capacidadMaxima;
    }

    public Ticket venderTicket(Visitante visitante, String tipoTicket) {
        if (!verificarAforo()) return null;

        String idTicket = "TK-" + System.currentTimeMillis();
        Ticket ticket = switch (tipoTicket.toUpperCase()) {
            case "FAST_PASS" -> new TicketFastPass(idTicket);
            case "FAMILIAR"  -> new TicketFamiliar(idTicket, 20);
            default          -> new TicketGeneral(idTicket);
        };

        visitante.setTicket(ticket);
        visitantes.add(visitante);
        visitantesActuales++;
        ingresosDiarios += ticket.getCostoBase();
        reporteActual.agregarIngreso(ticket.getCostoBase());
        return ticket;
    }

    // Empleados
    public void agregarEmpleado(Persona empleado) {
        empleados.agregar(empleado);
    }

    public void eliminarEmpleado(Persona empleado) {
        empleados.eliminar(empleado);
    }

    // Alertas climáticas
    public AlertaClimatica activarAlertaClimatica(TipoClima tipo) {
        String id = "AC-" + System.currentTimeMillis();
        AlertaClimatica alerta = new AlertaClimatica(id, tipo);

        List<Atraccion> todasLasAtracciones = obtenerTodasLasAtracciones();
        alerta.aplicarCierres(todasLasAtracciones);
        alertasClimaticas.add(alerta);
        reporteActual.registrarCierrePorClima(alerta);

        notificarVisitantesAfectados(alerta);
        return alerta;
    }

    private void notificarVisitantesAfectados(AlertaClimatica alerta) {
        for (Visitante v : visitantes) {
            if (v.getTicket() != null && v.getTicket().isActivo()) {
                String msg = "Alerta climática: " + alerta.getTipo()
                        + ". Algunas atracciones han sido cerradas.";
                Notificacion notif = new Notificacion(
                        "N-" + System.currentTimeMillis(),
                        msg, v, TipoNotificacion.CLIMA
                );
                notificaciones.add(notif);
            }
        }
    }

    // Atracciones
    public List<Atraccion> obtenerTodasLasAtracciones() {
        List<Atraccion> todas = new ArrayList<>();
        for (Zona z : zonas) {
            todas.addAll(z.getAtracciones());
        }
        return todas;
    }

    public void agregarAtraccionAZona(Atraccion atraccion, String idZona, double distancia) {
        Zona zona = buscarZona(idZona);
        if (zona != null) {
            // Conectar con cada atracción ya existente en la zona usando la distancia real
            for (Atraccion existente : zona.getAtracciones()) {
                grafoParque.agregarSendero(atraccion.getId(), existente.getId(), distancia);
            }
            zona.agregarAtraccion(atraccion);
            atraccion.setZona(zona);
            catalogoAtracciones.insertar(atraccion.getNombre());
            // Registrar el nodo en el grafo después de agregar las aristas
            // (agregarSendero ya registra los nodos, pero lo hacemos explícito)
            grafoParque.agregarAtraccion(atraccion);
        }
    }

    // Reporte
    public ReporteJornada generarReporte() {
        reporteActual.calcularAtraccionesMasVisitadas(obtenerTodasLasAtracciones());
        return reporteActual;
    }

    // Grafo Parque
    public void conectarAtracciones(String idOrigen, String idDestino, double distancia) {
        grafoParque.agregarSendero(idOrigen, idDestino, distancia);
    }

    // Getters
    public String getId() { return id; }

    public String getNombre() { return nombre; }

    public boolean isEstaAbierto() { return estaAbierto; }

    public int getCapacidadMaxima() { return capacidadMaxima; }

    public int getVisitantesActuales() { return visitantesActuales; }

    public double getIngresosDiarios() { return ingresosDiarios; }

    public GrafoParque getGrafoParque() { return grafoParque; }

    public List<Zona> getZonas() { return zonas; }

    public List<Visitante> getVisitantes() { return visitantes; }

    public ListaEnlazada<Persona> getEmpleados() { return empleados; }

    public List<AlertaMantenimiento> getAlertasMantenimiento() { return alertasMantenimiento; }

    public List<AlertaClimatica> getAlertasClimaticas() { return alertasClimaticas; }

    public List<Notificacion> getNotificaciones() { return notificaciones; }

    public ReporteJornada getReporteActual() { return reporteActual; }
    
    public void setEstaAbierto(boolean estaAbierto) { this.estaAbierto = estaAbierto; }
}
