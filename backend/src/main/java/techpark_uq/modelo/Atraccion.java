package techpark_uq.modelo;

import techpark_uq.enums.EstadoAtraccion;
import techpark_uq.enums.TipoAtraccion;
import techpark_uq.estructuras.ListaEnlazada;

public class Atraccion {

    private String id;
    private String nombre;
    private TipoAtraccion tipo;
    private int capacidadMaximaPorCiclo;
    private double alturaMinima;
    private int edadMinima;
    private double costoAdicional;
    private int contadorVisitantes;
    private int tiempoEsperaEstimado;  // tiempo General (recalculado dinámicamente)
    private int tiempoEsperaFastPass;  // tiempo FastPass (recalculado dinámicamente)
    private int tiempoEsperaBase;      // valor configurado en Administración (base de un ciclo)
    private EstadoAtraccion estado;
    private String motivoCierre;
    private int contadorIncidentes;
    private Zona zona;
    private ListaEnlazada<Operador> operadoresResponsables;
    private ColaVirtual colaVirtual;

    private static final int LIMITE_MANTENIMIENTO = 500;

    private boolean requiereSeguimientoTecnico;  // configurado al crear la atracción
    private boolean revisionTecnicaPendiente;    // true = bloqueada, impide ingresos

    public Atraccion(String id, String nombre, TipoAtraccion tipo,
                     int capacidadMaximaPorCiclo, double alturaMinima,
                     int edadMinima, double costoAdicional) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.capacidadMaximaPorCiclo = capacidadMaximaPorCiclo;
        this.alturaMinima = alturaMinima;
        this.edadMinima = edadMinima;
        this.costoAdicional = costoAdicional;
        this.contadorVisitantes = 0;
        this.tiempoEsperaEstimado = 0;
        this.tiempoEsperaFastPass = 0;
        this.tiempoEsperaBase     = 0;
        this.estado = EstadoAtraccion.ACTIVA;
        this.contadorIncidentes = 0;
        this.requiereSeguimientoTecnico = false;
        this.revisionTecnicaPendiente   = false;
        this.operadoresResponsables = new ListaEnlazada<>();
        this.colaVirtual = new ColaVirtual(this);
    }

    // Solo aplica si la atracción requiere seguimiento técnico
    public boolean verificarMantenimientoPreventivo() {
        return requiereSeguimientoTecnico && contadorVisitantes >= LIMITE_MANTENIMIENTO;
    }

    public void aplicarBloqueoMantenimiento() {
        this.estado = EstadoAtraccion.EN_MANTENIMIENTO;
        this.motivoCierre = "Mantenimiento preventivo: límite de "
                + LIMITE_MANTENIMIENTO + " visitantes alcanzado";
        this.revisionTecnicaPendiente = true;
    }

    // Impide ingresos si hay revisión pendiente; bloquea al llegar a 500
    public void registrarVisitante() {
        if (revisionTecnicaPendiente) return;
        contadorVisitantes++;
        if (verificarMantenimientoPreventivo()) {
            aplicarBloqueoMantenimiento();
        }
    }

    // Llamado por ServicioParque.registrarRevisionTecnica() tras confirmar la revisión
    public void registrarRevisionSatisfactoria() {
        this.estado                 = EstadoAtraccion.ACTIVA;
        this.motivoCierre           = null;
        this.revisionTecnicaPendiente = false;
        this.contadorVisitantes     = 0;   // reinicia el ciclo de 500
    }

    public void cerrarPorClima(String motivo) {
        this.estado = EstadoAtraccion.CERRADA;
        this.motivoCierre = motivo;
        this.contadorIncidentes++;
    }

    public boolean estaActiva() {
        return estado == EstadoAtraccion.ACTIVA;
    }

    // Getters y Setters
    public String getId() { return id; }
    public String getNombre() { return nombre; }
    public TipoAtraccion getTipo() { return tipo; }
    public int getCapacidadMaximaPorCiclo() { return capacidadMaximaPorCiclo; }
    public double getAlturaMinima() { return alturaMinima; }
    public int getEdadMinima() { return edadMinima; }
    public double getCostoAdicional() { return costoAdicional; }
    public int getContadorVisitantes() { return contadorVisitantes; }
    public EstadoAtraccion getEstado() { return estado; }
    public String getMotivoCierre() { return motivoCierre; }
    public int getContadorIncidentes() { return contadorIncidentes; }
    public Zona getZona() { return zona; }
    public ColaVirtual getColaVirtual() { return colaVirtual; }
    public ListaEnlazada<Operador> getOperadoresResponsables() { return operadoresResponsables; }
    public int getTiempoEsperaEstimado() { return tiempoEsperaEstimado; }

    public void setEstado(EstadoAtraccion estado) { this.estado = estado; }
    public void setMotivoCierre(String motivoCierre) { this.motivoCierre = motivoCierre; }
    public void setZona(Zona zona) { this.zona = zona; }
    public void setTiempoEsperaEstimado(int tiempo) { this.tiempoEsperaEstimado = tiempo; }
    public void setTiempoEsperaFastPass(int tiempo) { this.tiempoEsperaFastPass = tiempo; }
    public int  getTiempoEsperaFastPass()           { return tiempoEsperaFastPass; }
    public void setTiempoEsperaBase(int tiempo)     { this.tiempoEsperaBase = tiempo; }
    public int  getTiempoEsperaBase()               { return tiempoEsperaBase; }
    public boolean isRequiereSeguimientoTecnico() { return requiereSeguimientoTecnico; }
    public void setRequiereSeguimientoTecnico(boolean v) { this.requiereSeguimientoTecnico = v; }
    public boolean isRevisionTecnicaPendiente() { return revisionTecnicaPendiente; }

    @Override
    public String toString() {
        return "Atraccion{id='" + id + "', nombre='" + nombre + "', estado=" + estado + "}";
    }
}