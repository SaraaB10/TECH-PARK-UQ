package techpark_uq.modelo;

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
    private int tiempoEsperaEstimado;
    private EstadoAtraccion estado;
    private String motivoCierre;
    private int contadorIncidentes;
    private Zona zona;
    private ListaEnlazada<Operador> operadoresResponsables;
    private ColaVirtual colaVirtual;

    private static final int LIMITE_MANTENIMIENTO = 500;

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
        this.estado = EstadoAtraccion.ACTIVA;
        this.contadorIncidentes = 0;
        this.operadoresResponsables = new ListaEnlazada<>();
        this.colaVirtual = new ColaVirtual(this);
    }

    public boolean verificarMantenimientoPreventivo() {
        return contadorVisitantes >= LIMITE_MANTENIMIENTO;
    }

    public void aplicarBloqueoMantenimiento() {
        this.estado = EstadoAtraccion.EN_MANTENIMIENTO;
        this.motivoCierre = "Mantenimiento preventivo: límite de 500 visitantes alcanzado";
    }

    public void registrarVisitante() {
        contadorVisitantes++;
        if (verificarMantenimientoPreventivo()) {
            aplicarBloqueoMantenimiento();
        }
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

    @Override
    public String toString() {
        return "Atraccion{id='" + id + "', nombre='" + nombre + "', estado=" + estado + "}";
    }
}
