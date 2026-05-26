# Tech-Park UQ — Sistema de Gestión de Parque de Atracciones

Sistema integral para la gestión operativa de un parque de atracciones inteligente, desarrollado como proyecto final de Estructuras de Datos — Universidad del Quindío, 2026-1.

---

## Descripción

Tech-Park UQ automatiza los procesos principales del parque: control de acceso de visitantes, gestión de colas virtuales con prioridad, mantenimiento preventivo de atracciones, alertas climáticas, asignación de personal y reportes de jornada. El sistema cuenta con una interfaz gráfica completa y un backend REST construido con Spring Boot.

---

## Arquitectura

El proyecto está dividido en dos módulos independientes:

```
TECH-PARK-UQ/
├── backend/                        # Spring Boot (Java)
│   └── src/main/java/techpark_uq/
│       ├── config/                 # CorsConfig
│       ├── controlador/            # REST Controllers
│       │   ├── AlertaController
│       │   ├── AtraccionController
│       │   ├── OperadorController
│       │   ├── ParqueController
│       │   ├── ReporteController
│       │   ├── VisitanteController
│       │   └── ZonaController
│       ├── enums/
│       │   ├── EstadoAtraccion     # ACTIVA | EN_MANTENIMIENTO | CERRADA
│       │   ├── TipoAtraccion
│       │   ├── TipoClima
│       │   ├── TipoNotificacion
│       │   └── TipoTicket
│       ├── estructuras/            # Implementaciones propias ★
│       │   ├── ArbolBinarioBusqueda
│       │   ├── ColaPrioridad
│       │   ├── Grafo
│       │   ├── ListaEnlazada
│       │   └── SetPropio
│       ├── modelo/                 # Dominio
│       │   ├── Administrador
│       │   ├── AlertaClimatica
│       │   ├── AlertaMantenimiento
│       │   ├── Atraccion
│       │   ├── ColaVirtual
│       │   ├── GrafoParque
│       │   ├── Notificacion
│       │   ├── Operador
│       │   ├── Persona
│       │   ├── ReporteJornada
│       │   ├── TechParkUQ
│       │   ├── Ticket / TicketFamiliar / TicketFastPass / TicketGeneral
│       │   ├── Visitante
│       │   └── Zona
│       └── servicio/
│           ├── ServicioCargaDatos
│           ├── ServicioCargaJson
│           ├── ServicioParque
│           └── ServicioReporte
│
└── frontend/                       # React + Vite
    └── src/
        ├── assets/
        ├── components/ui/
        │   └── Navbar.jsx
        ├── context/
        │   └── AppContext.jsx
        ├── layouts/
        │   └── MainLayout.jsx
        ├── pages/
        │   ├── Administracion.jsx
        │   ├── Carga.jsx
        │   ├── Estadisticas.jsx
        │   ├── Inicio.jsx
        │   ├── Mapa.jsx
        │   ├── Rutas.jsx
        │   └── Visitante.jsx
        ├── routes/
        │   └── AppRoutes.jsx
        └── services/
            └── parqueService.js
```

---

## Estructuras de Datos Propias

| Estructura | Uso en el sistema |
|---|---|
| **Grafo** | Mapa físico del parque — nodos = atracciones, aristas = senderos con peso (distancia) |
| **Cola de Prioridad** | Fila virtual de acceso a atracciones — prioridad 1: Fast-Pass, prioridad 2: General |
| **Lista Enlazada** | Historial de visitas de cada visitante y lista de operadores asignados a una zona |
| **Árbol Binario de Búsqueda** | Catálogo de atracciones ordenado por nombre para búsquedas en O(log n) |
| **Set Propio** | Gestión de atracciones favoritas por visitante, sin duplicados |

---

## Funcionalidades principales

### Visitante
- Registro con datos personales (nombre, documento, edad, estatura, saldo virtual)
- Tres tipos de ticket: **General**, **Familiar**, **Fast-Pass**
- Cola virtual con prioridad según tipo de ticket
- Cálculo de ruta óptima entre atracciones (Dijkstra / BFS)
- Historial de visitas y atracciones favoritas
- Notificaciones en tiempo real sobre cambios de estado y shows

### Operador
- Validación de restricciones de acceso (altura mínima, edad mínima)
- Procesamiento de cola dando prioridad a Fast-Pass
- Cambio de estado de atracciones y registro de revisiones técnicas

### Administrador
- Gestión de zonas, atracciones y operadores
- Activación de alertas climáticas (tormenta eléctrica / lluvia fuerte)
- Visualización del grafo del parque y conectividad entre zonas
- Reportes de jornada: ingresos, atracciones más visitadas, tiempos de espera, cierres por clima y alertas de mantenimiento

### Reglas de negocio clave
- **Mantenimiento preventivo:** toda atracción con `requiereSeguimientoTecnico = true` se bloquea automáticamente al acumular 500 visitantes y no acepta más ingresos hasta registrar una revisión técnica satisfactoria
- **Alertas climáticas:** al activar tormenta eléctrica o lluvia fuerte, las atracciones de tipo `ACUATICA` y `MECANICA_ALTURA` cambian automáticamente a `CERRADA` y se notifica a los visitantes con tickets activos
- **Control de aforo:** se impide la venta de tickets cuando el parque o una zona alcanza su capacidad máxima

---

## Vistas de la interfaz

| Vista | Descripción |
|---|---|
| **Inicio** | Estado general de zonas y disponibilidad de atracciones |
| **Panel de administración** | Gestión de personal, atracciones, zonas y control de mantenimiento |
| **Panel de visitante** | Posición en cola, ruta sugerida y perfil personal |
| **Mapa interactivo** | Grafo visual con nodos coloreados según estado (verde = activa, rojo = cerrada) y ruta óptima resaltada |
| **Rutas** | Optimización de recorridos y gestión de colas virtuales |
| **Estadísticas** | Reportes operativos: ingresos, tiempos de espera, incidentes y cierres climáticos |
| **Carga de datos** | Carga del escenario inicial desde archivo JSON o botón de prueba |

---

## Tecnologías

**Backend**
- Java 21
- Spring Boot 3
- Maven

**Frontend**
- React 18 + Vite
- Tailwind CSS
- Axios

---

## Instalación y ejecución

### Requisitos previos
- Java 21+
- Maven 3.9+
- Node.js 18+

### Backend
```bash
cd backend
mvn clean package -DskipTests
mvn spring-boot:run
```
El servidor queda disponible en `http://localhost:8080`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación queda disponible en `http://localhost:5173`

### Cargar datos iniciales
Una vez levantados ambos servicios, ir a la vista **Carga de Datos** y presionar el botón _"Cargar datos de prueba"_, o hacer:
```bash
curl -X POST http://localhost:8080/api/parque/cargar-datos-prueba
```

---

## Pruebas unitarias

```bash
cd backend
mvn test
```

Las pruebas cubren:
- Bloqueo automático de atracción al llegar a 500 visitantes con seguimiento técnico
- Que atracciones sin seguimiento técnico no se bloquean
- Que una atracción bloqueada rechaza nuevos ingresos
- Reactivación correcta tras revisión técnica satisfactoria
- Reinicio del contador y segundo ciclo de bloqueo
- Bordes del contador (499 vs 500 visitantes)

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/parque/info` | Información general del parque |
| `GET` | `/api/zonas` | Listar todas las zonas |
| `GET` | `/api/atracciones` | Listar todas las atracciones |
| `POST` | `/api/atracciones` | Crear atracción en una zona |
| `PUT` | `/api/atracciones/{id}/estado` | Cambiar estado de una atracción |
| `POST` | `/api/atracciones/{id}/revision-tecnica` | Registrar revisión técnica |
| `POST` | `/api/atracciones/{id}/ingresar` | Ingresar visitante a la cola |
| `POST` | `/api/atracciones/{id}/procesar-cola` | Procesar siguiente visitante |
| `GET` | `/api/operadores` | Listar operadores |
| `POST` | `/api/operadores` | Crear operador |
| `POST` | `/api/visitantes/registrar` | Registrar visitante |
| `POST` | `/api/visitantes/login` | Login de visitante |
| `POST` | `/api/alertas/climaticas` | Activar alerta climática |
| `GET` | `/api/alertas/mantenimiento` | Listar alertas de mantenimiento |
| `POST` | `/api/alertas/mantenimiento/{id}/resolver` | Resolver alerta de mantenimiento |
| `GET` | `/api/reportes/jornada` | Reporte de jornada |
| `GET` | `/api/parque/mapa` | Nodos y aristas del grafo |
| `GET` | `/api/parque/ruta-optima` | Ruta óptima entre dos atracciones |

---

## Integrantes

| Nombre                         | GitHub |
|--------------------------------|---|
| Sara Sofia Bolanos Pelayo      | SaraaB10 |
| Juliana Villota Lopez          | julianaVL07|
| Laura Alejandra Cardona Rivera | LauraAlejandraapt |

---

## Licencia

Proyecto académico — Universidad del Quindío, Estructuras de Datos 2026-1.
