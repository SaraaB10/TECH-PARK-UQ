package techpark_uq.servicio;

import techpark_uq.modelo.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class ServicioReporte {

    private final ServicioParque servicioParque;

    public ServicioReporte(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    public Map<String, Object> generarReporteCompleto() {
        TechParkUQ parque = servicioParque.getParque();
        ReporteJornada reporte = parque.generarReporte();

        // Atracciones más visitadas (top 3)
        List<Map<String, Object>> topAtracciones = new ArrayList<>();
        List<Atraccion> masVisitadas = reporte.getAtraccionesMasVisitadas();
        int limite = Math.min(3, masVisitadas.size());
        for (int i = 0; i < limite; i++) {
            Atraccion a = masVisitadas.get(i);
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getId());
            item.put("nombre", a.getNombre());
            item.put("visitantes", a.getContadorVisitantes());
            item.put("estado", a.getEstado());
            item.put("incidentes", a.getContadorIncidentes());
            topAtracciones.add(item);
        }

        // Alertas climáticas
        List<Map<String, Object>> alertasClima = new ArrayList<>();
        for (AlertaClimatica ac : reporte.getCierresPorClima()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", ac.getId());
            item.put("tipo", ac.getTipo());
            item.put("fechaActivacion", ac.getFechaActivacion().toString());
            item.put("activa", ac.isActiva());
            item.put("atraccionesAfectadas", ac.getAtraccionesAfectadas().size());
            alertasClima.add(item);
        }

        // Alertas de mantenimiento
        List<Map<String, Object>> alertasMant = new ArrayList<>();
        for (AlertaMantenimiento am : reporte.getAlertasMantenimiento()) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", am.getId());
            item.put("atraccion", am.getAtraccion().getNombre());
            item.put("fecha", am.getFechaGeneracion().toString());
            item.put("resuelta", am.isResuelta());
            item.put("visitantesAlMomento", am.getVisitantesAlMomentoAlerta());
            alertasMant.add(item);
        }

        // Atracciones con incidentes
        List<Map<String, Object>> conIncidentes = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : reporte.getAtraccionesConIncidentes().entrySet()) {
            Map<String, Object> item = new HashMap<>();
            item.put("atraccion", entry.getKey());
            item.put("incidentes", entry.getValue());
            conIncidentes.add(item);
        }

        // Resumen general
        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("fecha", reporte.getFecha().toString());
        resultado.put("ingresosDiarios", reporte.getIngresosDiarios());
        resultado.put("totalVisitantes", parque.getVisitantesActuales());
        resultado.put("capacidadMaxima", parque.getCapacidadMaxima());
        resultado.put("porcentajeAforo",
                Math.round((double) parque.getVisitantesActuales()
                        / parque.getCapacidadMaxima() * 100) + "%");
        resultado.put("totalZonas", parque.getZonas().size());
        resultado.put("totalAtracciones", parque.obtenerTodasLasAtracciones().size());
        resultado.put("atraccionesMasVisitadas", topAtracciones);
        resultado.put("alertasClimaticas", alertasClima);
        resultado.put("alertasMantenimiento", alertasMant);
        resultado.put("atraccionesConIncidentes", conIncidentes);
        return resultado;
    }
}
