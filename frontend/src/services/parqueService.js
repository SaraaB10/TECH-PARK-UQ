import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
})

// ─── Interceptor global de errores ──────────────────────────────────────────
api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error('[API Error]', err.message)
        return Promise.reject(err)
    }
)

// ─── Parque general ──────────────────────────────────────────────────────────
export const parqueService = {
    cargarDatos:       () => api.post('/parque/cargar-datos'),
    cargarDatosPrueba: () => api.post('/parque/cargar-datos-prueba'),
    estadoCarga:       () => api.get('/parque/estado-carga'),
    getInfo:           () => api.get('/parque/info'),            // era getEstado → /parque/estado (no existía)
    getMapa:           () => api.get('/parque/mapa'),
    getRutaOptima:     (origen, destino) => api.get(`/parque/ruta-optima?origen=${origen}&destino=${destino}`),
    getReporte:        () => api.get('/parque/reporte'),
    // getZonas y getAtracciones movidos a zonaService y atraccionService
}

// ─── Zonas ───────────────────────────────────────────────────────────────────
export const zonaService = {
    getAll:          ()        => api.get('/zonas'),
    getById:         (id)      => api.get(`/zonas/${id}`),
    getAtracciones:  (id)      => api.get(`/zonas/${id}/atracciones`),  // reemplaza atraccionService.getByZona
    getOperadores:   (id)      => api.get(`/zonas/${id}/operadores`),
    create:          (data)    => api.post('/zonas', data),
    // delete: no existe en el backend
}

// ─── Atracciones ─────────────────────────────────────────────────────────────
export const atraccionService = {
    getAll:           ()                  => api.get('/atracciones'),
    // getById: no existe en el backend
    // getByZona: usar zonaService.getAtracciones(idZona)
    ingresar:         (id, idVisitante)   => api.post(`/atracciones/${id}/ingresar?idVisitante=${idVisitante}`),
    procesarCola:     (id)                => api.post(`/atracciones/${id}/procesar-cola`),
    getCola:          (id)                => api.get(`/atracciones/${id}/cola`),
    cambiarEstado:    (id, estado)        => api.put(`/atracciones/${id}/estado`, { estado }),
    registrarRevision:(id)                => api.post(`/atracciones/${id}/revision-tecnica`),
}

// ─── Operadores ──────────────────────────────────────────────────────────────
export const operadorService = {
    getAll:      ()           => api.get('/operadores'),
    getById:     (id)         => api.get(`/operadores/${id}`),
    create:      (data)       => api.post('/operadores', data),
    delete:      (id)         => api.delete(`/operadores/${id}`),
    asignarZona: (id, zonaId) => api.post(`/operadores/${id}/asignar-zona?idZona=${zonaId}`), // era PUT /zona/{zonaId}
    getAtracciones: (id)      => api.get(`/operadores/${id}/atracciones`),
}

// ─── Visitantes ──────────────────────────────────────────────────────────────
export const visitanteService = {
    // getAll: no existe en el backend
    registrar:        (data)           => api.post('/visitantes/registrar', data),  // era POST /visitantes
    getHistorial:     (id)             => api.get(`/visitantes/${id}/historial`),
    getSaldo:         (id)             => api.get(`/visitantes/${id}/saldo`),
    agregarFavorito:  (id, idAtraccion)=> api.post(`/visitantes/${id}/favorito?idAtraccion=${idAtraccion}`),
    getNotificaciones:(id)             => api.get(`/alertas/notificaciones/${id}`), // era /visitantes/{id}/notificaciones
    // unirseACola: usar atraccionService.ingresar(idAtraccion, idVisitante)
    // getPosicion, getFavoritos, quitarFavorito, getRutaSugerida: no existen en el backend
}

// ─── Rutas / Grafo ───────────────────────────────────────────────────────────
export const rutaService = {
    calcularRuta: (origen, destino) => api.get(`/parque/ruta-optima?origen=${origen}&destino=${destino}`), // era /rutas/dijkstra
    procesarCola: (atraccionId)     => api.post(`/atracciones/${atraccionId}/procesar-cola`),              // era /rutas/colas/{id}/procesar
    // getSenderos, getColas, getFlujoPorZona: no existen en el backend
}

// ─── Clima ───────────────────────────────────────────────────────────────────
export const climaService = {
    activarTormenta:  () => api.post('/alertas/climaticas', { tipo: 'TORMENTA' }), // era POST /alertas/tormenta
    activarLluvia:    () => api.post('/alertas/climaticas', { tipo: 'LLUVIA' }),   // era POST /alertas/lluvia
    getAlertasActivas:() => api.get('/alertas/climaticas/activas'),                // era GET /alertas
    getTodasClimaticas:() => api.get('/alertas/climaticas'),
    desactivar:      (id) => api.post(`/alertas/climaticas/${id}/desactivar`),    // era DELETE /alertas/{id}
}

// ─── Alertas de mantenimiento ────────────────────────────────────────────────
export const mantenimientoService = {
    getAll:      () => api.get('/alertas/mantenimiento'),
    getPendientes:() => api.get('/alertas/mantenimiento/pendientes'),
    resolver:    (id) => api.post(`/alertas/mantenimiento/${id}/resolver`),
}

// ─── Estadísticas / Reportes ─────────────────────────────────────────────────
export const estadisticasService = {
    getReporteJornada:      () => api.get('/reportes/jornada'),   // contiene ingresos, cierres, alertas, incidentes
    getResumen:             () => api.get('/reportes/resumen'),   // resumen rápido para dashboard
    getAlertasMantenimiento:() => api.get('/alertas/mantenimiento'),
    getAlertasClimaticas:   () => api.get('/alertas/climaticas'),
}
