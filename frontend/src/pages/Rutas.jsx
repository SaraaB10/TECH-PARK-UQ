import { useState, useEffect, useRef } from 'react'
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
import { rutaService } from '@/services/parqueService'

// ─── Demo data ────────────────────────────────────────────────────────────────
const ATRACCIONES_NODOS = [
    { id: 'entrada',    nombre: 'Entrada Principal', zona: 'General',      x: 50,  y: 85, color: '#e9c46a' },
    { id: 'montana',    nombre: 'Montaña Rusa X',    zona: 'Aventura',     x: 20,  y: 30, color: '#f4a261' },
    { id: 'torre',      nombre: 'Torre del Terror',  zona: 'Aventura',     x: 35,  y: 15, color: '#f4a261' },
    { id: 'freefall',   nombre: 'Free Fall 360',     zona: 'Aventura',     x: 15,  y: 55, color: '#f4a261' },
    { id: 'rio',        nombre: 'Río Salvaje',       zona: 'Acuática',     x: 70,  y: 25, color: '#457b9d' },
    { id: 'ola',        nombre: 'Ola Gigante',       zona: 'Acuática',     x: 85,  y: 45, color: '#457b9d' },
    { id: 'show',       nombre: 'Show Holográfico',  zona: 'Espectáculos', x: 60,  y: 65, color: '#6a4c93' },
]

const SENDEROS = [
    { de: 'entrada', a: 'montana',  dist: 320 },
    { de: 'entrada', a: 'show',     dist: 180 },
    { de: 'entrada', a: 'freefall', dist: 280 },
    { de: 'montana', a: 'torre',    dist: 150 },
    { de: 'montana', a: 'freefall', dist: 200 },
    { de: 'torre',   a: 'rio',      dist: 380 },
    { de: 'freefall', a: 'show',    dist: 260 },
    { de: 'rio',     a: 'ola',      dist: 190 },
    { de: 'show',    a: 'rio',      dist: 310 },
    { de: 'show',    a: 'ola',      dist: 290 },
]

const DEMO_COLAS = [
    { id: 'montana',  nombre: 'Montaña Rusa X',   fastpass: 8,  general: 15, espera: 18, max: 40, estado: 'ACTIVA'           },
    { id: 'torre',    nombre: 'Torre del Terror',  fastpass: 0,  general: 0,  espera: 0,  max: 30, estado: 'EN_MANTENIMIENTO' },
    { id: 'freefall', nombre: 'Free Fall 360',     fastpass: 3,  general: 8,  espera: 9,  max: 25, estado: 'ACTIVA'           },
    { id: 'rio',      nombre: 'Río Salvaje',       fastpass: 5,  general: 13, espera: 14, max: 35, estado: 'ACTIVA'           },
    { id: 'ola',      nombre: 'Ola Gigante',       fastpass: 0,  general: 0,  espera: 0,  max: 30, estado: 'CERRADA'          },
    { id: 'show',     nombre: 'Show Holográfico',  fastpass: 12, general: 30, espera: 30, max: 80, estado: 'ACTIVA'           },
]

const DEMO_FLUJO_ZONAS = [
    { zona: 'Zona Aventura',     visitantes: 312, max: 600, color: '#f4a261', icono: '🎢', tendencia: 'up'   },
    { zona: 'Zona Acuática',     visitantes: 289, max: 500, color: '#457b9d', icono: '🌊', tendencia: 'down' },
    { zona: 'Zona Espectáculos', visitantes: 246, max: 900, color: '#6a4c93', icono: '🎭', tendencia: 'up'   },
]

const RECOMENDACIONES = [
    { nombre: 'Free Fall 360',    razon: 'Cola corta ahora', espera: 9,  zona: 'Aventura',     color: '#f4a261', score: 95 },
    { nombre: 'Río Salvaje',      razon: 'Baja afluencia',   espera: 14, zona: 'Acuática',     color: '#457b9d', score: 82 },
    { nombre: 'Show Holográfico', razon: 'Próxima función',  espera: 30, zona: 'Espectáculos', color: '#6a4c93', score: 71 },
]

const PRIORIDADES = [
    { id: 'tiempo',         label: 'Menor tiempo',   icon: Clock,         color: '#2a9d8f' },
    { id: 'filas',          label: 'Menos filas',    icon: Users,         color: '#6a4c93' },
    { id: 'accesibilidad',  label: 'Accesibilidad',  icon: Accessibility, color: '#f4a261' },
]

const NODO_ESTADO = { montana: 'ACTIVA', torre: 'EN_MANTENIMIENTO', freefall: 'ACTIVA', rio: 'ACTIVA', ola: 'CERRADA', show: 'ACTIVA', entrada: 'ACTIVA' }
const NODO_COLOR_ESTADO = { ACTIVA: '#22c55e', EN_MANTENIMIENTO: '#f4a261', CERRADA: '#e63946' }

function getNodoById(id) { return ATRACCIONES_NODOS.find(n => n.id === id) }

// ─── Mini mapa SVG del grafo ──────────────────────────────────────────────────
function GrafoMiniMapa({ rutaResaltada = [] }) {
    const W = 600, H = 300

    function px(xPct) { return (xPct / 100) * W }
    function py(yPct) { return (yPct / 100) * H }

    const enRuta = new Set(rutaResaltada)

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full rounded-xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}
        >
            {/* Grid lines decorativas */}
            {[0.2, 0.4, 0.6, 0.8].map(f => (
                <line key={`h${f}`} x1={0} y1={H * f} x2={W} y2={H * f} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}
            {[0.2, 0.4, 0.6, 0.8].map(f => (
                <line key={`v${f}`} x1={W * f} y1={0} x2={W * f} y2={H} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
            ))}

            {/* Aristas */}
            {SENDEROS.map((s, i) => {
                const a = getNodoById(s.de)
                const b = getNodoById(s.a)
                if (!a || !b) return null
                const enRutaArista = enRuta.has(s.de) && enRuta.has(s.a)
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
                        <text x={mx} y={my - 5} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono, monospace">
                            {s.dist}m
                        </text>
                    </g>
                )
            })}

            {/* Nodos */}
            {ATRACCIONES_NODOS.map(nodo => {
                const estado  = NODO_ESTADO[nodo.id] || 'ACTIVA'
                const color   = NODO_COLOR_ESTADO[estado]
                const resalt  = enRuta.has(nodo.id)
                const r       = resalt ? 16 : 12

                return (
                    <g key={nodo.id} transform={`translate(${px(nodo.x)}, ${py(nodo.y)})`}>
                        {/* Glow ring if en ruta */}
                        {resalt && (
                            <circle r={r + 6} fill="none" stroke="#2a9d8f" strokeWidth={1.5} strokeOpacity={0.4} />
                        )}
                        {/* Zona color ring */}
                        <circle r={r + 3} fill="none" stroke={nodo.color} strokeWidth={1} strokeOpacity={0.35} />
                        {/* Main node */}
                        <circle r={r} fill={resalt ? '#2a9d8f' : `${nodo.color}30`} stroke={resalt ? '#2a9d8f' : nodo.color} strokeWidth={1.5} />
                        {/* Status dot */}
                        <circle r={3} cx={r - 2} cy={-(r - 2)} fill={color} />
                        {/* Label */}
                        <text
                            y={r + 14}
                            textAnchor="middle"
                            fontSize={9}
                            fill={resalt ? 'white' : 'rgba(255,255,255,0.6)'}
                            fontFamily="Syne, sans-serif"
                            fontWeight={resalt ? 700 : 400}
                        >
                            {nodo.nombre.split(' ').slice(0, 2).join(' ')}
                        </text>
                    </g>
                )
            })}
        </svg>
    )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroRutas({ flujoZonas }) {
    const totalVisitantes = flujoZonas.reduce((s, z) => s + z.visitantes, 0)
    const maxCap         = flujoZonas.reduce((s, z) => s + z.max, 0)
    const flujoPct       = Math.round((totalVisitantes / maxCap) * 100)

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            {/* Background glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#457b9d' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: title + info */}
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

                        {/* Flujo global */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span style={{ color: 'var(--c-muted)' }}>Flujo global del parque</span>
                                <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: flujoPct > 70 ? '#e63946' : '#22c55e' }}>
                  {flujoPct}%
                </span>
                            </div>
                            <ProgressBar
                                value={totalVisitantes}
                                max={maxCap}
                                color={flujoPct > 70 ? '#e63946' : flujoPct > 50 ? '#f4a261' : '#22c55e'}
                            />
                        </div>

                        <div className="flex flex-wrap gap-3 mt-5">
                            {[
                                { label: 'Total visitantes', value: totalVisitantes.toLocaleString('es-CO'), color: '#2a9d8f' },
                                { label: 'Capacidad total',  value: maxCap.toLocaleString('es-CO'),          color: '#457b9d' },
                                { label: 'Senderos activos', value: SENDEROS.length,                         color: '#6a4c93' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="glass rounded-xl px-4 py-2.5">
                                    <div className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                    <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: mini mapa */}
                    <div className="lg:w-[480px]">
                        <div className="flex items-center gap-2 mb-2">
                            <Compass size={12} style={{ color: 'var(--c-muted)' }} />
                            <span className="text-xs uppercase tracking-widest" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                Grafo del parque
              </span>
                        </div>
                        <GrafoMiniMapa />
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
function CalculadoraRutas({ onRutaCalculada }) {
    const [origen,     setOrigen]     = useState('')
    const [destino,    setDestino]    = useState('')
    const [prioridad,  setPrioridad]  = useState('tiempo')
    const [loading,    setLoading]    = useState(false)
    const [resultado,  setResultado]  = useState(null)

    async function calcular() {
        if (!origen || !destino || origen === destino) return
        setLoading(true)
        setResultado(null)
        try {
            const res = await rutaService.calcularRuta(origen, destino)
            if (res?.data) {
                // Backend retorna { origen, destino, ruta: [{id,nombre,estado}], pasos }
                const backData = res.data
                const rutaArray = backData.ruta ?? []
                const mapped = {
                    nodos: rutaArray.map(n => n.id),
                    pasos: rutaArray.map((n, i) => ({
                        orden:     i + 1,
                        nombre:    n.nombre,
                        zona:      '',
                        distancia: i === 0 ? 0 : Math.round((backData.distanciaTotal ?? 0) / Math.max(rutaArray.length - 1, 1)),
                        espera:    0,
                        estado:    n.estado,
                    })),
                    distanciaTotal: backData.distanciaTotal ?? 0,
                    tiempoTotal:    Math.round((backData.distanciaTotal ?? 0) / 60 * 1.2),
                }
                setResultado(mapped)
                onRutaCalculada(mapped.nodos)
            }
        } catch {
            // demo fallback
            const path = buildDemoPath(origen, destino)
            setResultado(path)
            onRutaCalculada(path.nodos)
        } finally { setLoading(false) }
    }

    function buildDemoPath(o, d) {
        const noA = getNodoById(o)
        const noB = getNodoById(d)
        // simple 2-step demo
        const pasos = [noA, noB].filter(Boolean)
        const distTotal = SENDEROS.find(s => (s.de === o && s.a === d) || (s.de === d && s.a === o))?.dist || 480
        return {
            nodos: pasos.map(p => p.id),
            pasos: pasos.map((p, i) => ({
                orden: i + 1,
                nombre: p.nombre,
                zona: p.zona,
                distancia: i === 0 ? 0 : distTotal,
                espera: DEMO_COLAS.find(c => c.id === p.id)?.espera || 0,
                estado: NODO_ESTADO[p.id] || 'ACTIVA',
            })),
            distanciaTotal: distTotal,
            tiempoTotal: Math.round(distTotal / 60 * 1.2) + (DEMO_COLAS.find(c => c.id === d)?.espera || 0),
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
                        {ATRACCIONES_NODOS.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                    </Select>
                    <Select label="Destino" value={destino} onChange={e => setDestino(e.target.value)}>
                        <option value="">Seleccionar destino…</option>
                        {ATRACCIONES_NODOS.filter(n => n.id !== origen).map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
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

                <Button variant="primary" size="lg" loading={loading} onClick={calcular} className="w-full sm:w-auto justify-center">
                    <Play size={15} /> Calcular ruta óptima (Dijkstra)
                </Button>

                {/* Resultado */}
                {resultado && (
                    <div className="mt-6">
                        {/* Summary chips */}
                        <div className="flex flex-wrap gap-3 mb-5">
                            {[
                                { label: 'Distancia total', value: `${resultado.distanciaTotal}m`, icon: MapPin,  color: '#2a9d8f' },
                                { label: 'Tiempo estimado', value: `${resultado.tiempoTotal} min`, icon: Clock,   color: '#6a4c93' },
                                { label: 'Paradas',         value: resultado.pasos.length,         icon: Target,  color: '#f4a261' },
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

                        {/* Timeline */}
                        <div className="relative">
                            <div className="absolute left-4 top-4 bottom-4 w-px" style={{ background: 'linear-gradient(180deg,#2a9d8f,#6a4c93)' }} />
                            <div className="space-y-3 pl-10">
                                {resultado.pasos.map((paso, i) => (
                                    <div
                                        key={i}
                                        className="relative rounded-xl p-4"
                                        style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}
                                    >
                                        {/* Timeline dot */}
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
                                                    {i === 0 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(42,157,143,0.15)', color: '#2a9d8f', fontSize: 10 }}>INICIO</span>}
                                                    {i === resultado.pasos.length - 1 && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(106,76,147,0.15)', color: '#6a4c93', fontSize: 10 }}>DESTINO</span>}
                                                    <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{paso.nombre}</span>
                                                </div>
                                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{paso.zona}</p>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {paso.distancia > 0 && (
                                                    <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-dim)' }}>+{paso.distancia}m</span>
                                                )}
                                                {paso.espera > 0 && (
                                                    <span className="flex items-center gap-1 text-xs" style={{ color: '#f4a261' }}>
                            <Clock size={10} /> {paso.espera}min
                          </span>
                                                )}
                                                <Badge variant={paso.estado === 'ACTIVA' ? 'active' : paso.estado === 'EN_MANTENIMIENTO' ? 'maintenance' : 'closed'} dot>
                                                    {paso.estado === 'ACTIVA' ? 'Activa' : paso.estado === 'EN_MANTENIMIENTO' ? 'Mant.' : 'Cerrada'}
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

// ─── Flujo de visitantes ──────────────────────────────────────────────────────
function FlujoVisitantes({ zonas }) {
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
                {zonas.map((z) => {
                    const pct      = Math.round((z.visitantes / z.max) * 100)
                    const saturada = pct >= 75
                    const moderada = pct >= 50

                    return (
                        <div key={z.zona} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: `0.5px solid ${z.color}25` }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{z.icono}</span>
                                    <div>
                                        <p className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{z.zona}</p>
                                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                            {z.visitantes.toLocaleString('es-CO')} / {z.max.toLocaleString('es-CO')} visitantes
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {z.tendencia === 'up'
                                        ? <TrendingUp  size={14} style={{ color: saturada ? '#e63946' : '#22c55e' }} />
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
                                </div>
                            </div>

                            {/* Heatmap bar visual */}
                            <div className="relative h-6 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                {/* Zones inside the bar */}
                                <div
                                    className="absolute left-0 top-0 h-full rounded-lg transition-all duration-700"
                                    style={{
                                        width: `${pct}%`,
                                        background: saturada
                                            ? 'linear-gradient(90deg, #f4a261, #e63946)'
                                            : moderada
                                                ? `linear-gradient(90deg, ${z.color}88, ${z.color})`
                                                : `linear-gradient(90deg, ${z.color}55, ${z.color}88)`,
                                    }}
                                />
                                {/* Threshold lines */}
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

// ─── Gestión de colas ─────────────────────────────────────────────────────────
function GestionColas({ colas, setColas }) {
    const [loading, setLoading] = useState(null)

    async function procesar(id) {
        setLoading(id)
        await new Promise(r => setTimeout(r, 600))
        try { await rutaService.procesarCola(id) } catch {}
        setColas(prev => prev.map(c => c.id === id
            ? { ...c, fastpass: Math.max(0, c.fastpass - 1), general: Math.max(0, c.general - 1) }
            : c
        ))
        setLoading(null)
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Users size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Gestión de colas virtuales</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>FastPass y General — procesar siguiente visitante</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="tp-table">
                    <thead>
                    <tr>
                        <th>Atracción</th>
                        <th className="text-center">
                <span className="flex items-center justify-center gap-1">
                  <Zap size={11} style={{ color: '#e9c46a' }} /> FastPass
                </span>
                        </th>
                        <th className="text-center hidden sm:table-cell">General</th>
                        <th className="text-center">Total</th>
                        <th className="text-center hidden md:table-cell">Espera</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                    </thead>
                    <tbody>
                    {colas.map((c) => {
                        const total = c.fastpass + c.general
                        const pct   = Math.round((total / c.max) * 100)
                        const activa = c.estado === 'ACTIVA'

                        return (
                            <tr key={c.id}>
                                <td>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{c.nombre}</p>
                                        <div className="mt-1.5 w-24">
                                            <ProgressBar value={total} max={c.max} color={pct > 70 ? '#e63946' : pct > 40 ? '#f4a261' : '#22c55e'} />
                                        </div>
                                    </div>
                                </td>
                                <td className="text-center">
                    <span className="inline-flex items-center gap-1 font-mono font-bold text-sm" style={{ fontFamily: 'var(--font-mono)', color: '#e9c46a' }}>
                      <Zap size={11} style={{ color: '#e9c46a' }} />
                        {c.fastpass}
                    </span>
                                </td>
                                <td className="text-center hidden sm:table-cell">
                                    <span className="font-mono text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-dim)' }}>{c.general}</span>
                                </td>
                                <td className="text-center">
                    <span
                        className="font-mono font-bold text-sm px-2 py-0.5 rounded-lg"
                        style={{
                            fontFamily: 'var(--font-mono)',
                            color: pct > 70 ? '#e63946' : pct > 40 ? '#f4a261' : 'var(--c-dim)',
                            background: pct > 70 ? 'rgba(230,57,70,0.1)' : 'transparent',
                        }}
                    >
                      {total}
                    </span>
                                </td>
                                <td className="text-center hidden md:table-cell">
                    <span className="flex items-center justify-center gap-1 text-xs" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                      <Clock size={10} /> {c.espera > 0 ? `${c.espera}min` : '—'}
                    </span>
                                </td>
                                <td>
                                    <StatusBadge status={c.estado} />
                                </td>
                                <td>
                                    <Button
                                        variant={activa ? 'ghost' : 'ghost'}
                                        size="sm"
                                        disabled={!activa || total === 0}
                                        loading={loading === c.id}
                                        onClick={() => procesar(c.id)}
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

// ─── Recomendaciones inteligentes ────────────────────────────────────────────
function RecomendacionesInteligentes() {
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
                {RECOMENDACIONES.map((r, i) => (
                    <div
                        key={r.nombre}
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
                                {r.zona} · ~{r.espera} min de espera
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

                {/* Senderos table */}
                <div className="mt-4">
                    <p className="tp-label mb-3">Todos los senderos del grafo</p>
                    <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--c-border)' }}>
                        <table className="tp-table">
                            <thead>
                            <tr>
                                <th>Desde</th>
                                <th>Hasta</th>
                                <th className="text-right">Distancia</th>
                            </tr>
                            </thead>
                            <tbody>
                            {SENDEROS.map((s, i) => {
                                const a = getNodoById(s.de)
                                const b = getNodoById(s.a)
                                return (
                                    <tr key={i}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full" style={{ background: a?.color || '#6b7280' }} />
                                                <span className="text-xs" style={{ color: 'var(--c-dim)' }}>{a?.nombre || s.de}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <ArrowRight size={10} style={{ color: 'var(--c-muted)' }} />
                                                <span className="w-2 h-2 rounded-full" style={{ background: b?.color || '#6b7280' }} />
                                                <span className="text-xs" style={{ color: 'var(--c-dim)' }}>{b?.nombre || s.a}</span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>{s.dist}m</span>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Rutas() {
    const [colas,       setColas]       = useState(DEMO_COLAS)
    const [flujoZonas,  setFlujoZonas]  = useState(DEMO_FLUJO_ZONAS)
    const [rutaNodos,   setRutaNodos]   = useState([])

    useEffect(() => {
        async function fetchData() {
            try {
                // getColas y getFlujoPorZona no existen en el backend; se usan datos demo
            } catch {}
        }
        fetchData()
    }, [])

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {/* Hero */}
            <HeroRutas flujoZonas={flujoZonas} />

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Atracciones activas"   value={colas.filter(c => c.estado === 'ACTIVA').length}   sub="Con servicio normal"   accent="#22c55e" icon={CheckCircle} className="animate-fade-up-delay-1" />
                <StatCard label="Total en colas"         value={colas.reduce((s, c) => s + c.fastpass + c.general, 0)} sub="FastPass + General"   accent="#e63946" icon={Users}        className="animate-fade-up-delay-2" />
                <StatCard label="Senderos del grafo"     value={SENDEROS.length}                                    sub="Conexiones activas"    accent="#2a9d8f" icon={Route}        className="animate-fade-up-delay-3" />
                <StatCard label="Tiempo medio espera"    value={`${Math.round(colas.filter(c=>c.espera>0).reduce((s,c)=>s+c.espera,0) / Math.max(1, colas.filter(c=>c.espera>0).length))} min`} sub="Promedio de atracciones" accent="#6a4c93" icon={Timer} className="animate-fade-up-delay-4" />
            </div>

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* 2-col grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left 2/3 */}
                <div className="xl:col-span-2 space-y-6">
                    <CalculadoraRutas onRutaCalculada={setRutaNodos} />
                    <GestionColas colas={colas} setColas={setColas} />
                </div>

                {/* Right 1/3 */}
                <div className="xl:col-span-1 space-y-6">
                    <FlujoVisitantes zonas={flujoZonas} />
                    <RecomendacionesInteligentes />
                </div>
            </div>
        </div>
    )
}