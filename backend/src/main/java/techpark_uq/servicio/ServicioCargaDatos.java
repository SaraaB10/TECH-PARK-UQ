package techpark_uq.servicio;

import techpark_uq.enums.TipoAtraccion;
import techpark_uq.modelo.*;
import org.springframework.stereotype.Service;


@Service
public class ServicioCargaDatos {

    private final ServicioParque servicioParque;

    public ServicioCargaDatos(ServicioParque servicioParque) {
        this.servicioParque = servicioParque;
    }

    public String cargarEscenarioInicial() {
        TechParkUQ parque = servicioParque.getParque();

        // Zonas
        Zona zonaAventura = new Zona("Z-001", "Zona Aventura", 500);
        Zona zonaAcuatica = new Zona("Z-002", "Zona Acuática", 300);
        Zona zonaEspectaculos = new Zona("Z-003", "Zona Espectáculos", 400);
        parque.agregarZona(zonaAventura);
        parque.agregarZona(zonaAcuatica);
        parque.agregarZona(zonaEspectaculos);

        // Atracciones
        Atraccion montana = new Atraccion("A-001", "Montaña Rusa Extrema",
                TipoAtraccion.MECANICA_ALTURA, 20, 1.40, 12, 15000);
        Atraccion caida = new Atraccion("A-002", "Torre de Caída Libre",
                TipoAtraccion.MECANICA_ALTURA, 10, 1.50, 14, 10000);
        Atraccion tobogan = new Atraccion("A-003", "Tobogán Gigante",
                TipoAtraccion.ACUATICA, 15, 1.20, 8, 8000);
        Atraccion olas = new Atraccion("A-004", "Piscina de Olas",
                TipoAtraccion.ACUATICA, 50, 0.0, 5, 0);
        Atraccion show = new Atraccion("A-005", "Show de Magia",
                TipoAtraccion.ESPECTACULO, 100, 0.0, 0, 0);

        parque.agregarAtraccionAZona(montana, "Z-001");
        parque.agregarAtraccionAZona(caida, "Z-001");
        parque.agregarAtraccionAZona(tobogan, "Z-002");
        parque.agregarAtraccionAZona(olas, "Z-002");
        parque.agregarAtraccionAZona(show, "Z-003");

        // Operadores
        Operador op1 = new Operador("OP-001", "Carlos López", 28,
                "3101111111", "carlos@techpark.com", "1234");
        Operador op2 = new Operador("OP-002", "Ana Martínez", 25,
                "3102222222", "ana@techpark.com", "1234");
        parque.agregarEmpleado(op1);
        parque.agregarEmpleado(op2);
        servicioParque.asignarOperadorAZona("OP-001", "Z-001");
        servicioParque.asignarOperadorAZona("OP-002", "Z-002");

        // Visitantes de prueba
        Visitante v1 = new Visitante("V-001", "Laura García", 25,
                "3103333333", "laura@gmail.com", "pass", 1.65, 200000);
        Visitante v2 = new Visitante("V-002", "Pedro Ruiz", 30,
                "3104444444", "pedro@gmail.com", "pass", 1.75, 150000);
        servicioParque.venderTicket(v1, "FAST_PASS");
        servicioParque.venderTicket(v2, "GENERAL");

        return "Escenario inicial cargado: 3 zonas, 5 atracciones, 2 operadores, 2 visitantes";
    }
}
