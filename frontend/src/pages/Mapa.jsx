import { useState, useEffect, useCallback, useMemo } from 'react'
import {
    Map, ZoomIn, ZoomOut, Maximize2, RefreshCw,
    Navigation, Clock, Users, Activity, Star,
    Layers, Zap, MapPin,
    AlertTriangle, CheckCircle, Info,
    Heart, Eye, Crosshair, Shuffle
} from 'lucide-react'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Input'
import { parqueService } from '@/services/parqueService'
import { useApp } from '@/context/AppContext'

// ─── Constantes visuales ──────────────────────────────────────────────────────
const ZONA_COLORS = {
    General:       { bg: '#e9c46a', border: '#b8952a', glow: 'rgba(233,196,106,0.4)' },
    Aventura:      { bg: '#f4a261', border: '#c07030', glow: 'rgba(244,162,97,0.4)'  },
    Acuática:      { bg: '#457b9d', border: '#2a5a7a', glow: 'rgba(69,123,157,0.4)'  },
    Espectáculos:  { bg: '#6a4c93', border: '#4a2c73', glow: 'rgba(106,76,147,0.4)'  },
    default:       { bg: '#2a9d8f', border: '#1a6d5f', glow: 'rgba(42,157,143,0.4)'  },
}

const ESTADO_COLORS = {
    ACTIVA:           { node: '#22c55e', label: 'Activa'        },
    EN_MANTENIMIENTO: { node: '#f4a261', label: 'Mantenimiento' },
    CERRADA:          { node: '#e63946', label: 'Cerrada'       },
}

const TIPO_ICONOS = {
    MONTANA_RUSA:  '🎢',
    ACUATICA:      '🌊',
    SHOW:          '🎭',
    CAIDA_LIBRE:   '🪂',
    CARRUSEL:      '🎠',
    SIMULADOR:     '🚀',
    DEFAULT:       '🎡',
    ENTRADA:       '🚪',
}

function iconoPorTipo(tipo) {
    if (!tipo) return TIPO_ICONOS.DEFAULT
    const t = tipo.toUpperCase()
    for (const [key, emoji] of Object.entries(TIPO_ICONOS)) {
        if (t.includes(key.replace('_', ''))) return emoji
    }
    return TIPO_ICONOS.DEFAULT
}

// ─── Force-directed layout ────────────────────────────────────────────────────
// Separa nodos usando simulación de fuerzas cuando el backend devuelve
// coordenadas nulas/iguales (todos en 0,0 o sin posición asignada).
function useForceLayout(nodos, aristas, W, H) {
    return useMemo(() => {
        if (!nodos || nodos.length === 0) return []

        // Detectar si las coordenadas del backend son útiles.
        // Si todos los nodos tienen x=0 e y=0 (o undefined), activamos el layout.
        const todosEnCero = nodos.every(n => (!n.x && !n.y))
        const hayDuplicados = (() => {
            const posSet = new Set(nodos.map(n => `${Math.round(n.x)},${Math.round(n.y)}`))
            return posSet.size < nodos.length * 0.6 // más del 40% duplicados → layout propio
        })()

        if (!todosEnCero && !hayDuplicados) {
            // El backend ya manda coordenadas razonables → usarlas tal cual
            return nodos
        }

        // ── Inicializar posiciones en círculo para evitar singularidad ───────
        const n = nodos.length
        const cx = W / 2, cy = H / 2
        const radio = Math.min(W, H) * 0.35

        const pos = nodos.map((nodo, i) => {
            const angle = (2 * Math.PI * i) / n
            return {
                ...nodo,
                _fx: cx + radio * Math.cos(angle),
                _fy: cy + radio * Math.sin(angle),
                _vx: 0,
                _vy: 0,
            }
        })

        // ── Construir mapa de adyacencia para fuerzas de atracción ───────────
        const adyacencia = {}
        pos.forEach(p => { adyacencia[p.id] = [] })
        aristas.forEach(a => {
            const from = a.from || a.origen
            const to   = a.to   || a.destino
            if (adyacencia[from]) adyacencia[from].push(to)
            if (adyacencia[to])   adyacencia[to].push(from)
        })

        // ── Simulación de fuerzas (Fruchterman-Reingold simplificado) ────────
        const ITER       = 300
        const REPULSION  = 6000
        const ATRACCION  = 0.035
        const DAMPING    = 0.85
        const MIN_DIST   = 1
        const TARGET_LEN = Math.min(W, H) * 0.22  // distancia ideal entre nodos conectados

        for (let iter = 0; iter < ITER; iter++) {
            const temp = 1 - iter / ITER  // enfriamiento

            // Reset fuerzas
            pos.forEach(p => { p._ax = 0; p._ay = 0 })

            // Repulsión entre todos los pares
            for (let i = 0; i < pos.length; i++) {
                for (let j = i + 1; j < pos.length; j++) {
                    const dx = pos[j]._fx - pos[i]._fx
                    const dy = pos[j]._fy - pos[i]._fy
                    const dist = Math.sqrt(dx * dx + dy * dy) || MIN_DIST
                    const f = REPULSION / (dist * dist)
                    const nx = (dx / dist) * f
                    const ny = (dy / dist) * f
                    pos[i]._ax -= nx
                    pos[i]._ay -= ny
                    pos[j]._ax += nx
                    pos[j]._ay += ny
                }
            }

            // Atracción por aristas
            pos.forEach(p => {
                const vecinos = adyacencia[p.id] || []
                vecinos.forEach(vid => {
                    const v = pos.find(q => q.id === vid)
                    if (!v) return
                    const dx = v._fx - p._fx
                    const dy = v._fy - p._fy
                    const dist = Math.sqrt(dx * dx + dy * dy) || MIN_DIST
                    const delta = dist - TARGET_LEN
                    const f = ATRACCION * delta
                    p._ax += (dx / dist) * f
                    p._ay += (dy / dist) * f
                })
            })

            // Fuerza hacia el centro (gravity suave)
            pos.forEach(p => {
                p._ax += (cx - p._fx) * 0.008
                p._ay += (cy - p._fy) * 0.008
            })

            // Integrar velocidad y posición
            pos.forEach(p => {
                p._vx = (p._vx + p._ax) * DAMPING
                p._vy = (p._vy + p._ay) * DAMPING
                // Limitar velocidad máxima con temperatura
                const speed = Math.sqrt(p._vx * p._vx + p._vy * p._vy) || 1
                const maxSpeed = 12 * temp + 0.5
                if (speed > maxSpeed) {
                    p._vx = (p._vx / speed) * maxSpeed
                    p._vy = (p._vy / speed) * maxSpeed
                }
                p._fx += p._vx
                p._fy += p._vy
            })

            // Contener dentro del canvas con padding
            const PAD = 60
            pos.forEach(p => {
                p._fx = Math.max(PAD, Math.min(W - PAD, p._fx))
                p._fy = Math.max(PAD, Math.min(H - PAD, p._fy))
            })
        }

        // Mapear de vuelta a x/y (en coordenadas del SVG, sin SCALE ni offset)
        return pos.map(p => ({ ...p, x: p._fx, y: p._fy, _layout: true }))

    }, [nodos, aristas, W, H])
}

// ─── Grafo SVG ────────────────────────────────────────────────────────────────
function GrafoSVG({ nodos, aristas, nodoSeleccionado, onSelect, rutaResaltada, filtroZona }) {
    const W = 780, H = 480

    // Aplicar layout si los datos del backend no tienen coordenadas válidas
    const nodosConLayout = useForceLayout(nodos, aristas, W, H)

    // Función de conversión de coordenadas:
    // Si el layout fue aplicado, _layout=true y x/y ya son píxeles del SVG.
    // Si el backend manda coordenadas reales, aplicamos la misma lógica de escala anterior.
    const SCALE = 0.72
    const CX = W / 2, CY = H / 2
    const PAD = 60

    function toSvgX(nodo) {
        if (nodo._layout) return nodo.x
        // x viene como porcentaje 0-100 → convertir a píxeles con padding
        return PAD + ((nodo.x ?? 50) / 100) * (W - PAD * 2)
    }
    function toSvgY(nodo) {
        if (nodo._layout) return nodo.y
        // y viene como porcentaje 0-100 → convertir a píxeles con padding
        return PAD + ((nodo.y ?? 50) / 100) * (H - PAD * 2)
    }

    // Mapa id → nodo con posición calculada
    const nodoMap = useMemo(() => {
        const m = {}
        nodosConLayout.forEach(n => { m[n.id] = n })
        return m
    }, [nodosConLayout])

    const nodosFiltrados = filtroZona === 'Todas'
        ? nodosConLayout
        : nodosConLayout.filter(n => n.zona === filtroZona || n.esEntrada)

    const enRuta = new Set(rutaResaltada)

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-full"
            style={{ cursor: 'default' }}
        >
            <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
                <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%"   stopColor="rgba(42,157,143,0.04)" />
                    <stop offset="100%" stopColor="rgba(13,15,20,0)" />
                </radialGradient>
                {nodosConLayout.map(n => {
                    const zc = ZONA_COLORS[n.zona] || ZONA_COLORS.default
                    return (
                        <radialGradient key={`glow-${n.id}`} id={`glow-${n.id}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stopColor={zc.bg} stopOpacity="0.35" />
                            <stop offset="100%" stopColor={zc.bg} stopOpacity="0" />
                        </radialGradient>
                    )
                })}
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="rgba(255,255,255,0.15)" />
                </marker>
                <marker id="arrow-ruta" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#2a9d8f" />
                </marker>
            </defs>

            <rect width={W} height={H} fill="url(#grid)" rx="12" />
            <ellipse cx={CX} cy={CY} rx={260} ry={160} fill="url(#bgGrad)" />

            {/* Aristas */}
            {aristas.map((a, i) => {
                const nA = nodoMap[a.from || a.origen]
                const nB = nodoMap[a.to   || a.destino]
                if (!nA || !nB) return null

                const inFiltro = nodosFiltrados.find(n => n.id === nA.id) &&
                    nodosFiltrados.find(n => n.id === nB.id)
                if (!inFiltro) return null

                const inRuta = enRuta.has(nA.id) && enRuta.has(nB.id)
                const x1 = toSvgX(nA), y1 = toSvgY(nA)
                const x2 = toSvgX(nB), y2 = toSvgY(nB)
                const mx = (x1 + x2) / 2
                const my = (y1 + y2) / 2
                const distLabel = a.label || (a.peso ? `${a.peso}m` : '')

                return (
                    <g key={i}>
                        {inRuta && (
                            <line
                                x1={x1} y1={y1} x2={x2} y2={y2}
                                stroke="#2a9d8f" strokeWidth={6} strokeOpacity={0.2}
                            />
                        )}
                        <line
                            x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={inRuta ? '#2a9d8f' : 'rgba(255,255,255,0.12)'}
                            strokeWidth={inRuta ? 2.5 : 1.2}
                            strokeDasharray={inRuta ? '8 4' : undefined}
                            markerEnd={inRuta ? 'url(#arrow-ruta)' : 'url(#arrow)'}
                        />
                        {distLabel && (
                            <>
                                <rect x={mx - 16} y={my - 9} width={32} height={14} rx={4}
                                      fill="rgba(13,15,20,0.80)" />
                                <text x={mx} y={my + 1} textAnchor="middle" fontSize={9}
                                      fill="rgba(255,255,255,0.5)"
                                      fontFamily="JetBrains Mono, monospace">
                                    {distLabel}
                                </text>
                            </>
                        )}
                    </g>
                )
            })}

            {/* Nodos */}
            {nodosFiltrados.map(nodo => {
                const zona   = ZONA_COLORS[nodo.zona] || ZONA_COLORS.default
                const estado = ESTADO_COLORS[nodo.estado] || ESTADO_COLORS.ACTIVA
                const sel    = nodoSeleccionado?.id === nodo.id
                const inR    = enRuta.has(nodo.id)
                const r      = nodo.esEntrada ? 28 : 22
                const icono  = nodo.icono
                const svgX   = toSvgX(nodo)
                const svgY   = toSvgY(nodo)

                return (
                    <g
                        key={nodo.id}
                        transform={`translate(${svgX}, ${svgY})`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => onSelect(nodo)}
                    >
                        <circle r={r + 18} fill={`url(#glow-${nodo.id})`} opacity={sel ? 1 : 0.5} />
                        {inR && (
                            <circle r={r + 8} fill="none" stroke="#2a9d8f"
                                    strokeWidth={2} strokeOpacity={0.6} strokeDasharray="5 3" />
                        )}
                        {sel && (
                            <circle r={r + 5} fill="none" stroke={zona.bg}
                                    strokeWidth={2} strokeOpacity={0.8} />
                        )}
                        <circle
                            r={r}
                            fill={sel ? zona.bg : `${zona.bg}22`}
                            stroke={sel ? zona.bg : `${zona.bg}66`}
                            strokeWidth={sel ? 2.5 : 1.5}
                        />
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
                        <text y={5} textAnchor="middle" fontSize={nodo.esEntrada ? 18 : 14}>
                            {icono}
                        </text>
                        {(nodo.nombre || '').split(' ').reduce((lines, word) => {
                            if (lines.length === 0) return [word]
                            const last = lines[lines.length - 1]
                            if (last.length + word.length + 1 <= 10)
                                return [...lines.slice(0, -1), last + ' ' + word]
                            return [...lines, word]
                        }, []).map((line, li) => (
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
                        {((nodo.visitantesEnCola ?? nodo.contadorVisitantes ?? 0) > 0) && (
                            <g transform={`translate(${-(r - 2)}, ${-(r - 2)})`}>
                                <circle r={8} fill="#e63946" stroke="rgba(13,15,20,0.9)" strokeWidth={1} />
                                <text textAnchor="middle" y={3} fontSize={7}
                                      fill="white" fontWeight={700} fontFamily="Syne, sans-serif">
                                    {nodo.visitantesEnCola ?? nodo.contadorVisitantes ?? 0}
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
function HeroMapa({ nodos, aristas, cargando }) {
    const { parqueInfo } = useApp()
    const totalEnColas = nodos.reduce((s, n) => s + (n.visitantesEnCola ?? n.contadorVisitantes ?? 0), 0)
    const activas = nodos.filter(n => n.estado === 'ACTIVA' && !n.esEntrada).length

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-6"
            style={{
                background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))',
                border: '0.5px solid var(--c-border)',
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl"
                 style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl"
                 style={{ background: '#457b9d' }} />

            <div className="relative z-10 px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(42,157,143,0.2)', border: '0.5px solid rgba(42,157,143,0.3)' }}>
                            <Map size={16} style={{ color: '#2a9d8f' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-semibold"
                              style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>
                            Mapa interactivo
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Grafo del <span className="text-rainbow">Parque</span>
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
                        Dijkstra visual — haz clic en un nodo para ver detalles o calcular rutas.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {[
                        { label: 'Visitantes únicos', value: cargando ? '…' : (parqueInfo?.visitantesActuales ?? 0), color: '#2a9d8f', icon: Users  },
                        { label: 'En colas ahora',    value: cargando ? '…' : totalEnColas,                          color: '#e63946', icon: Users  },
                        { label: 'Activas',  value: cargando ? '…' : activas,         color: '#22c55e', icon: Activity },
                        { label: 'Senderos', value: cargando ? '…' : aristas.length,  color: '#2a9d8f', icon: Map      },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <Ico size={14} style={{ color }} />
                            <div>
                                <div className="text-base font-bold"
                                     style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
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
function PanelNodo({ nodo, aristas, nodos, onClearSelect, onAddRuta }) {
    if (!nodo) {
        return (
            <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    <Eye size={20} style={{ color: 'var(--c-muted)' }} />
                </div>
                <p className="text-sm font-semibold mb-1"
                   style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                    Selecciona un nodo
                </p>
                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                    Haz clic en cualquier atracción del mapa para ver sus detalles.
                </p>
            </div>
        )
    }

    const zona    = ZONA_COLORS[nodo.zona] || ZONA_COLORS.default
    const cola    = nodo.visitantesEnCola ?? nodo.contadorVisitantes ?? 0
    const espera  = nodo.tiempoEsperaEstimado || 0
    const pctCola = espera > 0 ? Math.min(100, Math.round((cola / 40) * 100)) : 0

    const conexiones = aristas.filter(a =>
        a.from === nodo.id || a.origen === nodo.id ||
        a.to   === nodo.id || a.destino === nodo.id
    )

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 relative overflow-hidden"
                 style={{ background: `${zona.bg}12`, borderBottom: `0.5px solid ${zona.bg}30` }}>
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-15 blur-xl"
                     style={{ background: zona.bg }} />
                <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">{nodo.icono}</span>
                            <div>
                                <h3 className="text-sm font-bold leading-tight"
                                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                    {nodo.nombre}
                                </h3>
                                <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                    {nodo.zona || 'Sin zona'}
                                </p>
                            </div>
                        </div>
                        <StatusBadge status={nodo.estado} />
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { label: 'En cola',     value: cola || '—',                                       color: '#e63946', icon: Users    },
                        { label: 'Espera',      value: espera > 0 ? `${espera} min` : '—',                color: '#f4a261', icon: Clock    },
                        { label: 'Alt. mínima', value: nodo.alturaMinima > 0 ? `${nodo.alturaMinima} cm` : 'Libre', color: '#2a9d8f', icon: Activity },
                        { label: 'Costo extra', value: nodo.costoAdicional > 0 ? `$${(nodo.costoAdicional/1000).toFixed(0)}k` : 'Incluido', color: '#6a4c93', icon: Star },
                    ].map(({ label, value, color, icon: Ico }) => (
                        <div key={label} className="rounded-xl p-3"
                             style={{ background: `${color}0d`, border: `0.5px solid ${color}22` }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Ico size={11} style={{ color }} />
                                <span className="text-xs"
                                      style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {label}
                                </span>
                            </div>
                            <div className="text-sm font-bold"
                                 style={{ fontFamily: 'var(--font-mono)', color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {nodo.estado === 'ACTIVA' && cola > 0 && (
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span style={{ color: 'var(--c-muted)' }}>Nivel de cola</span>
                            <span className="font-mono"
                                  style={{ fontFamily: 'var(--font-mono)', color: pctCola > 70 ? '#e63946' : '#f4a261' }}>
                                {pctCola}%
                            </span>
                        </div>
                        <ProgressBar
                            value={pctCola}
                            max={100}
                            color={pctCola > 70 ? '#e63946' : pctCola > 40 ? '#f4a261' : '#22c55e'}
                        />
                    </div>
                )}

                {conexiones.length > 0 && (
                    <div>
                        <p className="text-xs uppercase tracking-widest mb-2"
                           style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                            Senderos conectados
                        </p>
                        <div className="space-y-1.5">
                            {conexiones.map((a, i) => {
                                const otherId = (a.from === nodo.id || a.origen === nodo.id)
                                    ? (a.to || a.destino)
                                    : (a.from || a.origen)
                                const other = nodos.find(n => n.id === otherId)
                                const distLabel = a.label || (a.peso ? `${a.peso}m` : '')
                                return (
                                    <div key={i}
                                         className="flex items-center justify-between rounded-lg px-3 py-2"
                                         style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}>
                                        <span className="flex items-center gap-2 text-xs"
                                              style={{ color: 'var(--c-dim)' }}>
                                            <Navigation size={10} style={{ color: 'var(--c-muted)' }} />
                                            {other?.nombre || otherId}
                                        </span>
                                        {distLabel && (
                                            <span className="font-mono text-xs"
                                                  style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>
                                                {distLabel}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{ background: 'rgba(42,157,143,0.12)', color: '#2a9d8f', border: '0.5px solid rgba(42,157,143,0.25)', fontFamily: 'var(--font-display)' }}
                        onClick={() => onAddRuta(nodo)}
                    >
                        <Navigation size={12} /> Ir aquí
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Calculadora Dijkstra ─────────────────────────────────────────────────────
function CalculadoraRuta({ nodos, onRutaCalculada }) {
    const [origen,    setOrigen]    = useState('')
    const [destino,   setDestino]   = useState('')
    const [loading,   setLoading]   = useState(false)
    const [resultado, setResultado] = useState(null)
    const [error,     setError]     = useState(null)

    async function calcular() {
        if (!origen || !destino || origen === destino) return
        setLoading(true)
        setError(null)
        try {
            const res = await parqueService.getRutaOptima(origen, destino)
            const data = res.data
            const idsRuta = (data.ruta || []).map(a => a.id)
            setResultado({ data, idsRuta })
            onRutaCalculada(idsRuta)
        } catch (e) {
            setError('No se pudo calcular la ruta')
        } finally {
            setLoading(false)
        }
    }

    function limpiar() {
        setResultado(null)
        setOrigen('')
        setDestino('')
        setError(null)
        onRutaCalculada([])
    }

    const opcionesNodos = nodos.filter(n => !n.esEntrada)

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                    <Navigation size={14} style={{ color: '#6a4c93' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Ruta Dijkstra
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Se resalta en el mapa</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                <Select label="Origen" value={origen} onChange={e => setOrigen(e.target.value)}>
                    <option value="">Inicio…</option>
                    {opcionesNodos.map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                </Select>
                <Select label="Destino" value={destino} onChange={e => setDestino(e.target.value)}>
                    <option value="">Destino…</option>
                    {opcionesNodos.filter(n => n.id !== origen).map(n => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                    ))}
                </Select>

                <div className="flex gap-2">
                    <Button variant="primary" size="sm" loading={loading}
                            onClick={calcular} className="flex-1 justify-center">
                        <Crosshair size={13} /> Calcular
                    </Button>
                    {resultado && (
                        <Button variant="ghost" size="sm" onClick={limpiar}>
                            <RefreshCw size={13} />
                        </Button>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-center py-2 rounded-xl"
                       style={{ color: '#e63946', background: 'rgba(230,57,70,0.07)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                        {error}
                    </p>
                )}

                {resultado && !error && (
                    <div className="rounded-xl p-3 space-y-2"
                         style={{ background: 'rgba(42,157,143,0.07)', border: '0.5px solid rgba(42,157,143,0.2)' }}>
                        <div className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--c-muted)' }}>Pasos</span>
                            <span className="font-mono font-bold"
                                  style={{ fontFamily: 'var(--font-mono)', color: '#2a9d8f' }}>
                                {resultado.data.pasos}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--c-muted)' }}>Recorrido</span>
                            <span className="font-mono font-bold"
                                  style={{ fontFamily: 'var(--font-mono)', color: '#6a4c93' }}>
                                {resultado.data.origen} → {resultado.data.destino}
                            </span>
                        </div>
                        {resultado.data.ruta?.length > 0 && (
                            <div className="text-xs space-y-1 pt-1">
                                {resultado.data.ruta.map((paso, i) => (
                                    <div key={paso.id}
                                         className="flex items-center gap-2 px-2 py-1 rounded-lg"
                                         style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                              style={{ background: 'rgba(42,157,143,0.2)', color: '#2a9d8f', fontSize: 9 }}>
                                            {i + 1}
                                        </span>
                                        <span style={{ color: 'var(--c-muted)' }}>{paso.nombre}</span>
                                        <span className="ml-auto text-xs"
                                              style={{ color: ESTADO_COLORS[paso.estado]?.node || '#888', fontSize: 9 }}>
                                            ●
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Leyenda ──────────────────────────────────────────────────────────────────
function Leyenda({ zonas }) {
    const zonasPresentes = zonas && zonas.size > 0
        ? Object.entries(ZONA_COLORS).filter(([z]) => zonas.has(z) || z === 'default')
        : Object.entries(ZONA_COLORS).filter(([z]) => z !== 'default')

    return (
        <div className="glass rounded-2xl p-4">
            <p className="text-xs uppercase tracking-widest mb-3"
               style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                Leyenda
            </p>
            <div className="space-y-2.5">
                <div>
                    <p className="text-xs mb-2"
                       style={{ color: 'var(--c-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Zonas
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {zonasPresentes.map(([zona, c]) => (
                            <div key={zona} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ background: c.bg }} />
                                <span className="text-xs truncate"
                                      style={{ color: 'var(--c-muted)', fontSize: 10 }}>{zona}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-px" style={{ background: 'var(--c-border)' }} />
                <div>
                    <p className="text-xs mb-2"
                       style={{ color: 'var(--c-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Estado
                    </p>
                    <div className="space-y-1">
                        {Object.entries(ESTADO_COLORS).map(([estado, c]) => (
                            <div key={estado} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0"
                                      style={{ background: c.node, boxShadow: `0 0 5px ${c.node}` }} />
                                <span className="text-xs"
                                      style={{ color: 'var(--c-muted)', fontSize: 10 }}>{c.label}</span>
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
                        <span className="w-3 h-3 rounded-full flex items-center justify-center text-white"
                              style={{ background: '#e63946', fontSize: 7, fontWeight: 700 }}>N</span>
                        Visitantes en cola
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Recomendaciones ──────────────────────────────────────────────────────────
function PanelRecomendaciones({ nodos, onSelectNodo }) {
    const recomendaciones = nodos
        .filter(n => n.estado === 'ACTIVA' && !n.esEntrada)
        .sort((a, b) => (a.tiempoEsperaEstimado || 0) - (b.tiempoEsperaEstimado || 0))
        .slice(0, 3)
        .map(n => {
            const espera = n.tiempoEsperaEstimado || 0
            const cola   = n.visitantesEnCola ?? n.contadorVisitantes ?? 0
            const score  = Math.max(10, 100 - espera * 2 - cola)
            const zona   = n.zona || 'default'
            const color  = (ZONA_COLORS[zona] || ZONA_COLORS.default).bg
            const razon  = espera === 0 ? 'Sin espera' : espera < 10 ? `Cola corta (${espera} min)` : 'Baja saturación'
            return { ...n, score, color, razon }
        })

    if (recomendaciones.length === 0) return null

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                    <Shuffle size={14} style={{ color: '#e9c46a' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Sugerencias
                    </h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Menor congestión ahora</p>
                </div>
            </div>
            <div className="p-4 space-y-2">
                {recomendaciones.map(r => (
                    <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01]"
                        style={{ background: `${r.color}0a`, border: `0.5px solid ${r.color}25` }}
                        onClick={() => onSelectNodo(r)}
                    >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                            {r.icono}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate"
                               style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                {r.nombre}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{r.razon}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold"
                                 style={{ fontFamily: 'var(--font-mono)', color: r.color }}>
                                {r.score}
                            </div>
                            <div className="w-10">
                                <ProgressBar value={r.score} max={100} color={r.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Hook: carga mapa y cruza con atracciones del contexto global ─────────────
function useMapaData() {
    const { atracciones: atraccionesCtx } = useApp()

    const [nodos,    setNodos]    = useState([])
    const [aristas,  setAristas]  = useState([])
    const [cargando, setCargando] = useState(true)
    const [error,    setError]    = useState(null)

    const cargar = useCallback(async () => {
        setCargando(true)
        setError(null)
        try {
            const mapaRes  = await parqueService.getMapa()
            const mapaData = mapaRes.data

            const atraccionesMap = {}
            ;(atraccionesCtx || []).forEach(a => { atraccionesMap[a.id] = a })

            const nodosEnriquecidos = (mapaData.nodos || []).map(nodo => {
                const atraccion = atraccionesMap[nodo.id] || {}
                const esEntrada = nodo.id === 'entrada' ||
                    (nodo.nombre || '').toLowerCase().includes('entrada')
                const zona  = nodo.zona || atraccion.zona || 'default'
                const icono = esEntrada
                    ? TIPO_ICONOS.ENTRADA
                    : iconoPorTipo(atraccion.tipo || nodo.tipo)

                return {
                    id:     nodo.id,
                    x:      nodo.x    ?? nodo.posX ?? 0,
                    y:      nodo.y    ?? nodo.posY ?? 0,
                    nombre: nodo.nombre || atraccion.nombre || nodo.id,
                    zona,
                    icono,
                    esEntrada,
                    estado:               atraccion.estado               ?? nodo.estado               ?? 'ACTIVA',
                    contadorVisitantes:   atraccion.visitantesEnCola ?? atraccion.contadorVisitantes   ?? nodo.visitantes ?? 0,
                    tiempoEsperaEstimado: atraccion.tiempoEsperaEstimado ?? nodo.tiempoEsperaEstimado  ?? 0,
                    alturaMinima:         atraccion.alturaMinima         ?? nodo.alturaMinima          ?? 0,
                    costoAdicional:       atraccion.costoAdicional       ?? nodo.costoAdicional        ?? 0,
                    tipo:                 atraccion.tipo                 ?? nodo.tipo                  ?? '',
                }
            })

            setNodos(nodosEnriquecidos)
            setAristas(mapaData.aristas || [])
        } catch (e) {
            console.error('[Mapa] Error cargando datos:', e)
            setError('No se pudo cargar el mapa del parque')
        } finally {
            setCargando(false)
        }
    }, [atraccionesCtx])

    // Re-enriquecer nodos cuando el contexto actualiza atracciones sin re-fetch del mapa
    useEffect(() => {
        if (nodos.length === 0) return
        const atraccionesMap = {}
        ;(atraccionesCtx || []).forEach(a => { atraccionesMap[a.id] = a })
        setNodos(prev => prev.map(nodo => {
            const a = atraccionesMap[nodo.id]
            if (!a) return nodo
            return {
                ...nodo,
                estado:               a.estado               ?? nodo.estado,
                contadorVisitantes:   a.visitantesEnCola ?? a.contadorVisitantes ?? nodo.contadorVisitantes,
                tiempoEsperaEstimado: a.tiempoEsperaEstimado ?? nodo.tiempoEsperaEstimado,
                costoAdicional:       a.costoAdicional       ?? nodo.costoAdicional,
            }
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atraccionesCtx])

    useEffect(() => { cargar() }, [cargar])

    return { nodos, aristas, cargando, error, recargar: cargar }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Mapa() {
    const { nodos, aristas, cargando, error, recargar } = useMapaData()
    const { parqueInfo } = useApp()

    const [nodoSel,    setNodoSel]    = useState(null)
    const [rutaNodos,  setRutaNodos]  = useState([])
    const [filtroZona, setFiltroZona] = useState('Todas')
    const [zoom,       setZoom]       = useState(1)

    const zonasPresentes = new Set(nodos.map(n => n.zona).filter(Boolean))
    const zonasOpciones  = ['Todas', ...Array.from(zonasPresentes).filter(z => z !== 'default')]

    useEffect(() => {
        if (nodoSel) {
            const actualizado = nodos.find(n => n.id === nodoSel.id)
            if (actualizado) setNodoSel(actualizado)
        }
    }, [nodos])

    const statsActivas         = nodos.filter(n => n.estado === 'ACTIVA' && !n.esEntrada).length
    const statsMantenimiento   = nodos.filter(n => n.estado === 'EN_MANTENIMIENTO').length
    const statsCerradas        = nodos.filter(n => n.estado === 'CERRADA').length
    const statsTotalVisitantes = parqueInfo?.visitantesActuales ?? 0

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            <HeroMapa nodos={nodos} aristas={aristas} cargando={cargando} />

            {/* Controls bar */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
                <div className="flex items-center gap-1 rounded-xl p-1"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    {zonasOpciones.map(z => (
                        <button
                            key={z}
                            onClick={() => setFiltroZona(z)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            style={{
                                background:  filtroZona === z ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color:       filtroZona === z ? 'var(--c-text)' : 'var(--c-muted)',
                                fontFamily:  'var(--font-display)',
                                border:      filtroZona === z ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
                            }}
                        >
                            <Layers size={11} /> {z}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-1 rounded-xl p-1"
                     style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => setZoom(z => Math.min(z + 0.15, 1.8))}
                    >
                        <ZoomIn size={13} /> Zoom+
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => setZoom(z => Math.max(z - 0.15, 0.5))}
                    >
                        <ZoomOut size={13} /> Zoom-
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={() => { setZoom(1); setNodoSel(null); setRutaNodos([]) }}
                    >
                        <Maximize2 size={13} /> Reset
                    </button>
                    <button
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}
                        onClick={recargar}
                    >
                        <RefreshCw size={13} /> Actualizar
                    </button>
                </div>

                {nodoSel && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                         style={{ background: 'rgba(42,157,143,0.1)', color: '#2a9d8f', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                        <CheckCircle size={12} />
                        <span style={{ fontFamily: 'var(--font-display)' }}>
                            {nodoSel.nombre} seleccionado
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl"
                     style={{ background: 'rgba(230,57,70,0.07)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <AlertTriangle size={16} style={{ color: '#e63946' }} />
                    <span className="text-sm flex-1" style={{ color: '#e63946' }}>{error}</span>
                    <button
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{ background: 'rgba(230,57,70,0.15)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.3)' }}
                        onClick={recargar}
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {cargando && (
                <div className="mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl"
                     style={{ background: 'rgba(42,157,143,0.07)', border: '0.5px solid rgba(42,157,143,0.2)' }}>
                    <RefreshCw size={14} className="animate-spin" style={{ color: '#2a9d8f' }} />
                    <span className="text-sm" style={{ color: '#2a9d8f' }}>Cargando mapa del parque…</span>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
                {/* Grafo — 3 cols */}
                <div className="xl:col-span-3">
                    <div className="glass rounded-2xl overflow-hidden relative" style={{ height: 500 }}>
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

                        {!nodoSel && !cargando && (
                            <div
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full text-xs"
                                style={{ background: 'rgba(13,15,20,0.85)', color: 'var(--c-muted)', border: '0.5px solid var(--c-border)', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}
                            >
                                <Info size={11} />
                                Haz clic en un nodo para ver detalles
                            </div>
                        )}

                        <div
                            className="absolute top-3 right-3 text-xs font-mono px-2 py-1 rounded-lg"
                            style={{ background: 'rgba(13,15,20,0.7)', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', backdropFilter: 'blur(4px)' }}
                        >
                            {Math.round(zoom * 100)}%
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                            { label: 'Activas',          value: cargando ? '…' : statsActivas,         color: '#22c55e', icon: CheckCircle  },
                            { label: 'Mantenimiento',    value: cargando ? '…' : statsMantenimiento,   color: '#f4a261', icon: AlertTriangle },
                            { label: 'Cerradas',         value: cargando ? '…' : statsCerradas,        color: '#e63946', icon: Activity     },
                            { label: 'Visitantes únicos', value: cargando ? '…' : statsTotalVisitantes, color: '#2a9d8f', icon: Users },
                        ].map(({ label, value, color, icon: Ico }) => (
                            <div key={label} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                     style={{ background: `${color}15`, border: `0.5px solid ${color}25` }}>
                                    <Ico size={13} style={{ color }} />
                                </div>
                                <div>
                                    <div className="text-base font-bold"
                                         style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                    <div className="text-xs"
                                         style={{ color: 'var(--c-muted)', fontSize: 10 }}>{label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="xl:col-span-1 space-y-4">
                    <PanelNodo
                        nodo={nodoSel}
                        aristas={aristas}
                        nodos={nodos}
                        onClearSelect={() => setNodoSel(null)}
                        onAddRuta={(nodo) =>
                            setRutaNodos(prev =>
                                prev.includes(nodo.id) ? prev : [...prev, nodo.id]
                            )
                        }
                    />
                    <CalculadoraRuta
                        nodos={nodos}
                        onRutaCalculada={setRutaNodos}
                    />
                    <Leyenda zonas={zonasPresentes} />
                    <PanelRecomendaciones
                        nodos={nodos}
                        onSelectNodo={setNodoSel}
                    />
                </div>
            </div>
        </div>
    )
}