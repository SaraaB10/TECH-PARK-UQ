// src/pages/Carga.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Rocket, Database, Server, Wifi, WifiOff, CheckCircle,
    XCircle, AlertTriangle, Clock, RefreshCw, Terminal,
    Zap, Users, MapPin, Activity, Play, Trash2,
    Upload, Shield, TrendingUp, Circle, ChevronRight,
    BarChart3, Package, HardDrive, Cpu, Signal
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import {
    parqueService,
    zonaService,
    atraccionService,
    operadorService,
    alertaService,
} from '@/services/parqueService'
import { useApp } from '@/context/AppContext'

// ─── Escenarios reales ────────────────────────────────────────────────────────
const ESCENARIOS = [
    {
        id: 'prueba',
        nombre: 'Prueba rápida',
        desc: 'Escenario reducido hardcodeado — ideal para sustentación y demos rápidas',
        icon: '⚡',
        color: '#e9c46a',
        call: () => parqueService.cargarDatosPrueba(),
    },
]

const PASOS_CARGA = [
    { id: 'ping',        label: 'Verificando conexión al backend',    fase: 'pre'  },
    { id: 'estado',      label: 'Consultando estado del sistema',     fase: 'pre'  },
    { id: 'envio',       label: 'Enviando solicitud de carga',        fase: 'load' },
    { id: 'procesando',  label: 'Procesando datos en el servidor',    fase: 'load' },
    { id: 'zonas',       label: 'Verificando zonas del parque',       fase: 'post' },
    { id: 'atracciones', label: 'Verificando atracciones y senderos', fase: 'post' },
    { id: 'operadores',  label: 'Verificando operadores registrados', fase: 'post' },
    { id: 'alertas',     label: 'Verificando alertas configuradas',   fase: 'post' },
    { id: 'listo',       label: 'Sistema listo',                      fase: 'post' },
]

function ts() {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
function formatMs(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

// ─── Hook: backend ping ───────────────────────────────────────────────────────
function useBackendStatus() {
    const [status,  setStatus]  = useState('checking')
    const [latency, setLatency] = useState(null)

    const ping = useCallback(async () => {
        setStatus('checking')
        const t0 = performance.now()
        try {
            await parqueService.estadoCarga()
            setLatency(Math.round(performance.now() - t0))
            setStatus('online')
        } catch {
            setLatency(null)
            setStatus('offline')
        }
    }, [])

    useEffect(() => {
        ping()
        const iv = setInterval(ping, 15000)
        return () => clearInterval(iv)
    }, [ping])

    return { status, latency, ping }
}

// ─── Hook: resumen real del sistema ──────────────────────────────────────────
function useSistemaReal(datosCargadosCtx) {
    const [sistema,  setSistema]  = useState(null)
    const [cargado,  setCargado]  = useState(false)
    const [cargando, setCargando] = useState(false)

    // Permite poblar el resumen directamente tras una carga exitosa
    function aplicarResumen(resumenReal) {
        setSistema(resumenReal)
        setCargado(true)
    }

    const cargarResumen = useCallback(async () => {
        setCargando(true)
        try {
            // Verificar el flag del backend, pero no bloquear si no existe
            let yaHayDatos = false
            try {
                const estadoRes = await parqueService.estadoCarga()
                yaHayDatos = estadoRes.data?.cargado === true
            } catch { /* continuar si el endpoint falla */ }

            const [zonasRes, atraccionesRes, operadoresRes, alertasRes] = await Promise.allSettled([
                zonaService.getAll(), atraccionService.getAll(), operadorService.getAll(), alertaService.getMantenimiento(),
            ])

            const zonas       = zonasRes.status       === 'fulfilled' ? zonasRes.value.data       : []
            const atracciones = atraccionesRes.status === 'fulfilled' ? atraccionesRes.value.data : []
            const operadores  = operadoresRes.status  === 'fulfilled' ? operadoresRes.value.data  : []
            const alertas     = alertasRes.status     === 'fulfilled' ? alertasRes.value.data     : []

            // Usar datos reales directamente, sin depender solo del flag
            const hayDatosReales = (Array.isArray(zonas) && zonas.length > 0) ||
                (Array.isArray(atracciones) && atracciones.length > 0)

            if (!yaHayDatos && !hayDatosReales) { setCargado(false); setSistema(null); return }

            setSistema({
                zonas:       Array.isArray(zonas)       ? zonas.length       : 0,
                atracciones: Array.isArray(atracciones) ? atracciones.length : 0,
                operadores:  Array.isArray(operadores)  ? operadores.length  : 0,
                visitantes:  Array.isArray(zonas) ? zonas.reduce((acc, z) => acc + (z.visitantesActuales || 0), 0) : 0,
                senderos:    Array.isArray(atracciones) ? atracciones.length : 0,
                alertas:     Array.isArray(alertas)     ? alertas.length     : 0,
            })
            setCargado(true)
        } catch { setCargado(false); setSistema(null) }
        finally  { setCargando(false) }
    }, [])

    // Sincronizar con el contexto global
    useEffect(() => {
        if (datosCargadosCtx) cargarResumen()
    }, [datosCargadosCtx, cargarResumen])

    return { sistema, cargado, cargandoResumen: cargando, cargarResumen, aplicarResumen }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroCarga({ backendStatus, latency, cargado }) {
    const online   = backendStatus === 'online'
    const checking = backendStatus === 'checking'
    return (
        <div className="relative overflow-hidden rounded-3xl mb-8"
             style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}>
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#e63946' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                 style={{ background: 'rgba(42,157,143,0.2)', border: '0.5px solid rgba(42,157,143,0.3)' }}>
                                <Database size={16} style={{ color: '#2a9d8f' }} />
                            </div>
                            <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>Centro de datos</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Carga de <span className="text-rainbow">Datos</span>
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                            Inicializa el sistema con escenarios de prueba — zonas, atracciones, operadores y visitantes listos al instante.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3"
                             style={{ border: `0.5px solid ${online ? 'rgba(34,197,94,0.25)' : checking ? 'rgba(233,196,106,0.25)' : 'rgba(230,57,70,0.25)'}` }}>
                            <div className="relative">
                                {online   ? <Wifi   size={18} style={{ color: '#22c55e' }} />
                                    : checking ? <Signal size={18} style={{ color: '#e9c46a' }} />
                                        :            <WifiOff size={18} style={{ color: '#e63946' }} />}
                                {online && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500"><span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" /></span>}
                            </div>
                            <div>
                                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: online ? '#22c55e' : checking ? '#e9c46a' : '#e63946' }}>
                                    {checking ? 'Verificando…' : online ? 'Backend online' : 'Desconectado'}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{online && latency ? `${latency}ms latencia` : 'localhost:8080'}</div>
                            </div>
                        </div>
                        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                            <HardDrive size={18} style={{ color: cargado ? '#22c55e' : 'var(--c-muted)' }} />
                            <div>
                                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: cargado ? '#22c55e' : 'var(--c-muted)' }}>
                                    {cargado ? 'Datos cargados' : 'Sin datos'}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>Estado del sistema</div>
                            </div>
                        </div>
                        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                            <Server size={18} style={{ color: '#457b9d' }} />
                            <div>
                                <div className="text-xs font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#457b9d' }}>localhost:8080</div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>API endpoint</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Panel de carga ───────────────────────────────────────────────────────────
function PanelCarga({ onLog, onCargaCompleta }) {
    const [escenario,  setEscenario]  = useState('prueba')
    const [cargando,   setCargando]   = useState(false)
    const [progreso,   setProgreso]   = useState(0)
    const [pasoActual, setPasoActual] = useState(null)
    const [pasosOk,    setPasosOk]    = useState([])
    const [error,      setError]      = useState(null)
    const [exitoso,    setExitoso]    = useState(false)

    const esc = ESCENARIOS.find(e => e.id === escenario) || ESCENARIOS[0]

    async function ejecutarCarga() {
        setCargando(true); setProgreso(0); setPasosOk([]); setError(null); setExitoso(false)
        const t0 = performance.now(); const total = PASOS_CARGA.length; const count = { count: 0 }
        onLog({ tipo: 'info', msg: `Iniciando: ${esc.nombre}` })
        try {
            // ── FASE PRE ──────────────────────────────────────────────────────
            for (const paso of PASOS_CARGA.filter(p => p.fase === 'pre')) {
                setPasoActual(paso.id); onLog({ tipo: 'log', msg: `▸ ${paso.label}…` })
                if (paso.id === 'ping') {
                    await parqueService.estadoCarga()
                    onLog({ tipo: 'ok', msg: '✓ Backend respondiendo correctamente' })
                } else if (paso.id === 'estado') {
                    const estadoRes = await parqueService.estadoCarga()
                    onLog({ tipo: 'ok', msg: `✓ ${estadoRes.data?.mensaje || 'Estado verificado'}` })
                }
                count.count++; setProgreso(Math.round((count.count / total) * 100))
                setPasosOk(prev => [...prev, paso.id])
            }
            // ── FASE LOAD ─────────────────────────────────────────────────────
            for (const paso of PASOS_CARGA.filter(p => p.fase === 'load')) {
                setPasoActual(paso.id); onLog({ tipo: 'log', msg: `▸ ${paso.label}…` })
                count.count++
                if (paso.id === 'envio') {
                    onLog({ tipo: 'info', msg: `POST /api/parque/cargar-datos-prueba` })
                    const res = await esc.call()
                    const respMsg = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
                    onLog({ tipo: 'ok', msg: `✓ Servidor respondió: ${respMsg}` })
                } else {
                    onLog({ tipo: 'ok', msg: `✓ ${paso.label}` })
                }
                setProgreso(Math.round((count.count / total) * 100))
                setPasosOk(prev => [...prev, paso.id])
            }
            // ── FASE POST ─────────────────────────────────────────────────────
            const [zonasRes, atraccionesRes, operadoresRes, alertasRes] = await Promise.allSettled([
                zonaService.getAll(), atraccionService.getAll(), operadorService.getAll(), alertaService.getMantenimiento(),
            ])
            const zonas       = zonasRes.status       === 'fulfilled' ? zonasRes.value.data       : []
            const atracciones = atraccionesRes.status === 'fulfilled' ? atraccionesRes.value.data : []
            const operadores  = operadoresRes.status  === 'fulfilled' ? operadoresRes.value.data  : []
            const alertas     = alertasRes.status     === 'fulfilled' ? alertasRes.value.data     : []

            for (const paso of PASOS_CARGA.filter(p => p.fase === 'post')) {
                setPasoActual(paso.id); onLog({ tipo: 'log', msg: `▸ ${paso.label}…` })
                count.count++
                if      (paso.id === 'zonas')       onLog({ tipo: 'ok', msg: `✓ ${Array.isArray(zonas)       ? zonas.length       : 0} zonas verificadas` })
                else if (paso.id === 'atracciones') onLog({ tipo: 'ok', msg: `✓ ${Array.isArray(atracciones) ? atracciones.length : 0} atracciones verificadas` })
                else if (paso.id === 'operadores')  onLog({ tipo: 'ok', msg: `✓ ${Array.isArray(operadores)  ? operadores.length  : 0} operadores verificados` })
                else if (paso.id === 'alertas')     onLog({ tipo: 'ok', msg: `✓ ${Array.isArray(alertas)     ? alertas.length     : 0} alertas configuradas` })
                else if (paso.id === 'listo')       onLog({ tipo: 'ok', msg: '✓ Sistema listo' })
                setProgreso(Math.round((count.count / total) * 100))
                setPasosOk(prev => [...prev, paso.id])
            }

            const duracionMs = Math.round(performance.now() - t0)
            const resumenReal = {
                zonas:       Array.isArray(zonas)       ? zonas.length       : 0,
                atracciones: Array.isArray(atracciones) ? atracciones.length : 0,
                operadores:  Array.isArray(operadores)  ? operadores.length  : 0,
                visitantes:  Array.isArray(zonas) ? zonas.reduce((acc, z) => acc + (z.visitantesActuales || 0), 0) : 0,
                senderos:    Array.isArray(atracciones) ? atracciones.length : 0,
                alertas:     Array.isArray(alertas)     ? alertas.length     : 0,
            }
            setPasoActual(null); setCargando(false); setExitoso(true); setProgreso(100)
            onLog({ tipo: 'success', msg: `════ ${esc.nombre} cargado exitosamente en ${formatMs(duracionMs)} ════` })
            onCargaCompleta(esc, duracionMs, resumenReal)

        } catch (err) {
            const msg = err?.response?.data
                ? (typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data))
                : err.message || 'Error desconocido'
            setError(msg); setCargando(false); setPasoActual(null)
            onLog({ tipo: 'error', msg: `✗ Error en la carga: ${msg}` })
            onLog({ tipo: 'warn',  msg: 'Verifica que el servidor Spring Boot esté corriendo en localhost:8080' })
        }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                    <Upload size={15} style={{ color: '#2a9d8f' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Panel de carga</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Selecciona y ejecuta un escenario de prueba</p>
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 gap-3 mb-6">
                    {ESCENARIOS.map((e) => (
                        <button key={e.id} disabled={cargando}
                                onClick={() => { setEscenario(e.id); setError(null); setExitoso(false) }}
                                className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01] duration-200 disabled:opacity-50"
                                style={{ background: escenario === e.id ? `${e.color}14` : 'rgba(255,255,255,0.03)', border: `${escenario === e.id ? '1.5px' : '0.5px'} solid ${escenario === e.id ? e.color : 'var(--c-border)'}` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{e.icon}</span>
                                <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: escenario === e.id ? e.color : 'var(--c-text)' }}>{e.nombre}</span>
                                {escenario === e.id && <CheckCircle size={14} style={{ color: e.color, marginLeft: 'auto', flexShrink: 0 }} />}
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>{e.desc}</p>
                            <div className="mt-2 text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: e.color, opacity: 0.8 }}>
                                POST /api/parque/cargar-datos-prueba
                            </div>
                        </button>
                    ))}
                </div>

                {error && !cargando && (
                    <div className="flex items-start gap-3 rounded-xl p-4 mb-4"
                         style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.3)' }}>
                        <XCircle size={16} style={{ color: '#e63946', flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <p className="text-sm font-semibold" style={{ color: '#e63946', fontFamily: 'var(--font-display)' }}>Error en la carga</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{error}</p>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3 mb-6">
                    <Button variant="primary" size="lg" loading={cargando} onClick={ejecutarCarga} disabled={cargando}>
                        <Rocket size={16} />{cargando ? 'Cargando escenario…' : `Cargar: ${esc.nombre}`}
                    </Button>
                    {exitoso && !cargando && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                             style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.25)' }}>
                            <CheckCircle size={15} />
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Cargado correctamente</span>
                        </div>
                    )}
                </div>

                {(cargando || exitoso) && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}>
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>
                                {cargando ? (PASOS_CARGA.find(p => p.id === pasoActual)?.label || 'Procesando…') : 'Completado'}
                            </span>
                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: esc.color }}>{progreso}%</span>
                        </div>
                        <ProgressBar value={progreso} max={100} color={exitoso ? '#22c55e' : esc.color} />
                        <div className="mt-4 grid grid-cols-2 gap-1.5">
                            {PASOS_CARGA.map((paso) => {
                                const ok     = pasosOk.includes(paso.id)
                                const activo = pasoActual === paso.id
                                return (
                                    <div key={paso.id} className="flex items-center gap-2 text-xs">
                                        {ok
                                            ? <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                                            : activo
                                                ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: esc.color, borderTopColor: 'transparent' }} />
                                                : <Circle size={12} style={{ color: 'var(--c-border)', flexShrink: 0 }} />
                                        }
                                        <span className="truncate" style={{ color: ok ? 'var(--c-dim)' : activo ? 'var(--c-text)' : 'rgba(107,114,128,0.5)' }}>{paso.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Estado del backend ───────────────────────────────────────────────────────
function EstadoBackend({ status, latency, onPing }) {
    const online   = status === 'online'
    const checking = status === 'checking'
    const ENDPOINTS = [
        { path: '/api/parque/cargar-datos-prueba', metodo: 'POST', ok: online },
        { path: '/api/parque/estado-carga',        metodo: 'GET',  ok: online },
        { path: '/api/zonas',                      metodo: 'GET',  ok: online },
        { path: '/api/atracciones',                metodo: 'GET',  ok: online },
        { path: '/api/operadores',                 metodo: 'GET',  ok: online },
    ]
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: online ? 'rgba(34,197,94,0.12)' : 'rgba(230,57,70,0.12)', border: `0.5px solid ${online ? 'rgba(34,197,94,0.25)' : 'rgba(230,57,70,0.25)'}` }}>
                        <Server size={15} style={{ color: online ? '#22c55e' : '#e63946' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Estado del backend</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Spring Boot · localhost:8080</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onPing} loading={checking}><RefreshCw size={13} /> Verificar</Button>
            </div>
            <div className="p-5">
                <div className="flex items-center justify-between rounded-2xl p-4 mb-5"
                     style={{ background: online ? 'rgba(34,197,94,0.07)' : checking ? 'rgba(233,196,106,0.07)' : 'rgba(230,57,70,0.07)', border: `0.5px solid ${online ? 'rgba(34,197,94,0.2)' : checking ? 'rgba(233,196,106,0.2)' : 'rgba(230,57,70,0.2)'}` }}>
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: online ? 'rgba(34,197,94,0.15)' : 'rgba(230,57,70,0.15)' }}>
                            {online ? <Wifi size={20} style={{ color: '#22c55e' }} /> : <WifiOff size={20} style={{ color: '#e63946' }} />}
                            {online && <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}><span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#22c55e', opacity: 0.5 }} /></span>}
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: online ? '#22c55e' : checking ? '#e9c46a' : '#e63946' }}>
                                {checking ? 'Verificando conexión…' : online ? 'Backend conectado' : 'Backend no disponible'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{online ? 'API respondiendo correctamente' : 'Inicia el servidor Spring Boot'}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        {online && latency && (
                            <>
                                <div className="text-xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: latency < 100 ? '#22c55e' : latency < 300 ? '#f4a261' : '#e63946' }}>{latency}ms</div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>latencia</div>
                            </>
                        )}
                        {!online && !checking && (
                            <code className="text-xs font-mono px-3 py-1.5 rounded-lg"
                                  style={{ fontFamily: 'var(--font-mono)', background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                                localhost:8080
                            </code>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Latencia',   value: online && latency ? `${latency}ms` : '—', color: online && latency && latency < 100 ? '#22c55e' : '#f4a261', icon: Signal     },
                        { label: 'Estado API', value: online ? '200 OK' : 'Sin resp.',           color: online ? '#22c55e' : '#e63946',                             icon: Shield     },
                        { label: 'Uptime',     value: online ? '100%'   : '0%',                 color: online ? '#22c55e' : '#e63946',                             icon: TrendingUp },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${color}0d`, border: `0.5px solid ${color}22` }}>
                            <Ico size={14} style={{ color, margin: '0 auto 4px' }} />
                            <div className="text-sm font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>{value}</div>
                            <div className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{label}</div>
                        </div>
                    ))}
                </div>
                <div>
                    <p className="tp-label mb-2">Endpoints disponibles</p>
                    <div className="space-y-1.5">
                        {ENDPOINTS.map((ep) => (
                            <div key={ep.path} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}>
                                <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, background: ep.metodo === 'POST' ? 'rgba(42,157,143,0.15)' : 'rgba(69,123,157,0.15)', color: ep.metodo === 'POST' ? '#2a9d8f' : '#457b9d' }}>
                                    {ep.metodo}
                                </span>
                                <code className="text-xs font-mono flex-1 truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', fontSize: 11 }}>{ep.path}</code>
                                {ep.ok ? <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} /> : <XCircle size={12} style={{ color: 'rgba(107,114,128,0.4)', flexShrink: 0 }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Resumen del sistema ──────────────────────────────────────────────────────
function ResumenSistema({ sistema, cargado, cargandoResumen }) {
    const items = [
        { label: 'Zonas',       value: sistema?.zonas       ?? 0, icon: MapPin,        color: '#f4a261' },
        { label: 'Atracciones', value: sistema?.atracciones ?? 0, icon: Activity,      color: '#2a9d8f' },
        { label: 'Operadores',  value: sistema?.operadores  ?? 0, icon: Users,         color: '#457b9d' },
        { label: 'Visitantes',  value: sistema?.visitantes  ?? 0, icon: Users,         color: '#6a4c93' },
        { label: 'Senderos',    value: sistema?.senderos    ?? 0, icon: ChevronRight,  color: '#22c55e' },
        { label: 'Alertas',     value: sistema?.alertas     ?? 0, icon: AlertTriangle, color: '#e63946' },
    ]
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                    <Package size={15} style={{ color: '#6a4c93' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Resumen del sistema</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        {cargandoResumen ? 'Consultando backend…' : cargado ? 'Datos activos en memoria' : 'Sin datos cargados — usa el panel de carga'}
                    </p>
                </div>
                {cargandoResumen
                    ? <div className="ml-auto w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#6a4c93', borderTopColor: 'transparent' }} />
                    : cargado
                        ? <Badge variant="active"  dot className="ml-auto">Activo</Badge>
                        : <Badge variant="closed"  dot className="ml-auto">Vacío</Badge>
                }
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(({ label, value, icon: Ico, color }) => (
                    <div key={label} className="rounded-xl p-4 relative overflow-hidden group"
                         style={{ background: `${color}0a`, border: `0.5px solid ${color}22` }}>
                        <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-0 group-hover:opacity-10 transition-opacity blur-xl" style={{ background: color }} />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <Ico size={14} style={{ color }} />
                                {!cargado && <span className="text-xs" style={{ color: 'var(--c-border)', fontSize: 10 }}>—</span>}
                            </div>
                            <div className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)', color: cargado ? color : 'var(--c-border)' }}>
                                {cargado ? value : '0'}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)', fontSize: 11 }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Historial de cargas ──────────────────────────────────────────────────────
function HistorialCargas({ historial }) {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                    <Clock size={15} style={{ color: '#457b9d' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Historial de cargas</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        {historial.length === 0 ? 'Sin ejecuciones en esta sesión' : `${historial.length} ejecución${historial.length !== 1 ? 'es' : ''} en esta sesión`}
                    </p>
                </div>
            </div>
            {historial.length === 0 ? (
                <div className="px-6 py-10 text-center">
                    <Database size={28} style={{ color: 'var(--c-border)', margin: '0 auto 12px' }} />
                    <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Aún no se ha ejecutado ninguna carga en esta sesión.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="tp-table">
                        <thead><tr><th>Escenario</th><th className="hidden sm:table-cell">Hora</th><th className="hidden md:table-cell">Duración</th><th className="hidden lg:table-cell">Datos</th><th>Estado</th></tr></thead>
                        <tbody>
                        {historial.map((h) => (
                            <tr key={h.id}>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)', fontSize: 12 }}>
                                            {ESCENARIOS.find(e => e.nombre === h.escenario)?.icon || '📦'}
                                        </div>
                                        <span className="text-sm" style={{ color: 'var(--c-text)' }}>{h.escenario}</span>
                                    </div>
                                </td>
                                <td className="hidden sm:table-cell"><span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)' }}>{h.hora}</span></td>
                                <td className="hidden md:table-cell"><span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>{h.duracion}</span></td>
                                <td className="hidden lg:table-cell">
                                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)' }}>
                                        {h.estado === 'EXITOSO' && h.resumen
                                            ? <><span>{h.resumen.zonas} zonas</span><span>·</span><span>{h.resumen.atracciones} atracciones</span><span>·</span><span>{h.resumen.operadores} operadores</span></>
                                            : <span>—</span>}
                                    </div>
                                </td>
                                <td><Badge variant={h.estado === 'EXITOSO' ? 'active' : 'closed'} dot>{h.estado === 'EXITOSO' ? 'Exitoso' : 'Error'}</Badge></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ─── Consola visual ───────────────────────────────────────────────────────────
function ConsolaVisual({ logs, onLimpiar }) {
    const bottomRef = useRef(null)
    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

    const COLOR = {
        info:    { color: '#457b9d',               prefix: 'INFO ' },
        log:     { color: 'rgba(232,234,240,0.5)',  prefix: 'LOG  ' },
        ok:      { color: '#2a9d8f',               prefix: 'OK   ' },
        success: { color: '#22c55e',               prefix: '★    ' },
        warn:    { color: '#e9c46a',               prefix: 'WARN ' },
        error:   { color: '#e63946',               prefix: 'ERR  ' },
    }

    return (
        <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 380 }}>
            <div className="px-5 py-3 border-b flex items-center justify-between flex-shrink-0" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(13,15,20,0.8)', border: '0.5px solid var(--c-border)' }}>
                        <Terminal size={14} style={{ color: '#22c55e' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Consola del sistema</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{logs.length} eventos registrados</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5 mr-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: '#e63946' }} />
                        <span className="w-3 h-3 rounded-full" style={{ background: '#e9c46a' }} />
                        <span className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                    </div>
                    <button onClick={onLimpiar} className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--c-muted)', border: '0.5px solid var(--c-border)' }}>
                        <Trash2 size={11} /> Limpiar
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-0.5" style={{ background: 'rgba(8,10,14,0.8)', fontFamily: 'var(--font-mono)' }}>
                {logs.length === 0 && <p className="text-xs" style={{ color: 'rgba(107,114,128,0.4)', fontFamily: 'var(--font-mono)' }}>~ Esperando eventos del sistema…</p>}
                {logs.map((log, i) => {
                    const cfg = COLOR[log.tipo] || COLOR.log
                    return (
                        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                            <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 10, flexShrink: 0, paddingTop: 1 }}>{log.hora}</span>
                            <span className="font-bold flex-shrink-0" style={{ color: cfg.color, fontSize: 10 }}>{cfg.prefix}</span>
                            <span style={{ color: cfg.color === COLOR.log.color ? 'rgba(232,234,240,0.55)' : cfg.color }}>{log.msg}</span>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>
            <div className="px-4 py-2 border-t flex items-center justify-between flex-shrink-0"
                 style={{ borderColor: 'var(--c-border)', background: 'rgba(8,10,14,0.9)' }}>
                <span className="text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', color: '#22c55e', fontSize: 10 }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
                    sistema operativo
                </span>
                <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(107,114,128,0.4)', fontSize: 10 }}>Tech-Park UQ v1.0</span>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Carga() {
    const { status, latency, ping } = useBackendStatus()

    // Acceso al contexto global para refrescar TODO tras una carga exitosa
    const { datosCargados, setDatosCargados, refrescarTodo } = useApp()

    const { sistema, cargado, cargandoResumen, cargarResumen, aplicarResumen } = useSistemaReal(datosCargados)

    const [historial, setHistorial] = useState([])
    const [logs, setLogs] = useState([
        { tipo: 'info', msg: 'Sistema iniciado — Tech-Park UQ v1.0', hora: ts() },
        { tipo: 'log',  msg: 'Esperando instrucciones de carga…',    hora: ts() },
    ])

    useEffect(() => {
        window.scrollTo(0, 0)
        cargarResumen()
    }, [cargarResumen])

    function addLog(entry) { setLogs(prev => [...prev, { ...entry, hora: ts() }]) }

    async function handleCargaCompleta(esc, duracionMs, resumenReal) {
        // Poblar el resumen directamente con los datos que ya tenemos (sin re-query)
        aplicarResumen(resumenReal)
        setDatosCargados(true)
        // Notifica al contexto global para que TODAS las páginas reciban los datos nuevos
        await refrescarTodo()
        // Re-consultar para sincronizar con el backend (actualiza visitantes, alertas, etc.)
        cargarResumen()

        setHistorial(prev => [{
            id:        Date.now(),
            escenario: esc.nombre,
            estado:    'EXITOSO',
            hora:      new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            duracion:  formatMs(duracionMs),
            resumen:   resumenReal,
        }, ...prev].slice(0, 8))
    }

    const kpis = [
        { label: 'Cargas exitosas', value: historial.filter(h => h.estado === 'EXITOSO').length, accent: '#22c55e', icon: CheckCircle },
        { label: 'Con errores',     value: historial.filter(h => h.estado === 'ERROR').length,   accent: '#e63946', icon: XCircle    },
        { label: 'Última carga',    value: historial[0]?.hora || '—',                            accent: '#2a9d8f', icon: Clock      },
        { label: 'Latencia actual', value: status === 'online' && latency ? `${latency}ms` : '—', accent: '#6a4c93', icon: Signal    },
    ]

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-night)' }}>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
                <HeroCarga backendStatus={status} latency={latency} cargado={cargado} />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpis.map(({ label, value, accent, icon }) => (
                        <StatCard key={label} label={label} value={value} accent={accent} icon={icon} className="animate-fade-up-delay-1" />
                    ))}
                </div>

                <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                    <div className="xl:col-span-2 space-y-6">
                        <PanelCarga onLog={addLog} onCargaCompleta={handleCargaCompleta} />
                        <ConsolaVisual logs={logs} onLimpiar={() => setLogs([{ tipo: 'info', msg: 'Consola limpiada', hora: ts() }])} />
                    </div>
                    <div className="xl:col-span-1 space-y-5">
                        <EstadoBackend status={status} latency={latency} onPing={ping} />
                        <ResumenSistema sistema={sistema} cargado={cargado} cargandoResumen={cargandoResumen} />
                    </div>
                </div>

                <HistorialCargas historial={historial} />
            </div>

            <div className="border-t mt-8" style={{ borderColor: 'var(--c-border)', background: 'rgba(13,15,20,0.5)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
                    <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(107,114,128,0.6)' }}>Tech-Park UQ v1.0</span>
                </div>
            </div>
        </div>
    )
}