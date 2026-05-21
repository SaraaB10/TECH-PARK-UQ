import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 8000,
    headers: { 'Content-Type': 'application/json' },
})



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
    getInfo:           () => api.get('/parque/info'),
    getMapa:           () => api.get('/parque/mapa'),
    getRutaOptima:     (origen, destino) =>
        api.get(`/parque/ruta-optima?origen=${origen}&destino=${destino}`),
}

// ─── Zonas ───────────────────────────────────────────────────────────────────
export const zonaService = {
    getAll:         ()     => api.get('/zonas'),
    getById:        (id)   => api.get(`/zonas/${id}`),
    create:         (data) => api.post('/zonas', data),
    delete:         (id)   => api.delete(`/zonas/${id}`),
    getAtracciones: (id)   => api.get(`/zonas/${id}/atracciones`),
    getOperadores:  (id)   => api.get(`/zonas/${id}/operadores`),
}

// ─── Atracciones ─────────────────────────────────────────────────────────────
export const atraccionService = {
    getAll:          ()           => api.get('/atracciones'),
    getById:         (id)         => api.get(`/atracciones/${id}`),
    getCola:         (id)         => api.get(`/atracciones/${id}/cola`),
    ingresar:        (id, vidId)  =>
        api.post(`/atracciones/${id}/ingresar?idVisitante=${vidId}`),
    procesarCola:    (id)         => api.post(`/atracciones/${id}/procesar-cola`),
    cambiarEstado:   (id, estado) => api.put(`/atracciones/${id}/estado`, { estado }),
    registrarRevision: (id)       => api.post(`/atracciones/${id}/revision-tecnica`),
}

// ─── Operadores ──────────────────────────────────────────────────────────────
export const operadorService = {
    getAll:      ()             => api.get('/operadores'),
    getById:     (id)           => api.get(`/operadores/${id}`),
    create:      (data)         => api.post('/operadores', data),
    delete:      (id)           => api.delete(`/operadores/${id}`),
    asignarZona: (id, zonaId)   =>
        api.post(`/operadores/${id}/asignar-zona?idZona=${zonaId}`),
}

// ─── Visitantes ──────────────────────────────────────────────────────────────
export const visitanteService = {
    registrar:       (data)            => api.post('/visitantes/registrar', data),
    getHistorial:    (id)              => api.get(`/visitantes/${id}/historial`),
    getSaldo:        (id)              => api.get(`/visitantes/${id}/saldo`),
    agregarFavorito: (id, atraccionId) =>
        api.post(`/visitantes/${id}/favorito?idAtraccion=${atraccionId}`),
    unirseACola:     (atraccionId, visitanteId) =>
        api.post(`/atracciones/${atraccionId}/ingresar?idVisitante=${visitanteId}`),
    getPosicionCola: (atraccionId)     =>
        api.get(`/atracciones/${atraccionId}/cola`),
}

// ─── Alertas ─────────────────────────────────────────────────────────────────
export const alertaService = {
    getMantenimiento:      ()    => api.get('/alertas/mantenimiento'),
    getPendientes:         ()    => api.get('/alertas/mantenimiento/pendientes'),
    resolverMantenimiento: (id)  => api.post(`/alertas/mantenimiento/${id}/resolver`),
    getClimaticas:         ()    => api.get('/alertas/climaticas'),
    getClimaticasActivas:  ()    => api.get('/alertas/climaticas/activas'),
    activarTormenta:       ()    =>
        api.post('/alertas/climaticas', { tipo: 'TORMENTA_ELECTRICA' }),
    activarLluvia:         ()    =>
        api.post('/alertas/climaticas', { tipo: 'LLUVIA_FUERTE' }),
    desactivar:            (id)  =>
        api.post(`/alertas/climaticas/${id}/desactivar`),
    getNotificaciones:     (id)  => api.get(`/alertas/notificaciones/${id}`),
}

// ─── Reportes ─────────────────────────────────────────────────────────────────
export const reporteService = {
    getJornada: () => api.get('/reportes/jornada'),
    getResumen: () => api.get('/reportes/resumen'),
}

// ─── Rutas / Grafo ────────────────────────────────────────────────────────────
export const rutaService = {
    calcularRuta:    (origen, destino) =>
        api.get(`/parque/ruta-optima?origen=${origen}&destino=${destino}`),
    getSenderos:     ()                => api.get('/parque/mapa'),
    getColas:        ()                => api.get('/atracciones'),
    procesarCola:    (id)              => api.post(`/atracciones/${id}/procesar-cola`),
    getFlujoPorZona: ()                => api.get('/zonas'),
}

// ─── Clima (alias de alertaService para compatibilidad con Administracion.jsx)
export const climaService = {
    activarTormenta:  ()    =>
        api.post('/alertas/climaticas', { tipo: 'TORMENTA_ELECTRICA' }),
    activarLluvia:    ()    =>
        api.post('/alertas/climaticas', { tipo: 'LLUVIA_FUERTE' }),
    getAlertasActivas:()    => api.get('/alertas/climaticas/activas'),
    desactivar:       (id)  =>
        api.post(`/alertas/climaticas/${id}/desactivar`),
}

// ─── Estadísticas (mapeadas a endpoints reales) ───────────────────────────────
export const estadisticasService = {
    getIngresos:             () => api.get('/reportes/resumen'),
    getAtraccionesPopulares: () => api.get('/reportes/jornada'),
    getTiemposEspera:        () => api.get('/atracciones'),
    getCierresPorClima:      () => api.get('/alertas/climaticas'),
    getAlertasMantenimiento: () => api.get('/alertas/mantenimiento'),
    getIncidentes:           () => api.get('/reportes/jornada'),
}