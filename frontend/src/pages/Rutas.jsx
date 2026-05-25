import { useState, useEffect, useCallback } from 'react'
import {
    Navigation, MapPin, Clock, Users, Zap, ArrowRight,
    ChevronRight, Activity, TrendingUp, TrendingDown,
    Route, Shuffle, Accessibility, Timer, BarChart3,
    Flame, AlertTriangle, CheckCircle, Play, RefreshCw,
    Star, Target, Compass, Signal
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Input'
import { rutaService, parqueService } from '@/services/parqueService'
import { useApp } from '@/context/AppContext'

// ─── Colores por zona (asignados por índice, sin datos quemados) ──────────────
const ZONA_COLORES = ['#f4a261', '#457b9d', '#6a4c93', '#2a9d8f', '#e9c46a', '#e63946']
const ZONA_ICONOS  = ['🎢', '🌊', '🎭', '🌿', '⚡', '🎠']

function getZonaColor(index) { return ZONA_COLORES[index % ZONA_COLORES.length] }
function getZonaIcono(index) { return ZONA_ICONOS[index % ZONA_ICONOS.length] }

// ─── Colores de estado ────────────────────────────────────────────────────────
const ESTADO_COLOR = {
    ABIERTA:          '#22c55e',
    ACTIVA:           '#22c55e',
    EN_MANTENIMIENTO: '#f4a261',
    MANTENIMIENTO:    '#f4a261',
    CERRADA:          '#e63946',
}
function colorEstado(estado) { return ESTADO_COLOR[estado] || '#6b7280' }

// ─── Prioridades de ruta ──────────────────────────────────────────────────────
const PRIORIDADES = [
    { id: 'tiempo',        label: 'Menor tiempo',  icon: Clock,         color: '#2a9d8f' },
    { id: 'filas',         label: 'Menos filas',   icon: Users,         color: '#6a4c93' },
    { id: 'accesibilidad', label: 'Accesibilidad', icon: Accessibility, color: '#f4a261' },
]

// ─── Mini mapa SVG del grafo (datos reales del backend) ──────────────────────
// Parte el nombre completo en palabras y las agrupa en líneas de máx. 2 palabras
// para que quepan bajo el nodo sin solaparse con nodos vecinos.
function partirNombre(nombre = '') {
    const palabras = nombre.trim().split(/\s+/)
    const lineas = []
    for (let i = 0; i < palabras.length; i += 2) {
        lineas.push(palabras.slice(i, i + 2).join(' '))
    }
    return lineas
}

function GrafoMiniMapa({ nodos = [], aristas = [], rutaResaltada = [] }) {
    // Se amplía la altura del viewBox (300 → 340) para que las etiquetas
    // multilinea debajo de los nodos inferiores no queden cortadas por el borde.
    const W = 600, H = 340

    // El backend devuelve nodos con { id, nombre, x, y } desde grafo.getNodosParaMapa()
    // y aristas con { origen, destino, peso } desde grafo.getAristasParaMapa()
    const enRuta = new Set(rutaResaltada)

    function px(xPct) { return (xPct / 100) * W }
    function py(yPct) { return (yPct / 100) * H }

    function getNodo(id) { return nodos.find(n => n.id === id) }

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}
        >
            {/* Grid decorativo */}
            {[0.2, 0.4, 0.6, 0.8].map(f => (
                <line key={`h${f}`} x1={0} y1={H * f} x2={W} y2={H * f} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map(f => (
                <line key={`v${f}`} x1={W * f} y1={0} x2={W * f} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}

            {/* Sin datos: placeholder */}
            {nodos.length === 0 && (
                <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.2)" fontFamily="sans-serif">
                    Cargando grafo…
                </text>
            )}

            {/* Aristas */}
            {aristas.map((arista, i) => {
                const a = getNodo(arista.from ?? arista.origen)
                const b = getNodo(arista.to   ?? arista.destino)
                if (!a || !b) return null
                const enRutaArista = enRuta.has(arista.from ?? arista.origen) && enRuta.has(arista.to ?? arista.destino)
                const mx = (px(a.x) + px(b.x)) / 2
                const my = (py(a.y) + py(b.y)) / 2
                return (
                    <g key={i}>
                        <line
                            x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)}
                            stroke={enRutaArista ? '#2a9d8f' : 'rgba(255,255,255,0.08)'}
                            strokeWidth={enRutaArista ? 2.5 : 1}
                            strokeDasharray={enRutaArista ? '6 3' : undefined}
                        />
                        {arista.peso != null && (
                            <text x={mx} y={my - 5} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
                                {arista.peso}m
                            </text>
                        )}
                    </g>
                )
            })}

            {/* Nodos */}
            {nodos.map((nodo, idx) => {
                const color  = getZonaColor(idx)
                const cEstado = colorEstado(nodo.estado)
                const resalt  = enRuta.has(nodo.id)
                const r       = resalt ? 16 : 12

                return (
                    <g key={nodo.id} transform={`translate(${px(nodo.x ?? 50)}, ${py(nodo.y ?? 50)})`}>
                        {resalt && (
                            <circle r={r + 6} fill="none" stroke="#2a9d8f" strokeWidth={1.5} strokeOpacity={0.4} />
                        )}
                        <circle r={r + 3} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.35} />
                        <circle r={r} fill={resalt ? '#2a9d8f' : `${color}30`} stroke={resalt ? '#2a9d8f' : color} strokeWidth={1.5} />
                        <circle r={3} cx={r - 2} cy={-(r - 2)} fill={cEstado} />
                        {/* Nombre completo: cada par de palabras en su propia línea */}
                        <text
                            textAnchor="middle"
                            fontSize={9}
                            fill={resalt ? 'white' : 'rgba(255,255,255,0.6)'}
                            fontFamily="Syne, sans-serif"
                            fontWeight={resalt ? 700 : 400}
                        >
                            {partirNombre(nodo.nombre).map((linea, li) => (
                                <tspan
                                    key={li}
                                    x={0}
                                    dy={li === 0 ? r + 14 : 11}
                                >
                                    {linea}
                                </tspan>
                            ))}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroRutas({ zonas, nodosMapa, aristasMapa }) {
    const { parqueInfo } = useApp()
    const totalVisitantes = parqueInfo?.visitantesActuales ?? 0
    const maxCap          = parqueInfo?.capacidadMaxima ?? zonas.reduce((s, z) => s + (z.capacidadMaxima || 0), 0)
    const flujoPct = maxCap > 0 ? Math.round((totalVisitantes / maxCap) * 1000) / 10 : 0

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#457b9d' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Izquierda: título + flujo global */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.2)', border: '0.5px solid rgba(42,157,143,0.3)' }}>
                                <Route size={16} style={{ color: '#2a9d8f' }} />
                            </div>
                            <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>
                                Sistema de rutas
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Rutas &amp; <span className="text-rainbow">Navegación</span>
                        </h1>
                        <p className="text-sm mb-6" style={{ color: 'var(--c-muted)' }}>
                            Dijkstra en tiempo real — optimiza tu recorrido según tiempo, filas y accesibilidad.
                        </p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: 'var(--c-muted)' }}>Flujo global del parque</span>
                                <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: flujoPct > 70 ? '#e63946' : '#22c55e' }}>
                                    {flujoPct}%
                                </span>
                            </div>
                            <ProgressBar
                                value={totalVisitantes}
                                max={maxCap || 1}
                                color={flujoPct > 70 ? '#e63946' : flujoPct > 50 ? '#f4a261' : '#22c55e'}
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5">
                            {[
                                { label: 'Total visitantes', value: totalVisitantes.toLocaleString('es-CO'), color: '#2a9d8f' },
                                { label: 'Capacidad total',  value: maxCap.toLocaleString('es-CO'),          color: '#457b9d' },
                                { label: 'Conexiones grafo', value: aristasMapa.length,                       color: '#6a4c93' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="glass rounded-xl px-4 py-2.5">
                                    <div className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Derecha: mini mapa real */}
                    <div className="lg:w-[480px]">
                        <div className="flex items-center gap-2 mb-2">
                            <Compass size={12} style={{ color: 'var(--c-muted)' }} />
                            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                                Grafo del parque
                            </span>
                        </div>
                        <GrafoMiniMapa nodos={nodosMapa} aristas={aristasMapa} />
                        <div className="flex gap-4 mt-2 flex-wrap">
                            {[['#22c55e', 'Activa'], ['#f4a261', 'Mantenimiento'], ['#e63946', 'Cerrada']].map(([c, l]) => (
                                <div key={l} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-muted)' }}>
                                    <span className="w-2 h-2 rounded-full" style={{ background: c, boxShadow: `0 0 5px ${c}` }} />
                                    {l}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Calculadora de rutas ─────────────────────────────────────────────────────
function CalculadoraRutas({ atracciones, nodosMapa, aristasMapa, onRutaCalculada }) {
    const [origen,    setOrigen]    = useState('')
    const [destino,   setDestino]   = useState('')
    const [prioridad, setPrioridad] = useState('tiempo')
    const [loading,   setLoading]   = useState(false)
    const [resultado, setResultado] = useState(null)
    const [error,     setError]     = useState(null)

    // Opciones del select: usar atracciones reales del backend
    // GET /api/atracciones → [{ id, nombre, tipo, estado, ... }]
    const opciones = atracciones.length > 0 ? atracciones : nodosMapa

    async function calcular() {
        if (!origen || !destino || origen === destino) return
        setLoading(true)
        setResultado(null)
        setError(null)
        try {
            // GET /api/parque/ruta-optima?origen={id}&destino={id}
            // Responde: { origen, destino, ruta: [{id, nombre, estado}], pasos }
            const res = await rutaService.calcularRuta(origen, destino)
            const data = res.data

            // Adaptar respuesta del backend al formato que necesita el timeline
            // data.ruta = [{id, nombre, estado}]
            // data.pasos = número de pasos
            const rutaAdaptada = {
                origen:     data.origen,
                destino:    data.destino,
                pasos:      (data.ruta || []).map((nodo, i) => ({
                    orden:  i + 1,
                    id:     nodo.id,
                    nombre: nodo.nombre,
                    estado: nodo.estado,
                    // El backend no devuelve zona ni espera por nodo en ruta-optima
                    // los enriquecemos con datos de atracciones si están disponibles
                    zona:   atracciones.find(a => a.id === nodo.id)?.tipo || '—',
                    espera: atracciones.find(a => a.id === nodo.id)?.tiempoEsperaEstimado || 0,
                })),
                totalPasos: data.pasos || 0,
            }
            setResultado(rutaAdaptada)
            // Notificar al mapa qué nodos resaltar
            onRutaCalculada((data.ruta || []).map(n => n.id))
        } catch (e) {
            setError('No se pudo calcular la ruta. Verifica que el origen y destino estén conectados.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                    <Navigation size={15} style={{ color: '#2a9d8f' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Calcular ruta óptima</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Algoritmo de Dijkstra — distancia mínima garantizada</p>
                </div>
            </div>

            <div className="p-6">
                {/* Origen / Destino */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <Select label="Origen" value={origen} onChange={e => setOrigen(e.target.value)}>
                        <option value="">Seleccionar punto de inicio…</option>
                        {opciones.map(n => (
                            <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                    </Select>
                    <Select label="Destino" value={destino} onChange={e => setDestino(e.target.value)}>
                        <option value="">Seleccionar destino…</option>
                        {opciones.filter(n => n.id !== origen).map(n => (
                            <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                    </Select>
                </div>

                {/* Prioridad */}
                <div className="mb-5">
                    <p className="tp-label mb-3">Prioridad de ruta</p>
                    <div className="flex flex-wrap gap-2">
                        {PRIORIDADES.map(({ id, label, icon: Icon, color }) => (
                            <button
                                key={id}
                                onClick={() => setPrioridad(id)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                    background: prioridad === id ? `${color}18` : 'rgba(255,255,255,0.03)',
                                    border: `${prioridad === id ? '1.5px' : '0.5px'} solid ${prioridad === id ? color : 'var(--c-border)'}`,
                                    color: prioridad === id ? color : 'var(--c-muted)',
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                <Icon size={13} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    onClick={calcular}
                    className="w-full sm:w-auto justify-center"
                    disabled={!origen || !destino || origen === destino}
                >
                    <Play size={15} /> Calcular ruta óptima (Dijkstra)
                </Button>

                {/* Error */}
                {error && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                        <AlertTriangle size={14} />
                        {error}
                    </div>
                )}

                {/* Resultado del backend */}
                {resultado && (
                    <div className="mt-6">
                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-3 mb-5">
                            {[
                                { label: 'Paradas',         value: resultado.totalPasos,    icon: Target,  color: '#f4a261' },
                                { label: 'Origen',          value: resultado.origen,         icon: MapPin,  color: '#2a9d8f' },
                                { label: 'Destino',         value: resultado.destino,        icon: Compass, color: '#6a4c93' },
                            ].map(({ label, value, icon: Ico, color }) => (
                                <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: `${color}12`, border: `0.5px solid ${color}30` }}>
                                    <Ico size={13} style={{ color }} />
                                    <div>
                                        <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</div>
                                        <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Timeline de pasos */}
                        <div className="relative">
                            <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: 'linear-gradient(180deg,#2a9d8f,#6a4c93)' }} />
                            <div className="space-y-3 pl-10">
                                {resultado.pasos.map((paso, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-xl p-4"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}
                                    >
                                        {/* Dot de timeline */}
                                        <div
                                            className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                                            style={{
                                                background: i === 0 ? '#2a9d8f' : i === resultado.pasos.length - 1 ? '#6a4c93' : 'var(--c-card)',
                                                border: '2px solid',
                                                borderColor: i === 0 ? '#2a9d8f' : i === resultado.pasos.length - 1 ? '#6a4c93' : 'var(--c-border)',
                                                fontFamily: 'var(--font-mono)',
                                                color: 'white',
                                                fontSize: 8,
                                            }}
                                        >
                                            {paso.orden}
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {i === 0 && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(42,157,143,0.15)', color: '#2a9d8f', fontSize: 10 }}>INICIO</span>
                                                    )}
                                                    {i === resultado.pasos.length - 1 && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(106,76,147,0.15)', color: '#6a4c93', fontSize: 10 }}>DESTINO</span>
                                                    )}
                                                    <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{paso.nombre}</span>
                                                </div>
                                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{paso.zona}</p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {paso.espera > 0 && (
                                                    <span className="flex items-center gap-1 text-xs" style={{ color: '#f4a261' }}>
                                                        <Clock size={10} /> {paso.espera}min
                                                    </span>
                                                )}
                                                <Badge
                                                    variant={
                                                        paso.estado === 'ABIERTA' || paso.estado === 'ACTIVA'
                                                            ? 'active'
                                                            : paso.estado === 'EN_MANTENIMIENTO' || paso.estado === 'MANTENIMIENTO'
                                                                ? 'maintenance'
                                                                : 'closed'
                                                    }
                                                    dot
                                                >
                                                    {paso.estado === 'ABIERTA' || paso.estado === 'ACTIVA'
                                                        ? 'Activa'
                                                        : paso.estado === 'EN_MANTENIMIENTO' || paso.estado === 'MANTENIMIENTO'
                                                            ? 'Mant.'
                                                            : 'Cerrada'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Flujo de visitantes (datos reales de zonas) ──────────────────────────────
function FlujoVisitantes({ zonas }) {
    // zonas viene de GET /api/zonas → [{ id, nombre, capacidadMaxima, visitantesActuales, estaLlena }]
    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.15)', border: '0.5px solid rgba(244,162,97,0.25)' }}>
                    <BarChart3 size={15} style={{ color: '#f4a261' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Flujo de visitantes</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Saturación por zonas en tiempo real</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                {zonas.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--c-muted)' }}>Cargando zonas…</p>
                )}
                {zonas.map((z, idx) => {
                    const pct = z.capacidadMaxima > 0
                        ? Math.round((z.visitantesActuales / z.capacidadMaxima) * 1000) / 10
                        : 0
                    const pctRaw = z.capacidadMaxima > 0
                        ? (z.visitantesActuales / z.capacidadMaxima) * 100
                        : 0
                    const saturada = pct >= 75
                    const moderada = pct >= 50
                    const color    = getZonaColor(idx)
                    const icono    = getZonaIcono(idx)

                    return (
                        <div key={z.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${color}25` }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{icono}</span>
                                    <div>
                                        <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{z.nombre}</p>
                                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                            {(z.visitantesActuales || 0).toLocaleString('es-CO')} / {(z.capacidadMaxima || 0).toLocaleString('es-CO')} visitantes
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {saturada
                                        ? <TrendingUp  size={14} style={{ color: '#e63946' }} />
                                        : <TrendingDown size={14} style={{ color: '#2a9d8f' }} />
                                    }
                                    <span
                                        className="text-sm font-bold font-mono"
                                        style={{ fontFamily: 'var(--font-mono)', color: saturada ? '#e63946' : moderada ? '#f4a261' : '#22c55e' }}
                                    >
                                        {pct}%
                                    </span>
                                    {saturada && (
                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.25)' }}>
                                            <Flame size={10} /> Alta
                                        </span>
                                    )}
                                    {z.estaLlena && (
                                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.25)' }}>
                                            Llena
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Barra de saturación */}
                            <div className="relative h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                <div
                                    className="absolute left-0 top-0 h-full rounded-lg transition-all duration-700"
                                    style={{
                                        width: `${Math.min(pctRaw, 100)}%`,
                                        background: saturada
                                            ? 'linear-gradient(90deg, #f4a261, #e63946)'
                                            : moderada
                                                ? `linear-gradient(90deg, ${color}88, ${color})`
                                                : `linear-gradient(90deg, ${color}55, ${color}88)`,
                                    }}
                                />
                                {[50, 75].map(t => (
                                    <div
                                        key={t}
                                        className="absolute top-0 bottom-0 w-px"
                                        style={{ left: `${t}%`, background: 'rgba(255,255,255,0.15)' }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--c-muted)', fontSize: 10 }}>
                                <span>0%</span><span>50% óptimo</span><span>75% saturación</span><span>100%</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Gestión de colas (datos reales de atracciones) ──────────────────────────
function GestionColas({ atracciones, onRefresh }) {
    // atracciones viene de GET /api/atracciones →
    // [{ id, nombre, tipo, estado, contadorVisitantes, tiempoEsperaEstimado, alturaMinima, edadMinima, costoAdicional }]
    // El backend NO devuelve fastpass/general por separado, solo contadorVisitantes total
    // tiempoEsperaEstimado es el tiempo de espera real
    const [loading, setLoading] = useState(null)

    async function procesar(id) {
        setLoading(id)
        try {
            // POST /api/atracciones/{id}/procesar-cola
            await rutaService.procesarCola(id)
            onRefresh()
        } catch {
            // Silencioso: la cola puede estar vacía
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Users size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Gestión de colas virtuales</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Visitantes activos — procesar siguiente en cola</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="tp-table">
                    <thead>
                    <tr>
                        <th>Atracción</th>
                        <th className="text-center">Visitantes</th>
                        <th className="text-center hidden md:table-cell">Espera estimada</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {atracciones.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-8" style={{ color: 'var(--c-muted)' }}>
                                Cargando atracciones…
                            </td>
                        </tr>
                    )}
                    {atracciones.map((a) => {
                        const total  = a.visitantesEnCola ?? a.contadorVisitantes ?? 0
                        const activa = a.estado === 'ABIERTA' || a.estado === 'ACTIVA'

                        return (
                            <tr key={a.id}>
                                <td>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{a.nombre}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{a.tipo}</p>
                                    </div>
                                </td>
                                <td className="text-center">
                                    <span className="inline-flex items-center gap-1 font-mono font-bold text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#e9c46a' }}>
                                        <Users size={11} style={{ color: '#e9c46a' }} />
                                        {total}
                                    </span>
                                </td>
                                <td className="text-center hidden md:table-cell">
                                    <span className="flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                                        <Clock size={10} />
                                        {a.tiempoEsperaEstimado > 0 ? `${a.tiempoEsperaEstimado}min` : '—'}
                                    </span>
                                </td>
                                <td>
                                    <StatusBadge status={a.estado} />
                                </td>
                                <td>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={!activa}
                                        loading={loading === a.id}
                                        onClick={() => procesar(a.id)}
                                    >
                                        <ChevronRight size={12} />
                                        <span className="hidden sm:inline">Procesar</span>
                                    </Button>
                                </td>
                            </tr>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Recomendaciones inteligentes (calculadas desde datos reales) ─────────────
function RecomendacionesInteligentes({ atracciones, aristasMapa }) {
    // Calcular recomendaciones desde atracciones reales:
    // Criterios: estado activo + menor tiempoEsperaEstimado
    const recomendaciones = [...atracciones]
        .filter(a => a.estado === 'ABIERTA' || a.estado === 'ACTIVA')
        .sort((a, b) => (a.tiempoEsperaEstimado || 0) - (b.tiempoEsperaEstimado || 0))
        .slice(0, 3)
        .map((a, i) => {
            const espera = a.tiempoEsperaEstimado || 0
            const score  = Math.max(10, 100 - espera * 2 - i * 5)
            const razon  = espera === 0
                ? 'Sin espera'
                : espera < 10
                    ? 'Cola corta ahora'
                    : espera < 20
                        ? 'Baja afluencia'
                        : 'Disponible'
            return { ...a, espera, score, razon, color: ZONA_COLORES[i % ZONA_COLORES.length] }
        })

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                    <Shuffle size={15} style={{ color: '#6a4c93' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Recomendaciones inteligentes</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Menor congestión y mejor experiencia ahora mismo</p>
                </div>
            </div>

            <div className="p-5 space-y-3">
                {recomendaciones.length === 0 && (
                    <p className="text-xs text-center py-4" style={{ color: 'var(--c-muted)' }}>No hay atracciones disponibles</p>
                )}
                {recomendaciones.map((r, i) => (
                    <div
                        key={r.id}
                        className="flex items-center gap-4 rounded-xl p-4 group transition-all hover:scale-[1.01] duration-200"
                        style={{ background: `${r.color}08`, border: `0.5px solid ${r.color}25` }}
                    >
                        {/* Rank */}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{ background: `${r.color}20`, color: r.color, fontFamily: 'var(--font-display)' }}
                        >
                            #{i + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{r.nombre}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${r.color}18`, color: r.color, border: `0.5px solid ${r.color}30` }}>
                                    {r.razon}
                                </span>
                            </div>
                            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                {r.tipo} · ~{r.espera} min de espera
                            </p>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-mono)', color: r.color }}>{r.score}</div>
                            <div className="text-xs" style={{ color: 'var(--c-muted)' }}>score</div>
                            <div className="mt-1 w-12">
                                <ProgressBar value={r.score} max={100} color={r.color} />
                            </div>
                        </div>
                    </div>
                ))}

                {/* Tabla de aristas/senderos real del grafo */}
                {aristasMapa.length > 0 && (
                    <div className="mt-4">
                        <p className="tp-label mb-3">Todos los senderos del grafo</p>
                        <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--c-border)' }}>
                            <table className="tp-table">
                                <thead>
                                <tr>
                                    <th>Desde</th>
                                    <th>Hasta</th>
                                    <th className="text-right">Peso</th>
                                </tr>
                                </thead>
                                <tbody>
                                {aristasMapa.map((arista, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ background: '#2a9d8f' }} />
                                                <span className="text-xs" style={{ color: 'var(--c-dim)' }}>{arista.origen}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <ArrowRight size={10} style={{ color: 'var(--c-muted)' }} />
                                                <span className="w-2 h-2 rounded-full" style={{ background: '#6a4c93' }} />
                                                <span className="text-xs" style={{ color: 'var(--c-dim)' }}>{arista.destino}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>
                                                {arista.peso != null ? `${arista.peso}m` : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Rutas() {
    // Atracciones y zonas del contexto global (sincronizadas con todas las páginas)
    const { atracciones, zonas, cargandoGlobal, parqueInfo } = useApp()

    // Solo el mapa de senderos se carga localmente (endpoint especializado)
    const [nodosMapa,   setNodosMapa]   = useState([])
    const [aristasMapa, setAristasMapa] = useState([])
    const [rutaNodos,   setRutaNodos]   = useState([])
    const [cargando,    setCargando]    = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const resMapa = await parqueService.getMapa()
            if (resMapa?.data) {
                setNodosMapa(resMapa.data.nodos || [])
                setAristasMapa(resMapa.data.aristas || [])
            }
        } catch (e) {
            console.error('[Rutas] Error cargando mapa:', e.message)
        } finally {
            setCargando(false)
        }
    }, [atracciones])

    useEffect(() => { fetchData() }, [fetchData])

    // Métricas calculadas desde datos globales del contexto
    const atraccionesActivas = atracciones.filter(a => a.estado === 'ABIERTA' || a.estado === 'ACTIVA').length
    const totalEnCola = atracciones.reduce((s, a) => s + (a.visitantesEnCola ?? a.contadorVisitantes ?? 0), 0)
    const conEspera = atracciones.filter(a => (a.tiempoEsperaEstimado || 0) > 0)
    const tiempoMedio        = conEspera.length > 0
        ? Math.round(conEspera.reduce((s, a) => s + a.tiempoEsperaEstimado, 0) / conEspera.length)
        : 0

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {/* Hero */}
            <HeroRutas zonas={zonas} nodosMapa={nodosMapa} aristasMapa={aristasMapa} />

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    label="Atracciones activas"
                    value={cargando ? '…' : atraccionesActivas}
                    sub="Con servicio normal"
                    accent="#22c55e"
                    icon={CheckCircle}
                    className="animate-fade-up-delay-1"
                />
                <StatCard
                    label="Visitantes únicos"
                    value={cargando ? '…' : (parqueInfo?.visitantesActuales ?? 0)}
                    sub="En el parque ahora"
                    accent="#e63946"
                    icon={Users}
                    className="animate-fade-up-delay-2"
                />
                <StatCard
                    label="Senderos del grafo"
                    value={cargando ? '…' : aristasMapa.length}
                    sub="Conexiones activas"
                    accent="#2a9d8f"
                    icon={Route}
                    className="animate-fade-up-delay-3"
                />
                <StatCard
                    label="Tiempo medio espera"
                    value={cargando ? '…' : `${tiempoMedio} min`}
                    sub="Promedio de atracciones"
                    accent="#6a4c93"
                    icon={Timer}
                    className="animate-fade-up-delay-4"
                />
            </div>

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* Grid 2 columnas */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Izquierda 2/3 */}
                <div className="xl:col-span-2 space-y-6">
                    <CalculadoraRutas
                        atracciones={atracciones}
                        nodosMapa={nodosMapa}
                        aristasMapa={aristasMapa}
                        onRutaCalculada={setRutaNodos}
                    />
                    <GestionColas
                        atracciones={atracciones}
                        onRefresh={fetchData}
                    />
                </div>

                {/* Derecha 1/3 */}
                <div className="xl:col-span-1 space-y-6">
                    <FlujoVisitantes zonas={zonas} />
                    <RecomendacionesInteligentes atracciones={atracciones} aristasMapa={aristasMapa} />
                </div>
            </div>
        </div>
    )
}