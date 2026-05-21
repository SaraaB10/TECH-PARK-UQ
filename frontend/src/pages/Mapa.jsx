import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Map, ZoomIn, ZoomOut, Maximize2, RefreshCw,
    Navigation, Clock, Users, Activity, Star,
    Filter, ChevronRight, Layers, Zap, MapPin,
    TrendingUp, AlertTriangle, CheckCircle, Info,
    Heart, Eye, Crosshair, Shuffle
} from 'lucide-react'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Input'
import { parqueService } from '@/services/parqueService'

// ─── Datos del parque ─────────────────────────────────────────────────────────
const NODOS = [
    { id: 'entrada',  label: 'Entrada\nPrincipal', zona: 'General',      x: 0,    y: 180,  estado: 'ACTIVA',           visitantes: 0,  espera: 0,  alturaMin: 0,   costo: 0,     icono: '🚪' },
    { id: 'montana',  label: 'Montaña\nRusa X',    zona: 'Aventura',     x: -300, y: -80,  estado: 'ACTIVA',           visitantes: 23, espera: 18, alturaMin: 140, costo: 5000,  icono: '🎢' },
    { id: 'torre',    label: 'Torre del\nTerror',  zona: 'Aventura',     x: -180, y: -240, estado: 'EN_MANTENIMIENTO', visitantes: 0,  espera: 0,  alturaMin: 130, costo: 4000,  icono: '🗼' },
    { id: 'freefall', label: 'Free\nFall 360',     zona: 'Aventura',     x: -400, y: 80,   estado: 'ACTIVA',           visitantes: 11, espera: 9,  alturaMin: 120, costo: 4500,  icono: '🪂' },
    { id: 'rio',      label: 'Río\nSalvaje',       zona: 'Acuática',     x: 260,  y: -120, estado: 'ACTIVA',           visitantes: 18, espera: 14, alturaMin: 100, costo: 3500,  icono: '🌊' },
    { id: 'ola',      label: 'Ola\nGigante',       zona: 'Acuática',     x: 380,  y: 60,   estado: 'CERRADA',          visitantes: 0,  espera: 0,  alturaMin: 90,  costo: 3000,  icono: '🏄' },
    { id: 'show',     label: 'Show\nHolográfico',  zona: 'Espectáculos', x: 80,   y: -200, estado: 'ACTIVA',           visitantes: 42, espera: 30, alturaMin: 0,   costo: 6000,  icono: '🎭' },
]

const ARISTAS = [
    { from: 'entrada', to: 'montana',  label: '320m', dashes: false },
    { from: 'entrada', to: 'show',     label: '180m', dashes: false },
    { from: 'entrada', to: 'freefall', label: '280m', dashes: false },
    { from: 'entrada', to: 'rio',      label: '350m', dashes: false },
    { from: 'montana', to: 'torre',    label: '150m', dashes: false },
    { from: 'montana', to: 'freefall', label: '200m', dashes: false },
    { from: 'torre',   to: 'rio',      label: '380m', dashes: false },
    { from: 'freefall', to: 'show',    label: '260m', dashes: false },
    { from: 'rio',     to: 'ola',      label: '190m', dashes: false },
    { from: 'show',    to: 'rio',      label: '310m', dashes: false },
    { from: 'show',    to: 'ola',      label: '290m', dashes: false },
]

const ZONA_COLORS = {
    General:       { bg: '#e9c46a', border: '#b8952a', glow: 'rgba(233,196,106,0.4)' },
    Aventura:      { bg: '#f4a261', border: '#c07030', glow: 'rgba(244,162,97,0.4)'  },
    Acuática:      { bg: '#457b9d', border: '#2a5a7a', glow: 'rgba(69,123,157,0.4)'  },
    Espectáculos:  { bg: '#6a4c93', border: '#4a2c73', glow: 'rgba(106,76,147,0.4)'  },
}

const ESTADO_COLORS = {
    ACTIVA:           { node: '#22c55e', label: 'Activa'          },
    EN_MANTENIMIENTO: { node: '#f4a261', label: 'Mantenimiento'   },
    CERRADA:          { node: '#e63946', label: 'Cerrada'         },
}

const RECOMENDACIONES = [
    { id: 'freefall', nombre: 'Free Fall 360',    razon: 'Cola corta (9 min)',   zona: 'Aventura',     color: '#f4a261', score: 95 },
    { id: 'rio',      nombre: 'Río Salvaje',      razon: 'Baja saturación',      zona: 'Acuática',     color: '#457b9d', score: 80 },
    { id: 'show',     nombre: 'Show Holográfico', razon: 'Próxima función 17:00', zona: 'Espectáculos', color: '#6a4c93', score: 68 },
]

// ─── Grafo SVG interno (sin vis-network CDN, self-contained) ─────────────────
// Usamos SVG propio que emula el grafo de vis-network con la misma estética.
// Si el proyecto tiene acceso a npm vis-network, reemplaza este componente
// con el hook useEffect + new Network(...) de la librería.

function GrafoSVG({ nodos, aristas, nodoSeleccionado, onSelect, rutaResaltada, filtroZona }) {
    const SCALE = 0.72
    const W = 780, H = 480
    const CX = W / 2, CY = H / 2

    function px(x) { return CX + x * SCALE }
    function py(y) { return CY + y * SCALE }

    const nodosFiltrados = filtroZona === 'Todas'
        ? nodos
        : nodos.filter(n => n.zona === filtroZona || n.id === 'entrada')

    const enRuta = new Set(rutaResaltada)

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            style={{ cursor: 'default' }}
        >
            {/* Fondo con grid */}
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
                <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(42,157,143,0.04)" />
                    <stop offset="100%" stopColor="rgba(13,15,20,0)" />
                </radialGradient>
                {/* Glows */}
                {nodos.map(n => (
                    <radialGradient key={`glow-${n.id}`} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                        <stop offset="0%"   stopColor={ZONA_COLORS[n.zona]?.bg || '#6a4c93'} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={ZONA_COLORS[n.zona]?.bg || '#6a4c93'} stopOpacity="0" />
                    </radialGradient>
                ))}
                <filter id="blur-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <rect width={W} height={H} fill="url(#grid)" rx="12" />
            <ellipse cx={CX} cy={CY} rx={260} ry={160} fill="url(#bgGrad)" />

            {/* Aristas */}
            {aristas.map((a, i) => {
                const nA = nodos.find(n => n.id === a.from)
                const nB = nodos.find(n => n.id === a.to)
                if (!nA || !nB) return null
                const inFiltro = nodosFiltrados.find(n => n.id === nA.id) && nodosFiltrados.find(n => n.id === nB.id)
                if (!inFiltro) return null
                const inRuta = enRuta.has(a.from) && enRuta.has(a.to)
                const mx = (px(nA.x) + px(nB.x)) / 2
                const my = (py(nA.y) + py(nB.y)) / 2

                return (
                    <g key={i}>
                        {/* Glow line for route */}
                        {inRuta && (
                            <line
                                x1={px(nA.x)} y1={py(nA.y)} x2={px(nB.x)} y2={py(nB.y)}
                                stroke="#2a9d8f" strokeWidth={6} strokeOpacity={0.2}
                            />
                        )}
                        <line
                            x1={px(nA.x)} y1={py(nA.y)} x2={px(nB.x)} y2={py(nB.y)}
                            stroke={inRuta ? '#2a9d8f' : 'rgba(255,255,255,0.08)'}
                            strokeWidth={inRuta ? 2.5 : 1}
                            strokeDasharray={inRuta ? '8 4' : undefined}
                        />
                        {/* Distance label */}
                        <rect x={mx - 16} y={my - 9} width={32} height={14} rx={4}
                              fill="rgba(13,15,20,0.75)" />
                        <text x={mx} y={my + 1} textAnchor="middle" fontSize={9}
                              fill="rgba(255,255,255,0.35)" fontFamily="JetBrains Mono, monospace">
                            {a.label}
                        </text>
                    </g>
                )
            })}

            {/* Nodos */}
            {nodosFiltrados.map(nodo => {
                const zona   = ZONA_COLORS[nodo.zona] || ZONA_COLORS.General
                const estado = ESTADO_COLORS[nodo.estado] || ESTADO_COLORS.ACTIVA
                const sel    = nodoSeleccionado?.id === nodo.id
                const inR    = enRuta.has(nodo.id)
                const r      = nodo.id === 'entrada' ? 28 : 22

                return (
                    <g
                        key={nodo.id}
                        transform={`translate(${px(nodo.x)}, ${py(nodo.y)})`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelect(nodo)}
                    >
                        {/* Glow aura */}
                        <circle r={r + 18} fill={`url(#glow-${nodo.id})`} opacity={sel ? 1 : 0.5} />

                        {/* Route ring */}
                        {inR && <circle r={r + 8} fill="none" stroke="#2a9d8f" strokeWidth={2} strokeOpacity={0.6} strokeDasharray="5 3" />}

                        {/* Selected ring */}
                        {sel && <circle r={r + 5} fill="none" stroke={zona.bg} strokeWidth={2} strokeOpacity={0.8} />}

                        {/* Main circle */}
                        <circle
                            r={r}
                            fill={sel ? zona.bg : `${zona.bg}22`}
                            stroke={sel ? zona.bg : `${zona.bg}66`}
                            strokeWidth={sel ? 2.5 : 1.5}
                        />

                        {/* Status indicator */}
                        <circle r={5} cx={r - 4} cy={-(r - 4)}
                                fill={estado.node}
                                stroke="rgba(13,15,20,0.8)"
                                strokeWidth={1.5}
                        />
                        {nodo.estado === 'ACTIVA' && (
                            <circle r={5} cx={r - 4} cy={-(r - 4)}
                                    fill={estado.node} opacity={0.4}>
                                <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                            </circle>
                        )}

                        {/* Icon */}
                        <text y={5} textAnchor="middle" fontSize={nodo.id === 'entrada' ? 18 : 14}>
                            {nodo.icono}
                        </text>

                        {/* Label */}
                        {nodo.label.split('\n').map((line, li) => (
                            <text key={li}
                                  y={r + 14 + li * 11}
                                  textAnchor="middle"
                                  fontSize={9}
                                  fontWeight={sel ? 700 : 400}
                                  fill={sel ? 'white' : 'rgba(255,255,255,0.55)'}
                                  fontFamily="Syne, sans-serif"
                            >
                                {line}
                            </text>
                        ))}

                        {/* Queue badge */}
                        {nodo.visitantes > 0 && (
                            <g transform={`translate(${-(r - 2)}, ${-(r - 2)})`}>
                                <circle r={8} fill="#e63946" stroke="rgba(13,15,20,0.9)" strokeWidth={1} />
                                <text textAnchor="middle" y={3} fontSize={7} fill="white" fontWeight={700} fontFamily="Syne, sans-serif">
                                    {nodo.visitantes}
                                </text>
                            </g>
                        )}
                    </g>
                )
            })}
        </svg>
    )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroMapa() {
    const totalVisitantes = NODOS.reduce((s, n) => s + n.visitantes, 0)
    const activas = NODOS.filter(n => n.estado === 'ACTIVA').length - 1 // exclude entrada

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#457b9d' }} />

            <div className="relative z-10 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.2)', border: '0.5px solid rgba(42,157,143,0.3)' }}>
                            <Map size={16} style={{ color: '#2a9d8f' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>
              Mapa interactivo
            </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Grafo del <span className="text-rainbow">Parque</span>
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
                        Dijkstra visual — haz clic en un nodo para ver detalles o calcular rutas.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'En colas', value: totalVisitantes, color: '#e63946', icon: Users    },
                        { label: 'Activas',  value: activas,         color: '#22c55e', icon: Activity },
                        { label: 'Senderos', value: ARISTAS.length,  color: '#2a9d8f', icon: Map      },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <Ico size={14} style={{ color }} />
                            <div>
                                <div className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>{label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Panel lateral: nodo seleccionado ────────────────────────────────────────
function PanelNodo({ nodo, onClearSelect, onAddRuta }) {
    if (!nodo) {
        return (
            <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    <Eye size={20} style={{ color: 'var(--c-muted)' }} />
                </div>
                <p className="text-sm font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                    Selecciona un nodo
                </p>
                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                    Haz clic en cualquier atracción del mapa para ver sus detalles.
                </p>
            </div>
        )
    }

    const zona   = ZONA_COLORS[nodo.zona] || ZONA_COLORS.General
    const pctCola = nodo.espera > 0 ? Math.min(100, Math.round((nodo.visitantes / 40) * 100)) : 0

    return (
        <div className="glass rounded-2xl overflow-hidden">
            {/* Header */}
            <div
                className="px-5 py-4 relative overflow-hidden"
                style={{ background: `${zona.bg}12`, borderBottom: `0.5px solid ${zona.bg}30` }}
            >
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15 blur-xl" style={{ background: zona.bg }} />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{nodo.icono}</span>
                            <div>
                                <h3 className="text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                    {nodo.label.replace('\n', ' ')}
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{nodo.zona}</p>
                            </div>
                        </div>
                        <StatusBadge status={nodo.estado} />
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'En cola',      value: nodo.visitantes || '—',                   color: '#e63946', icon: Users  },
                        { label: 'Espera',       value: nodo.espera > 0 ? `${nodo.espera} min` : '—', color: '#f4a261', icon: Clock  },
                        { label: 'Alt. mínima',  value: nodo.alturaMin > 0 ? `${nodo.alturaMin} cm` : 'Libre', color: '#2a9d8f', icon: Activity },
                        { label: 'Costo extra',  value: nodo.costo > 0 ? `$${(nodo.costo/1000).toFixed(0)}k` : 'Incluido', color: '#6a4c93', icon: Star    },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="rounded-xl p-3" style={{ background: `${color}0d`, border: `0.5px solid ${color}22` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Ico size={11} style={{ color }} />
                                <span className="text-xs" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {label}
                </span>
                            </div>
                            <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Cola bar */}
                {nodo.estado === 'ACTIVA' && nodo.visitantes > 0 && (
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span style={{ color: 'var(--c-muted)' }}>Nivel de cola</span>
                            <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: pctCola > 70 ? '#e63946' : '#f4a261' }}>{pctCola}%</span>
                        </div>
                        <ProgressBar value={pctCola} max={100} color={pctCola > 70 ? '#e63946' : pctCola > 40 ? '#f4a261' : '#22c55e'} />
                    </div>
                )}

                {/* Conexiones */}
                <div>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                        Senderos conectados
                    </p>
                    <div className="space-y-1.5">
                        {ARISTAS
                            .filter(a => a.from === nodo.id || a.to === nodo.id)
                            .map((a, i) => {
                                const otherId = a.from === nodo.id ? a.to : a.from
                                const other   = NODOS.find(n => n.id === otherId)
                                return (
                                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
                                         style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}>
                    <span className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-dim)' }}>
                      <ChevronRight size={10} style={{ color: 'var(--c-muted)' }} />
                        {other?.label.replace('\n', ' ') || otherId}
                    </span>
                                        <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>{a.label}</span>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(42,157,143,0.12)', color: '#2a9d8f', border: '0.5px solid rgba(42,157,143,0.25)', fontFamily: 'var(--font-display)' }}
                        onClick={() => onAddRuta(nodo)}
                    >
                        <Navigation size={12} /> Ir aquí
                    </button>
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)', fontFamily: 'var(--font-display)' }}
                    >
                        <Heart size={12} /> Favorito
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Calculadora Dijkstra inline ──────────────────────────────────────────────
function CalculadoraRuta({ onRutaCalculada }) {
    const [origen,   setOrigen]   = useState('')
    const [destino,  setDestino]  = useState('')
    const [loading,  setLoading]  = useState(false)
    const [resultado, setResultado] = useState(null)

    async function calcular() {
        if (!origen || !destino || origen === destino) return
        setLoading(true)
        await new Promise(r => setTimeout(r, 700))

        // Demo Dijkstra result
        const nA = NODOS.find(n => n.id === origen)
        const nB = NODOS.find(n => n.id === destino)
        const arista = ARISTAS.find(a => (a.from===origen&&a.to===destino)||(a.from===destino&&a.to===origen))
        const dist = arista ? parseInt(arista.label) : 480
        const tiempo = Math.round(dist / 60 * 1.3) + (nB?.espera || 0)
        const nodos = [origen, destino]

        setResultado({ nodos, dist, tiempo, nA, nB })
        onRutaCalculada(nodos)
        setLoading(false)
    }

    function limpiar() {
        setResultado(null)
        setOrigen('')
        setDestino('')
        onRutaCalculada([])
    }

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                    <Navigation size={14} style={{ color: '#6a4c93' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Ruta Dijkstra</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Se resalta en el mapa</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <Select label="Origen" value={origen} onChange={e => setOrigen(e.target.value)}>
                    <option value="">Inicio…</option>
                    {NODOS.map(n => <option key={n.id} value={n.id}>{n.label.replace('\n',' ')}</option>)}
                </Select>
                <Select label="Destino" value={destino} onChange={e => setDestino(e.target.value)}>
                    <option value="">Destino…</option>
                    {NODOS.filter(n => n.id !== origen).map(n => <option key={n.id} value={n.id}>{n.label.replace('\n',' ')}</option>)}
                </Select>
                <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={loading} onClick={calcular} className="flex-1 justify-center">
                        <Crosshair size={13} /> Calcular
                    </Button>
                    {resultado && (
                        <Button variant="ghost" size="sm" onClick={limpiar}>
                            <RefreshCw size={13} />
                        </Button>
                    )}
                </div>

                {resultado && (
                    <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(42,157,143,0.07)', border: '0.5px solid rgba(42,157,143,0.2)' }}>
                        <div className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--c-muted)' }}>Distancia</span>
                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>{resultado.dist}m</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--c-muted)' }}>Tiempo total</span>
                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: '#6a4c93' }}>{resultado.tiempo} min</span>
                        </div>
                        <div className="text-xs" style={{ color: 'var(--c-muted)' }}>
                            {resultado.nA?.label.replace('\n',' ')} → {resultado.nB?.label.replace('\n',' ')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────
function Leyenda() {
    return (
        <div className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                Leyenda
            </p>
            <div className="space-y-2.5">
                <div>
                    <p className="text-xs mb-2" style={{ color: 'var(--c-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zonas</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {Object.entries(ZONA_COLORS).map(([zona, c]) => (
                            <div key={zona} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.bg }} />
                                <span className="text-xs truncate" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{zona}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-px" style={{ background: 'var(--c-border)' }} />
                <div>
                    <p className="text-xs mb-2" style={{ color: 'var(--c-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</p>
                    <div className="space-y-1">
                        {Object.entries(ESTADO_COLORS).map(([estado, c]) => (
                            <div key={estado} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.node, boxShadow: `0 0 5px ${c.node}` }} />
                                <span className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{c.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-px" style={{ background: 'var(--c-border)' }} />
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>
                        <div className="flex items-center gap-1">
                            <span className="w-6 h-px" style={{ background: '#2a9d8f' }} />
                            <span className="w-2 h-px" style={{ background: '#2a9d8f' }} />
                        </div>
                        Ruta calculada
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>
                        <span className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                        Sendero del parque
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>
                        <span className="w-3 h-3 rounded-full flex items-center justify-center text-white" style={{ background: '#e63946', fontSize: 7, fontWeight: 700 }}>N</span>
                        Visitantes en cola
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Recomendaciones ──────────────────────────────────────────────────────────
function PanelRecomendaciones({ onSelectNodo }) {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                    <Shuffle size={14} style={{ color: '#e9c46a' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Sugerencias</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Menor congestión ahora</p>
                </div>
            </div>
            <div className="p-4 space-y-2">
                {RECOMENDACIONES.map((r, i) => {
                    const nodo = NODOS.find(n => n.id === r.id)
                    return (
                        <div
                            key={r.id}
                            className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01]"
                            style={{ background: `${r.color}0a`, border: `0.5px solid ${r.color}25` }}
                            onClick={() => nodo && onSelectNodo(nodo)}
                        >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                                {nodo?.icono}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{r.nombre}</p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{r.razon}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-sm font-bold" style={{ fontFamily: 'var(--font-mono)', color: r.color }}>{r.score}</div>
                                <div className="w-10">
                                    <ProgressBar value={r.score} max={100} color={r.color} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
// Posiciones circulares para nodos que vengan del backend sin coordenadas
function computePositions(nodos) {
    const cx = 0, cy = 0, r = 260
    return nodos.map((n, i) => {
        const angle = (2 * Math.PI * i) / nodos.length - Math.PI / 2
        return { ...n, x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) }
    })
}

const TIPO_ICONO = {
    MECANICA_ALTURA: '🎢',
    ACUATICA:        '🌊',
    ESPECTACULO:     '🎭',
    OTRO:            '🎡',
}

export default function Mapa() {
    const [nodoSel,      setNodoSel]      = useState(null)
    const [rutaNodos,    setRutaNodos]    = useState([])
    const [filtroZona,   setFiltroZona]   = useState('Todas')
    const [zoom,         setZoom]         = useState(1)
    const [nodos,        setNodos]        = useState(NODOS)
    const [aristas,      setAristas]      = useState(ARISTAS)

    useEffect(() => {
        async function fetchMapa() {
            try {
                const res = await parqueService.getMapa()
                if (!res?.data) return
                const { nodos: backNodos, aristas: backAristas } = res.data
                if (backNodos?.length) {
                    const mapped = backNodos.map(n => ({
                        id:          n.id,
                        label:       n.nombre,
                        zona:        n.tipo === 'MECANICA_ALTURA' ? 'Aventura'
                                   : n.tipo === 'ACUATICA'        ? 'Acuática'
                                   : n.tipo === 'ESPECTACULO'     ? 'Espectáculos'
                                   : 'General',
                        estado:      n.estado,
                        visitantes:  n.contadorVisitantes ?? 0,
                        espera:      n.tiempoEsperaEstimado ?? 0,
                        alturaMin:   n.alturaMinima ?? 0,
                        costo:       n.costoAdicional ?? 0,
                        icono:       TIPO_ICONO[n.tipo] ?? '🎡',
                        x: 0, y: 0,
                    }))
                    setNodos(computePositions(mapped))
                }
                if (backAristas?.length) {
                    setAristas(backAristas.map(a => ({
                        from:   a.from,
                        to:     a.to,
                        label:  `${Math.round(a.peso)}m`,
                        dashes: false,
                    })))
                }
            } catch { /* usa datos hardcodeados como fallback */ }
        }
        fetchMapa()
    }, [])

    const ZONAS_OPCIONES = ['Todas', 'Aventura', 'Acuática', 'Espectáculos']

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            <HeroMapa />

            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    {ZONAS_OPCIONES.map(z => (
                        <button
                            key={z}
                            onClick={() => setFiltroZona(z)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background:    filtroZona === z ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color:         filtroZona === z ? 'var(--c-text)' : 'var(--c-muted)',
                                fontFamily:    'var(--font-display)',
                                border:        filtroZona === z ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
                            }}
                        >
                            <Layers size={11} /> {z}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
                    ><ZoomIn size={13} /> Zoom+</button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
                    ><ZoomOut size={13} /> Zoom-</button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => { setZoom(1); setNodoSel(null); setRutaNodos([]) }}
                    ><Maximize2 size={13} /> Reset</button>
                </div>

                {nodoSel && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                         style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                        <CheckCircle size={12} />
                        <span style={{ fontFamily: 'var(--font-display)' }}>
              {nodoSel.label.replace('\n', ' ')} seleccionado
            </span>
                    </div>
                )}
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                {/* Grafo — 3 cols */}
                <div className="xl:col-span-3">
                    <div
                        className="glass rounded-2xl overflow-hidden relative"
                        style={{ height: 500 }}
                    >
                        {/* Overflow wrapper for zoom */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `scale(${zoom})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.3s ease',
                            }}
                        >
                            <GrafoSVG
                                nodos={nodos}
                                aristas={aristas}
                                nodoSeleccionado={nodoSel}
                                onSelect={setNodoSel}
                                rutaResaltada={rutaNodos}
                                filtroZona={filtroZona}
                            />
                        </div>

                        {/* Floating instructions */}
                        {!nodoSel && (
                            <div
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs"
                                style={{ background: 'rgba(13,15,20,0.85)', color: 'var(--c-muted)', border: '0.5px solid var(--c-border)', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}
                            >
                                <Info size={11} />
                                Haz clic en un nodo para ver detalles
                            </div>
                        )}

                        {/* Zoom indicator */}
                        <div
                            className="absolute top-3 right-3 text-xs font-mono px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(13,15,20,0.7)', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', backdropFilter: 'blur(4px)' }}
                        >
                            {Math.round(zoom * 100)}%
                        </div>
                    </div>

                    {/* Stats below map */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                            { label: 'Activas',          value: nodos.filter(n=>n.estado==='ACTIVA'&&n.id!=='entrada').length, color: '#22c55e', icon: CheckCircle  },
                            { label: 'Mantenimiento',    value: nodos.filter(n=>n.estado==='EN_MANTENIMIENTO').length,         color: '#f4a261', icon: AlertTriangle },
                            { label: 'Cerradas',         value: nodos.filter(n=>n.estado==='CERRADA').length,                  color: '#e63946', icon: Activity     },
                            { label: 'Visitantes total', value: nodos.reduce((s,n)=>s+n.visitantes,0),                         color: '#2a9d8f', icon: Users        },
                        ].map(({ label, value, color, icon: Ico }) => (
                            <div key={label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                     style={{ background: `${color}15`, border: `0.5px solid ${color}25` }}>
                                    <Ico size={13} style={{ color }} />
                                </div>
                                <div>
                                    <div className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                    <div className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right sidebar — 1 col */}
                <div className="xl:col-span-1 space-y-4">
                    <PanelNodo
                        nodo={nodoSel}
                        onClearSelect={() => setNodoSel(null)}
                        onAddRuta={(nodo) => setRutaNodos(prev => prev.includes(nodo.id) ? prev : [...prev, nodo.id])}
                    />
                    <CalculadoraRuta onRutaCalculada={setRutaNodos} />
                    <Leyenda />
                    <PanelRecomendaciones onSelectNodo={setNodoSel} />
                </div>
            </div>
        </div>
    )
}