// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
    parqueService,
    zonaService,
    atraccionService,
    operadorService,
    alertaService,
    reporteService,
    visitanteService,
} from '@/services/parqueService'

// ─── Precios reales del backend ───────────────────────────────────────────────
export const COSTO_TICKET = {
    GENERAL:   50000,
    FAMILIAR:  70000,
    FAST_PASS: 120000,
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null)

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
    return ctx
}

// ─── Helper: deriva visitantesActuales por zona ───────────────────────────────
// Con los fixes en ServicioParque, Zona.visitantesActuales ya se incrementa
// en validarAcceso() y se decrementa en procesarCola(), así que GET /api/zonas
// devuelve el valor real. El fallback suma visitantesEnCola (nuevo campo en
// GET /api/atracciones) para máxima precisión cuando el valor de zona es 0.
function enriquecerZonasConVisitantes(zonasData, atraccionesPorZonaData) {
    return zonasData.map(zona => {
        const atracs = atraccionesPorZonaData[zona.id] ?? []
        // visitantesEnCola = personas en cola ahora mismo (campo nuevo del backend)
        // visitantes = contadorVisitantes de /api/zonas/{id}/atracciones
        const derivado = atracs.reduce(
            (sum, a) => sum + (a.visitantesEnCola ?? a.visitantes ?? a.contadorVisitantes ?? 0), 0
        )
        return {
            ...zona,
            visitantesActuales: (zona.visitantesActuales ?? 0) > 0
                ? zona.visitantesActuales
                : derivado,
            // exponer ambos para que el frontend pueda decidir
            _visitantesCola: derivado,
        }
    })
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {

    // ── Parque ────────────────────────────────────────────────────────────────
    const [parqueInfo,           setParqueInfo]           = useState(null)
    const [zonas,                setZonas]                = useState([])
    const [atracciones,          setAtracciones]          = useState([])
    const [atraccionesPorZona,   setAtraccionesPorZona]   = useState({})
    const [operadores,           setOperadores]           = useState([])
    const [alertasClimaticas,    setAlertasClimaticas]    = useState([])
    const [alertasMantenimiento, setAlertasMantenimiento] = useState([])
    const [resumen,              setResumen]              = useState(null)
    const [jornada,              setJornada]              = useState(null)
    const [datosCargados,        setDatosCargados]        = useState(false)
    const [cargandoGlobal,       setCargandoGlobal]       = useState(true)
    const [backendOk,            setBackendOk]            = useState(null)

    // ── Visitantes del parque (lista completa) ────────────────────────────────
    const [visitantesParque,     setVisitantesParque]     = useState([])

    // ── Visitante activo — persiste entre navegaciones ────────────────────────
    const [visitante, setVisitanteRaw] = useState(null)
    const [saldo,     setSaldo]        = useState(null)
    const [historial, setHistorial]    = useState([])
    const [favoritos, setFavoritos]    = useState([])
    const [notifs,    setNotifs]       = useState([])

    const fetchedRef = useRef(false)

    const setVisitante = useCallback((v) => setVisitanteRaw(v), [])

    // ── Listar todos los visitantes ───────────────────────────────────────────
    const listarVisitantes = useCallback(async () => {
        try {
            const res = await visitanteService.getAll()
            setVisitantesParque(res.data ?? [])
            return res.data ?? []
        } catch {
            return []
        }
    }, [])

    // ── Login de visitante existente ──────────────────────────────────────────
    const loginVisitante = useCallback(async (email, contrasena) => {
        const res = await visitanteService.login(email, contrasena)
        const data = res.data
        // Limpiar estado del visitante anterior
        setHistorial([])
        setFavoritos([])
        setNotifs([])
        // Guardar visitante logueado
        const v = {
            id:          data.idVisitante,
            nombre:      data.nombre,
            email:       data.email,
            tipoTicket:  normalizarTipo(data.tipoTicket),
            backendTipo: data.tipoTicket,
            saldoInicial: data.saldo,
        }
        setVisitanteRaw(v)
        setSaldo(data.saldo ?? 0)
        // Cargar historial y notifs
        try {
            const [histRes, notifRes] = await Promise.allSettled([
                visitanteService.getHistorial(data.idVisitante),
                alertaService.getNotificaciones(data.idVisitante),
            ])
            if (histRes.status === 'fulfilled') {
                const raw = histRes.value?.data
                setHistorial(Array.isArray(raw) ? raw : (raw?.historial ?? []))
            }
            if (notifRes.status === 'fulfilled' && notifRes.value?.data)
                setNotifs(notifRes.value.data)
        } catch { /* silencioso */ }
        return v
    }, [])

    // ── Registrar visitante nuevo ─────────────────────────────────────────────
    const registrarVisitante = useCallback(async (data) => {
        setHistorial([])
        setFavoritos([])
        setNotifs([])
        setSaldo(null)
        setVisitanteRaw(data)

        // Descontar costo del ticket del saldo (el backend no lo hace)
        const costoTicket        = COSTO_TICKET[data.backendTipo] ?? 0
        const saldoTrasDescuento = Math.max(0, (data.saldoInicial ?? 0) - costoTicket)
        setSaldo(saldoTrasDescuento)

        // Actualizar lista de visitantes del parque
        listarVisitantes()

        try {
            const [histRes, notifRes] = await Promise.allSettled([
                visitanteService.getHistorial(data.id),
                alertaService.getNotificaciones(data.id),
            ])
            if (histRes.status === 'fulfilled') {
                const raw = histRes.value?.data
                setHistorial(Array.isArray(raw) ? raw : (raw?.historial ?? []))
            }
            if (notifRes.status === 'fulfilled' && notifRes.value?.data)
                setNotifs(notifRes.value.data)
        } catch { /* silencioso */ }
    }, [listarVisitantes])

    // ── Carga completa ────────────────────────────────────────────────────────
    const refrescarTodo = useCallback(async () => {
        setCargandoGlobal(true)
        try {
            const [
                resInfo, resZonas, resAtracciones, resOperadores,
                resClimaticas, resMantenimiento, resResumen, resJornada, resCarga,
            ] = await Promise.allSettled([
                parqueService.getInfo(),
                zonaService.getAll(),
                atraccionService.getAll(),
                operadorService.getAll(),
                alertaService.getClimaticas(),
                alertaService.getMantenimiento(),
                reporteService.getResumen(),
                reporteService.getJornada(),
                parqueService.estadoCarga(),
            ])

            if (resInfo.status          === 'fulfilled') setParqueInfo(resInfo.value.data)
            if (resAtracciones.status   === 'fulfilled') setAtracciones(resAtracciones.value.data ?? [])
            if (resOperadores.status    === 'fulfilled') setOperadores(resOperadores.value.data ?? [])
            if (resClimaticas.status    === 'fulfilled') setAlertasClimaticas(resClimaticas.value.data ?? [])
            if (resMantenimiento.status === 'fulfilled') setAlertasMantenimiento(resMantenimiento.value.data ?? [])
            if (resResumen.status       === 'fulfilled') setResumen(resResumen.value.data)
            if (resJornada.status       === 'fulfilled') setJornada(resJornada.value.data)
            if (resCarga.status         === 'fulfilled') setDatosCargados(resCarga.value.data?.cargado ?? false)

            if (resZonas.status === 'fulfilled') {
                const zonasData = resZonas.value.data ?? []

                // Cargar atracciones por zona para derivar visitantesActuales
                const fetches = await Promise.allSettled(
                    zonasData.map(z => zonaService.getAtracciones(z.id))
                )
                const mapa = {}
                fetches.forEach((res, idx) => {
                    if (res.status === 'fulfilled') {
                        mapa[zonasData[idx].id] = res.value.data?.atracciones ?? []
                    }
                })
                setAtraccionesPorZona(mapa)

                // Enriquecer zonas con visitantesActuales derivados
                const zonasEnriquecidas = enriquecerZonasConVisitantes(zonasData, mapa)
                setZonas(zonasEnriquecidas)
            }

            // Cargar lista de visitantes del parque
            listarVisitantes()

            setBackendOk(true)
        } catch {
            setBackendOk(false)
        } finally {
            setCargandoGlobal(false)
        }
    }, [listarVisitantes])

    // ── Solo atracciones ──────────────────────────────────────────────────────
    const refrescarAtracciones = useCallback(async () => {
        try {
            const [resAtr, resZonas, resInfo] = await Promise.allSettled([
                atraccionService.getAll(),
                zonaService.getAll(),
                parqueService.getInfo(),
            ])
            if (resInfo.status === 'fulfilled') setParqueInfo(resInfo.value.data)
            if (resAtr.status === 'fulfilled') setAtracciones(resAtr.value.data ?? [])
            if (resZonas.status === 'fulfilled') {
                const zonasData = resZonas.value.data ?? []
                const fetches = await Promise.allSettled(
                    zonasData.map(z => zonaService.getAtracciones(z.id))
                )
                const mapa = {}
                fetches.forEach((res, idx) => {
                    if (res.status === 'fulfilled') {
                        mapa[zonasData[idx].id] = res.value.data?.atracciones ?? []
                    }
                })
                setAtraccionesPorZona(mapa)
                setZonas(enriquecerZonasConVisitantes(zonasData, mapa))
            }
        } catch { /* silencioso */ }
    }, [])

    const refrescarOperadores = useCallback(async () => {
        try {
            const res = await operadorService.getAll()
            setOperadores(res.data ?? [])
        } catch { /* silencioso */ }
    }, [])

    const refrescarAlertas = useCallback(async () => {
        try {
            const [resC, resM] = await Promise.allSettled([
                alertaService.getClimaticas(),
                alertaService.getMantenimiento(),
            ])
            if (resC.status === 'fulfilled') setAlertasClimaticas(resC.value.data ?? [])
            if (resM.status === 'fulfilled') setAlertasMantenimiento(resM.value.data ?? [])
        } catch { /* silencioso */ }
    }, [])

    const refrescarReportes = useCallback(async () => {
        try {
            const [resR, resJ, resInfo] = await Promise.allSettled([
                reporteService.getResumen(),
                reporteService.getJornada(),
                parqueService.getInfo(),
            ])
            if (resR.status    === 'fulfilled') setResumen(resR.value.data)
            if (resJ.status    === 'fulfilled') setJornada(resJ.value.data)
            if (resInfo.status === 'fulfilled') setParqueInfo(resInfo.value.data)
        } catch { /* silencioso */ }
    }, [])

    useEffect(() => {
        if (fetchedRef.current) return
        fetchedRef.current = true
        refrescarTodo()
    }, [refrescarTodo])

    const value = {
        parqueInfo, zonas, atracciones, atraccionesPorZona,
        operadores, alertasClimaticas, alertasMantenimiento,
        resumen, jornada, datosCargados, cargandoGlobal, backendOk,

        // Visitante activo
        visitante, saldo, historial, favoritos, notifs,
        COSTO_TICKET,
        setVisitante,
        registrarVisitante,
        setSaldo, setHistorial, setFavoritos, setNotifs,

        // Visitantes del parque
        visitantesParque,
        listarVisitantes,
        loginVisitante,

        setOperadores, setAtracciones,
        setAlertasClimaticas, setAlertasMantenimiento, setDatosCargados,

        refrescarTodo, refrescarAtracciones, refrescarOperadores,
        refrescarAlertas, refrescarReportes,
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}

// ─── Helper exportado para normalizar tipo de ticket ─────────────────────────
export function normalizarTipo(tipo) {
    if (!tipo) return 'GENERAL'
    const t = tipo.toUpperCase()
    if (t === 'FAST_PASS' || t === 'FASTPASS') return 'FASTPASS'
    return t
}