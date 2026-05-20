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
    getZonas:          () => api.get('/parque/zonas'),
    getAtracciones:    () => api.get('/parque/atracciones'),
    getEstado:         () => api.get('/parque/estado'),
}

// ─── Zonas ───────────────────────────────────────────────────────────────────
export const zonaService = {
    getAll:   ()       => api.get('/zonas'),
    create:   (data)   => api.post('/zonas', data),
    delete:   (id)     => api.delete(`/zonas/${id}`),
}

// ─── Atracciones ─────────────────────────────────────────────────────────────
export const atraccionService = {
    getAll:           ()     => api.get('/atracciones'),
    getById:          (id)   => api.get(`/atracciones/${id}`),
    getByZona:        (zona) => api.get(`/atracciones/zona/${zona}`),
    registrarRevision:(id)   => api.post(`/atracciones/${id}/revision-tecnica`),
}

// ─── Operadores ──────────────────────────────────────────────────────────────
export const operadorService = {
    getAll:      ()              => api.get('/operadores'),
    create:      (data)          => api.post('/operadores', data),
    delete:      (id)            => api.delete(`/operadores/${id}`),
    asignarZona: (id, zonaId)    => api.put(`/operadores/${id}/zona/${zonaId}`),
}

// ─── Visitantes ──────────────────────────────────────────────────────────────
export const visitanteService = {
    getAll:         ()              => api.get('/visitantes'),
    registrar:      (data)          => api.post('/visitantes', data),
    unirseACola:    (id, atraccion) => api.post(`/visitantes/${id}/cola/${atraccion}`),
    getPosicion:    (id, atraccion) => api.get(`/visitantes/${id}/cola/${atraccion}`),
    getHistorial:   (id)            => api.get(`/visitantes/${id}/historial`),
    getFavoritos:   (id)            => api.get(`/visitantes/${id}/favoritos`),
    quitarFavorito: (id, atraccion) => api.delete(`/visitantes/${id}/favoritos/${atraccion}`),
    getRutaSugerida:(id, destino)   => api.get(`/visitantes/${id}/ruta/${destino}`),
    getNotificaciones:(id)          => api.get(`/visitantes/${id}/notificaciones`),
}

// ─── Rutas / Grafo ───────────────────────────────────────────────────────────
export const rutaService = {
    calcularRuta:   (origen, destino) => api.get(`/rutas/dijkstra?origen=${origen}&destino=${destino}`),
    getSenderos:    ()                 => api.get('/rutas/senderos'),
    getColas:       ()                 => api.get('/rutas/colas'),
    procesarCola:   (atraccionId)      => api.post(`/rutas/colas/${atraccionId}/procesar`),
    getFlujoPorZona:()                 => api.get('/rutas/flujo'),
}

// ─── Clima ───────────────────────────────────────────────────────────────────
export const climaService = {
    activarTormenta: () => api.post('/alertas/tormenta'),
    activarLluvia:   () => api.post('/alertas/lluvia'),
    getAlertasActivas:() => api.get('/alertas'),
    desactivar:     (id) => api.delete(`/alertas/${id}`),
}

// ─── Estadísticas ────────────────────────────────────────────────────────────
export const estadisticasService = {
    getIngresos:          () => api.get('/estadisticas/ingresos'),
    getAtraccionesPopulares:() => api.get('/estadisticas/atracciones-populares'),
    getTiemposEspera:     () => api.get('/estadisticas/tiempos-espera'),
    getCierresPorClima:   () => api.get('/estadisticas/cierres-clima'),
    getAlertasMantenimiento:() => api.get('/estadisticas/mantenimiento'),
    getIncidentes:        () => api.get('/estadisticas/incidentes'),
}