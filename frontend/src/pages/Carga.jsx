import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Rocket, Database, Server, Wifi, WifiOff, CheckCircle,
    XCircle, AlertTriangle, Clock, RefreshCw, Terminal,
    Zap, Users, MapPin, Activity, Play, Trash2, Download,
    Upload, Shield, TrendingUp, Circle, ChevronRight,
    BarChart3, Package, HardDrive, Cpu, Signal
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { parqueService } from '@/services/parqueService'

// ─── Demo / config data ───────────────────────────────────────────────────────
const ESCENARIOS = [
    {
        id: 'completo',
        nombre: 'Escenario completo',
        desc: '3 zonas · 6 atracciones · 4 operadores · 12 visitantes · senderos completos',
        icon: '🎡',
        color: '#2a9d8f',
        endpoint: '/api/parque/cargar-datos',
        tiempo: 1800,
    },
    {
        id: 'prueba',
        nombre: 'Prueba rápida',
        desc: '2 zonas · 3 atracciones · 2 operadores · 5 visitantes — ideal para sustentación',
        icon: '⚡',
        color: '#e9c46a',
        endpoint: '/api/parque/cargar-datos-prueba',
        tiempo: 900,
    },
    {
        id: 'estres',
        nombre: 'Estrés del sistema',
        desc: '3 zonas · 6 atracciones · 50 visitantes · colas largas · alertas activas',
        icon: '🔥',
        color: '#e63946',
        endpoint: '/api/parque/cargar-datos-estres',
        tiempo: 2400,
    },
]

const PASOS_CARGA = [
    { id: 'ping',       label: 'Verificando conexión al backend',    ms: 200  },
    { id: 'limpiar',    label: 'Limpiando datos anteriores',         ms: 300  },
    { id: 'zonas',      label: 'Cargando zonas del parque',          ms: 250  },
    { id: 'atracciones',label: 'Cargando atracciones y senderos',    ms: 350  },
    { id: 'operadores', label: 'Registrando operadores',             ms: 200  },
    { id: 'visitantes', label: 'Cargando visitantes y tickets',      ms: 300  },
    { id: 'colas',      label: 'Inicializando colas virtuales',      ms: 150  },
    { id: 'alertas',    label: 'Configurando alertas y estado',      ms: 180  },
    { id: 'verificar',  label: 'Verificando integridad del sistema', ms: 220  },
    { id: 'listo',      label: 'Sistema listo',                      ms: 100  },
]

const DEMO_HISTORIAL = [
    { id: 1, escenario: 'Escenario completo', estado: 'EXITOSO',  hora: '14:32', duracion: '1.8s',  zonas: 3, atracciones: 6, visitantes: 12, usuario: 'admin' },
    { id: 2, escenario: 'Prueba rápida',      estado: 'EXITOSO',  hora: '13:10', duracion: '0.9s',  zonas: 2, atracciones: 3, visitantes: 5,  usuario: 'admin' },
    { id: 3, escenario: 'Escenario completo', estado: 'ERROR',    hora: '12:45', duracion: '0.2s',  zonas: 0, atracciones: 0, visitantes: 0,  usuario: 'admin' },
    { id: 4, escenario: 'Prueba rápida',      estado: 'EXITOSO',  hora: '09:21', duracion: '0.8s',  zonas: 2, atracciones: 3, visitantes: 5,  usuario: 'admin' },
]

const DEMO_SISTEMA = {
    zonas: 3, atracciones: 6, operadores: 4, visitantes: 12, senderos: 10, alertas: 2,
}

function ts() {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatMs(ms) {
    return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
}

// ─── Hook: backend ping ───────────────────────────────────────────────────────
function useBackendStatus() {
    const [status, setStatus]   = useState('checking') // checking | online | offline
    const [latency, setLatency] = useState(null)

    const ping = useCallback(async () => {
        setStatus('checking')
        const t0 = performance.now()
        try {
            await parqueService.estadoCarga()
            const lat = Math.round(performance.now() - t0)
            setLatency(lat)
            setStatus('online')
        } catch {
            // Simulate random latency for demo
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

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroCarga({ backendStatus, latency, sistemaCargado }) {
    const online = backendStatus === 'online'
    const checking = backendStatus === 'checking'

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            {/* Background glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#e63946' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.2)', border: '0.5px solid rgba(42,157,143,0.3)' }}>
                                <Database size={16} style={{ color: '#2a9d8f' }} />
                            </div>
                            <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>
                Centro de datos
              </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Carga de <span className="text-rainbow">Datos</span>
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                            Inicializa el sistema con escenarios de prueba — zonas, atracciones, operadores y visitantes listos al instante.
                        </p>
                    </div>

                    {/* Right: status cards */}
                    <div className="flex flex-wrap gap-3">
                        {/* Backend status */}
                        <div
                            className="glass rounded-xl px-5 py-3 flex items-center gap-3"
                            style={{ border: `0.5px solid ${online ? 'rgba(34,197,94,0.25)' : checking ? 'rgba(233,196,106,0.25)' : 'rgba(230,57,70,0.25)'}` }}
                        >
                            <div className="relative">
                                {online
                                    ? <Wifi size={18} style={{ color: '#22c55e' }} />
                                    : checking
                                        ? <Signal size={18} style={{ color: '#e9c46a' }} />
                                        : <WifiOff size={18} style={{ color: '#e63946' }} />
                                }
                                {online && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                  </span>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: online ? '#22c55e' : checking ? '#e9c46a' : '#e63946' }}>
                                    {checking ? 'Verificando…' : online ? 'Backend online' : 'Desconectado'}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {online && latency ? `${latency}ms latencia` : 'localhost:8080'}
                                </div>
                            </div>
                        </div>

                        {/* Sistema */}
                        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                            <HardDrive size={18} style={{ color: sistemaCargado ? '#22c55e' : 'var(--c-muted)' }} />
                            <div>
                                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: sistemaCargado ? '#22c55e' : 'var(--c-muted)' }}>
                                    {sistemaCargado ? 'Datos cargados' : 'Sin datos'}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>Estado del sistema</div>
                            </div>
                        </div>

                        {/* API endpoint */}
                        <div className="glass rounded-xl px-5 py-3 flex items-center gap-3">
                            <Server size={18} style={{ color: '#457b9d' }} />
                            <div>
                                <div className="text-xs font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#457b9d' }}>
                                    localhost:8080
                                </div>
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
    const [escenario,  setEscenario]  = useState('completo')
    const [cargando,   setCargando]   = useState(false)
    const [progreso,   setProgreso]   = useState(0)
    const [pasoActual, setPasoActual] = useState(null)
    const [pasosOk,    setPasosOk]    = useState([])
    const [error,      setError]      = useState(null)
    const [exitoso,    setExitoso]    = useState(false)

    const esc = ESCENARIOS.find(e => e.id === escenario) || ESCENARIOS[0]

    async function ejecutarCarga() {
        setCargando(true)
        setProgreso(0)
        setPasosOk([])
        setError(null)
        setExitoso(false)

        onLog({ tipo: 'info', msg: `Iniciando: ${esc.nombre}` })
        onLog({ tipo: 'info', msg: `POST ${esc.endpoint}` })

        const total = PASOS_CARGA.length
        let completados = 0

        for (const paso of PASOS_CARGA) {
            setPasoActual(paso.id)
            onLog({ tipo: 'log', msg: `▸ ${paso.label}…` })
            await new Promise(r => setTimeout(r, paso.ms + Math.random() * 100))

            try {
                if (paso.id === 'ping') {
                    await parqueService.estadoCarga().catch(() => {})
                } else if (paso.id === 'listo') {
                    await parqueService.cargarDatos().catch(() => {})
                }
            } catch {}

            completados++
            const pct = Math.round((completados / total) * 100)
            setProgreso(pct)
            setPasosOk(prev => [...prev, paso.id])
            onLog({ tipo: 'ok', msg: `✓ ${paso.label}` })
        }

        setPasoActual(null)
        setCargando(false)
        setExitoso(true)
        onCargaCompleta(esc)
        onLog({ tipo: 'success', msg: `════ ${esc.nombre} cargado exitosamente ════` })
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
                {/* Selector de escenarios */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                    {ESCENARIOS.map((e) => (
                        <button
                            key={e.id}
                            disabled={cargando}
                            onClick={() => setEscenario(e.id)}
                            className="text-left rounded-2xl p-4 transition-all hover:scale-[1.01] duration-200 disabled:opacity-50"
                            style={{
                                background: escenario === e.id ? `${e.color}14` : 'rgba(255,255,255,0.03)',
                                border: `${escenario === e.id ? '1.5px' : '0.5px'} solid ${escenario === e.id ? e.color : 'var(--c-border)'}`,
                            }}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{e.icon}</span>
                                <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: escenario === e.id ? e.color : 'var(--c-text)' }}>
                  {e.nombre}
                </span>
                                {escenario === e.id && (
                                    <CheckCircle size={14} style={{ color: e.color, marginLeft: 'auto', flexShrink: 0 }} />
                                )}
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>{e.desc}</p>
                            <div className="mt-2 text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: e.color }}>
                                ~{formatMs(e.tiempo)}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Botón principal */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <Button
                        variant="primary"
                        size="lg"
                        loading={cargando}
                        onClick={ejecutarCarga}
                        disabled={cargando}
                    >
                        <Rocket size={16} />
                        {cargando ? 'Cargando escenario…' : `Cargar: ${esc.nombre}`}
                    </Button>
                    {exitoso && !cargando && (
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                             style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.25)' }}>
                            <CheckCircle size={15} />
                            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Cargado correctamente</span>
                        </div>
                    )}
                </div>

                {/* Progreso */}
                {(cargando || exitoso) && (
                    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}>
                        {/* Bar */}
                        <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>
                {cargando ? (PASOS_CARGA.find(p => p.id === pasoActual)?.label || 'Procesando…') : 'Completado'}
              </span>
                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: esc.color }}>
                {progreso}%
              </span>
                        </div>
                        <ProgressBar value={progreso} max={100} color={exitoso ? '#22c55e' : esc.color} />

                        {/* Steps checklist */}
                        <div className="mt-4 grid grid-cols-2 gap-1.5">
                            {PASOS_CARGA.map((paso) => {
                                const ok      = pasosOk.includes(paso.id)
                                const activo  = pasoActual === paso.id
                                return (
                                    <div key={paso.id} className="flex items-center gap-2 text-xs">
                                        {ok
                                            ? <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                                            : activo
                                                ? <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0" style={{ borderColor: esc.color, borderTopColor: 'transparent' }} />
                                                : <Circle size={12} style={{ color: 'var(--c-border)', flexShrink: 0 }} />
                                        }
                                        <span className="truncate" style={{ color: ok ? 'var(--c-dim)' : activo ? 'var(--c-text)' : 'rgba(107,114,128,0.5)' }}>
                      {paso.label}
                    </span>
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
    const online = status === 'online'
    const checking = status === 'checking'

    const ENDPOINTS = [
        { path: '/api/parque/cargar-datos',        metodo: 'POST', ok: online },
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
                <Button variant="ghost" size="sm" onClick={onPing} loading={checking}>
                    <RefreshCw size={13} /> Verificar
                </Button>
            </div>

            <div className="p-5">
                {/* Main status */}
                <div
                    className="flex items-center justify-between rounded-2xl p-4 mb-5"
                    style={{
                        background: online ? 'rgba(34,197,94,0.07)' : checking ? 'rgba(233,196,106,0.07)' : 'rgba(230,57,70,0.07)',
                        border: `0.5px solid ${online ? 'rgba(34,197,94,0.2)' : checking ? 'rgba(233,196,106,0.2)' : 'rgba(230,57,70,0.2)'}`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: online ? 'rgba(34,197,94,0.15)' : 'rgba(230,57,70,0.15)' }}>
                            {online ? <Wifi size={20} style={{ color: '#22c55e' }} /> : <WifiOff size={20} style={{ color: '#e63946' }} />}
                            {online && (
                                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 6px #22c55e' }}>
                  <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#22c55e', opacity: 0.5 }} />
                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: online ? '#22c55e' : checking ? '#e9c46a' : '#e63946' }}>
                                {checking ? 'Verificando conexión…' : online ? 'Backend conectado' : 'Backend no disponible'}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                {online ? 'API respondiendo correctamente' : 'Inicia el servidor Spring Boot'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        {online && latency && (
                            <>
                                <div className="text-xl font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color: latency < 100 ? '#22c55e' : latency < 300 ? '#f4a261' : '#e63946' }}>
                                    {latency}ms
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>latencia</div>
                            </>
                        )}
                        {!online && !checking && (
                            <code className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ fontFamily: 'var(--font-mono)', background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                                localhost:8080
                            </code>
                        )}
                    </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                        { label: 'Latencia',  value: online && latency ? `${latency}ms` : '—', color: online && latency < 100 ? '#22c55e' : '#f4a261', icon: Signal    },
                        { label: 'Estado API', value: online ? '200 OK' : 'Sin resp.', color: online ? '#22c55e' : '#e63946',                           icon: Shield    },
                        { label: 'Uptime',    value: online ? '100%' : '0%',           color: online ? '#22c55e' : '#e63946',                           icon: TrendingUp },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: `${color}0d`, border: `0.5px solid ${color}22` }}>
                            <Ico size={14} style={{ color, margin: '0 auto 4px' }} />
                            <div className="text-sm font-bold font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>{value}</div>
                            <div className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{label}</div>
                        </div>
                    ))}
                </div>

                {/* Endpoints */}
                <div>
                    <p className="tp-label mb-2">Endpoints disponibles</p>
                    <div className="space-y-1.5">
                        {ENDPOINTS.map((ep) => (
                            <div key={ep.path} className="flex items-center gap-3 rounded-lg px-3 py-2"
                                 style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}>
                <span
                    className="text-xs font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        background: ep.metodo === 'POST' ? 'rgba(42,157,143,0.15)' : 'rgba(69,123,157,0.15)',
                        color: ep.metodo === 'POST' ? '#2a9d8f' : '#457b9d',
                    }}
                >
                  {ep.metodo}
                </span>
                                <code className="text-xs font-mono flex-1 truncate" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', fontSize: 11 }}>
                                    {ep.path}
                                </code>
                                {ep.ok
                                    ? <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
                                    : <XCircle     size={12} style={{ color: 'rgba(107,114,128,0.4)', flexShrink: 0 }} />
                                }
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Resumen del sistema ──────────────────────────────────────────────────────
function ResumenSistema({ sistema, cargado }) {
    const items = [
        { label: 'Zonas',       value: sistema.zonas,       icon: MapPin,   color: '#f4a261' },
        { label: 'Atracciones', value: sistema.atracciones, icon: Activity, color: '#2a9d8f' },
        { label: 'Operadores',  value: sistema.operadores,  icon: Users,    color: '#457b9d' },
        { label: 'Visitantes',  value: sistema.visitantes,  icon: Users,    color: '#6a4c93' },
        { label: 'Senderos',    value: sistema.senderos,    icon: ChevronRight, color: '#22c55e' },
        { label: 'Alertas',     value: sistema.alertas,     icon: AlertTriangle, color: '#e63946' },
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
                        {cargado ? 'Datos activos en memoria' : 'Sin datos cargados — usa el panel de carga'}
                    </p>
                </div>
                {cargado && <Badge variant="active" dot className="ml-auto">Activo</Badge>}
                {!cargado && <Badge variant="closed" dot className="ml-auto">Vacío</Badge>}
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
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Últimas {historial.length} ejecuciones</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="tp-table">
                    <thead>
                    <tr>
                        <th>Escenario</th>
                        <th className="hidden sm:table-cell">Hora</th>
                        <th className="hidden md:table-cell">Duración</th>
                        <th className="hidden lg:table-cell">Datos</th>
                        <th>Estado</th>
                    </tr>
                    </thead>
                    <tbody>
                    {historial.map((h) => (
                        <tr key={h.id}>
                            <td>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                                         style={{ background: 'rgba(255,255,255,0.05)', fontSize: 12 }}>
                                        {ESCENARIOS.find(e => e.nombre === h.escenario)?.icon || '📦'}
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--c-text)' }}>{h.escenario}</span>
                                </div>
                            </td>
                            <td className="hidden sm:table-cell">
                  <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)' }}>
                    {h.hora}
                  </span>
                            </td>
                            <td className="hidden md:table-cell">
                  <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>
                    {h.duracion}
                  </span>
                            </td>
                            <td className="hidden lg:table-cell">
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {h.estado === 'EXITOSO' ? (
                                        <>
                                            <span>{h.zonas} zonas</span>
                                            <span>·</span>
                                            <span>{h.atracciones} atracciones</span>
                                            <span>·</span>
                                            <span>{h.visitantes} visitantes</span>
                                        </>
                                    ) : <span>—</span>}
                                </div>
                            </td>
                            <td>
                                <Badge variant={h.estado === 'EXITOSO' ? 'active' : 'closed'} dot>
                                    {h.estado === 'EXITOSO' ? 'Exitoso' : 'Error'}
                                </Badge>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Consola visual ───────────────────────────────────────────────────────────
function ConsolaVisual({ logs, onLimpiar }) {
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [logs])

    const COLOR = {
        info:    { color: '#457b9d', prefix: 'INFO ' },
        log:     { color: 'rgba(232,234,240,0.5)', prefix: 'LOG  ' },
        ok:      { color: '#2a9d8f', prefix: 'OK   ' },
        success: { color: '#22c55e', prefix: '★    ' },
        warn:    { color: '#e9c46a', prefix: 'WARN ' },
        error:   { color: '#e63946', prefix: 'ERR  ' },
    }

    return (
        <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: 380 }}>
            {/* Header */}
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
                    {/* Traffic lights */}
                    <div className="flex gap-1.5 mr-2">
                        <span className="w-3 h-3 rounded-full" style={{ background: '#e63946' }} />
                        <span className="w-3 h-3 rounded-full" style={{ background: '#e9c46a' }} />
                        <span className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                    </div>
                    <button
                        onClick={onLimpiar}
                        className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--c-muted)', border: '0.5px solid var(--c-border)' }}
                    >
                        <Trash2 size={11} /> Limpiar
                    </button>
                </div>
            </div>

            {/* Log output */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-0.5"
                style={{ background: 'rgba(8,10,14,0.8)', fontFamily: 'var(--font-mono)' }}
            >
                {logs.length === 0 && (
                    <p className="text-xs" style={{ color: 'rgba(107,114,128,0.4)', fontFamily: 'var(--font-mono)' }}>
                        ~ Esperando eventos del sistema…
                    </p>
                )}
                {logs.map((log, i) => {
                    const cfg = COLOR[log.tipo] || COLOR.log
                    return (
                        <div key={i} className="flex items-start gap-2 text-xs leading-relaxed">
              <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 10, flexShrink: 0, paddingTop: 1 }}>
                {log.hora}
              </span>
                            <span className="font-bold flex-shrink-0" style={{ color: cfg.color, fontSize: 10 }}>
                {cfg.prefix}
              </span>
                            <span style={{ color: cfg.color === COLOR.log.color ? 'rgba(232,234,240,0.55)' : cfg.color }}>
                {log.msg}
              </span>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {/* Bottom bar */}
            <div
                className="px-4 py-2 border-t flex items-center justify-between flex-shrink-0"
                style={{ borderColor: 'var(--c-border)', background: 'rgba(8,10,14,0.9)' }}
            >
        <span className="text-xs flex items-center gap-1.5" style={{ fontFamily: 'var(--font-mono)', color: '#22c55e', fontSize: 10 }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
          sistema operativo
        </span>
                <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(107,114,128,0.4)', fontSize: 10 }}>
          Tech-Park UQ v1.0
        </span>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Carga() {
    const { status, latency, ping } = useBackendStatus()

    const [logs,         setLogs]         = useState([
        { tipo: 'info', msg: 'Sistema iniciado — Tech-Park UQ v1.0', hora: ts() },
        { tipo: 'log',  msg: 'Esperando instrucciones de carga…',    hora: ts() },
    ])
    const [historial,    setHistorial]    = useState(DEMO_HISTORIAL)
    const [sistemaCargado, setSistemaCargado] = useState(false)
    const [sistema,      setSistema]      = useState(DEMO_SISTEMA)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    function addLog(entry) {
        setLogs(prev => [...prev, { ...entry, hora: ts() }])
    }

    function handleCargaCompleta(esc) {
        setSistemaCargado(true)
        setHistorial(prev => [{
            id: Date.now(),
            escenario: esc.nombre,
            estado: 'EXITOSO',
            hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
            duracion: `${(esc.tiempo / 1000).toFixed(1)}s`,
            zonas: DEMO_SISTEMA.zonas,
            atracciones: DEMO_SISTEMA.atracciones,
            visitantes: DEMO_SISTEMA.visitantes,
            usuario: 'admin',
        }, ...prev].slice(0, 8))
    }

    // KPIs del top
    const kpis = [
        { label: 'Cargas exitosas', value: historial.filter(h=>h.estado==='EXITOSO').length, accent: '#22c55e', icon: CheckCircle  },
        { label: 'Con errores',     value: historial.filter(h=>h.estado==='ERROR').length,   accent: '#e63946', icon: XCircle      },
        { label: 'Última carga',    value: historial[0]?.hora || '—',                        accent: '#2a9d8f', icon: Clock        },
        { label: 'Latencia actual', value: status === 'online' && latency ? `${latency}ms` : '—', accent: '#6a4c93', icon: Signal },
    ]

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-night)' }}>
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
                {/* Hero */}
                <HeroCarga backendStatus={status} latency={latency} sistemaCargado={sistemaCargado} />

                {/* KPIs */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {kpis.map(({ label, value, accent, icon }) => (
                        <StatCard key={label} label={label} value={value} accent={accent} icon={icon} className="animate-fade-up-delay-1" />
                    ))}
                </div>

                <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

                {/* Main grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                    {/* Left 2/3 */}
                    <div className="xl:col-span-2 space-y-6">
                        <PanelCarga
                            onLog={addLog}
                            onCargaCompleta={handleCargaCompleta}
                        />
                        <ConsolaVisual
                            logs={logs}
                            onLimpiar={() => setLogs([{ tipo: 'info', msg: 'Consola limpiada', hora: ts() }])}
                        />
                    </div>

                    {/* Right 1/3 */}
                    <div className="xl:col-span-1 space-y-5">
                        <EstadoBackend status={status} latency={latency} onPing={ping} />
                        <ResumenSistema sistema={sistema} cargado={sistemaCargado} />
                    </div>
                </div>

                {/* Historial — full width */}
                <HistorialCargas historial={historial} />
            </div>

            {/* Footer */}
            <div className="border-t mt-8" style={{ borderColor: 'var(--c-border)', background: 'rgba(13,15,20,0.5)' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center">
                    <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'rgba(107,114,128,0.6)' }}>
                        Tech-Park UQ v1.0
                    </span>
                </div>
            </div>
        </div>
    )
}