import { useState, useEffect, useCallback } from 'react'
import {
    AreaChart, Area, BarChart, Bar, LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts'
import {
    DollarSign, Users, Clock, Star, TrendingUp, TrendingDown,
    AlertTriangle, Zap, Activity, BarChart3, PieChart as PieIcon,
    Flame, Target, Shield, Award, ArrowUpRight, ArrowDownRight,
    RefreshCw, Calendar, Minus, CloudLightning, Wrench
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import {
    estadisticasService,
    zonaService,
    atraccionService,
    alertaService,
    reporteService,
} from '@/services/parqueService'

// ─── Paleta rainbow para recharts ─────────────────────────────────────────────
const RC = {
    red:    '#e63946',
    orange: '#f4a261',
    yellow: '#e9c46a',
    teal:   '#2a9d8f',
    blue:   '#457b9d',
    purple: '#6a4c93',
    green:  '#22c55e',
    grid:   'rgba(255,255,255,0.05)',
    text:   'rgba(255,255,255,0.35)',
}

const RAINBOW_COLORS = [RC.red, RC.orange, RC.yellow, RC.teal, RC.blue, RC.purple]

function formatPeso(n) {
    return `$${Number(n ?? 0).toLocaleString('es-CO')}`
}

// ─── Shared recharts tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
    if (!active || !payload?.length) return null
    return (
        <div className="glass-dark rounded-xl px-4 py-3 shadow-glass" style={{ minWidth: 140 }}>
            <p className="text-xs mb-2" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--c-dim)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: p.color }}>
                        {prefix}{typeof p.value === 'number' ? p.value.toLocaleString('es-CO') : p.value}{suffix}
                    </span>
                </div>
            ))}
        </div>
    )
}

const CHART_PROPS = {
    cartesianGrid: { strokeDasharray: '3 3', stroke: RC.grid, vertical: false },
    xAxis: { tick: { fill: RC.text, fontSize: 11, fontFamily: 'JetBrains Mono' }, axisLine: false, tickLine: false },
    yAxis: { tick: { fill: RC.text, fontSize: 11, fontFamily: 'JetBrains Mono' }, axisLine: false, tickLine: false, width: 45 },
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '', style = {} }) {
    return (
        <div
            className={`rounded animate-pulse ${className}`}
            style={{ background: 'rgba(255,255,255,0.06)', ...style }}
        />
    )
}

// ─── Custom hook: carga todos los datos del dashboard ─────────────────────────
function useEstadisticas() {
    const [data, setData]       = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState(null)

    const cargar = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            // Llamadas en paralelo a todos los endpoints necesarios
            const [
                resumenRes,
                jornadaRes,
                atraccionesRes,
                zonasRes,
                mantenimientoRes,
                climaticasRes,
            ] = await Promise.all([
                reporteService.getResumen(),
                reporteService.getJornada(),
                atraccionService.getAll(),
                zonaService.getAll(),
                alertaService.getMantenimiento(),
                alertaService.getClimaticas(),
            ])

            const resumen       = resumenRes.data
            const jornada       = jornadaRes.data
            const atracciones   = atraccionesRes.data       // [{id, nombre, tipo, estado, contadorVisitantes, tiempoEsperaEstimado, alturaMinima, edadMinima, costoAdicional}]
            const zonas         = zonasRes.data             // [{id, nombre, capacidadMaxima, visitantesActuales, cantidadAtracciones, estaLlena}]
            const mantenimiento = mantenimientoRes.data     // [{id, atraccion, resuelta, ...}]
            const climaticas    = climaticasRes.data        // [{id, tipo, activa, atraccionesAfectadas, ...}]

            setData({ resumen, jornada, atracciones, zonas, mantenimiento, climaticas })
        } catch (e) {
            setError(e?.message ?? 'Error al cargar estadísticas')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { cargar() }, [cargar])

    return { data, loading, error, recargar: cargar }
}

// ─── Hero analítico ───────────────────────────────────────────────────────────
function HeroEstadisticas({ resumen, jornada, loading }) {
    // Campos reales de GET /reportes/resumen y GET /reportes/jornada
    const ingresos        = resumen?.ingresosDiarios ?? jornada?.ingresosDiarios ?? 0
    const visitantesHoy   = resumen?.visitantesActuales ?? resumen?.totalVisitantes ?? 0
    const ticketsVendidos = resumen?.ticketsVendidos ?? resumen?.totalTickets ?? 0

    // Delta: si el resumen trae comparativa, úsala; si no, no mostramos delta
    const deltaIngresos   = resumen?.variacionIngresos   ?? null
    const deltaVisitantes = resumen?.variacionVisitantes ?? null

    const pills = [
        {
            label: 'Ingresos hoy',
            value: formatPeso(ingresos),
            delta: deltaIngresos != null ? `${deltaIngresos > 0 ? '+' : ''}${deltaIngresos}%` : null,
            up:    deltaIngresos >= 0,
            color: '#22c55e',
        },
        {
            label: 'Visitantes hoy',
            value: String(visitantesHoy),
            delta: deltaVisitantes != null ? `${deltaVisitantes > 0 ? '+' : ''}${deltaVisitantes}%` : null,
            up:    deltaVisitantes >= 0,
            color: '#2a9d8f',
        },
        {
            label: 'Tickets vendidos',
            value: String(ticketsVendidos),
            delta: null,
            color: '#f4a261',
        },
    ]

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    {/* Left */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.2)', border: '0.5px solid rgba(106,76,147,0.3)' }}>
                                <BarChart3 size={16} style={{ color: '#6a4c93' }} />
                            </div>
                            <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#6a4c93' }}>
                                Centro analítico
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Estadísticas <span className="text-rainbow">Operativas</span>
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                            Reportes en tiempo real — ingresos, flujo de visitantes, tiempos de espera e incidentes.
                        </p>
                        {jornada?.fecha && (
                            <p className="text-xs mt-2" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                                Jornada: {jornada.fecha}
                            </p>
                        )}
                    </div>

                    {/* Right — KPI pills */}
                    <div className="flex flex-wrap gap-3">
                        {loading
                            ? [1, 2, 3].map(k => <Skeleton key={k} style={{ width: 140, height: 68 }} className="rounded-xl" />)
                            : pills.map(({ label, value, delta, up, color }) => (
                                <div key={label} className="glass rounded-xl px-5 py-3">
                                    <div className="text-xs mb-1" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{value}</span>
                                        {delta && (
                                            <span className="flex items-center gap-0.5 text-xs pb-0.5 font-semibold" style={{ color }}>
                                                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                {delta}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── KPIs rápidos ─────────────────────────────────────────────────────────────
// Campos reales: resumen.ingresosDiarios, resumen.totalTickets / ticketsVendidos,
//                atracciones[].tiempoEsperaEstimado (promedio), jornada.alertasMantenimiento.size
function KPIsRapidos({ resumen, jornada, atracciones, loading }) {
    const ingresos = resumen?.ingresosDiarios ?? jornada?.ingresosDiarios ?? 0

    // Promedio de tiempos de espera de atracciones abiertas
    const abiertasConEspera = (atracciones ?? []).filter(a => a.estado === 'ABIERTA' && a.tiempoEsperaEstimado > 0)
    const promedioEspera = abiertasConEspera.length > 0
        ? Math.round(abiertasConEspera.reduce((s, a) => s + a.tiempoEsperaEstimado, 0) / abiertasConEspera.length)
        : 0

    // Total alertas de mantenimiento (campo real del reporte)
    const totalMantenimiento = jornada?.alertasMantenimiento ?? 0

    // Tickets vendidos
    const tickets = resumen?.ticketsVendidos ?? resumen?.totalTickets ?? 0

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(k => <Skeleton key={k} style={{ height: 96 }} className="rounded-2xl" />)}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
                label="Ingresos totales"
                value={formatPeso(ingresos)}
                sub="Jornada actual"
                accent="#22c55e"
                icon={DollarSign}
                className="animate-fade-up-delay-1"
            />
            <StatCard
                label="Tickets vendidos"
                value={String(tickets)}
                sub="Entradas de hoy"
                accent="#e9c46a"
                icon={Zap}
                className="animate-fade-up-delay-2"
            />
            <StatCard
                label="Promedio espera"
                value={`${promedioEspera} min`}
                sub={`${abiertasConEspera.length} atracciones abiertas`}
                accent="#f4a261"
                icon={Clock}
                className="animate-fade-up-delay-3"
            />
            <StatCard
                label="Alertas activas"
                value={String(totalMantenimiento)}
                sub="Mantenimiento"
                accent="#e63946"
                icon={AlertTriangle}
                className="animate-fade-up-delay-4"
            />
        </div>
    )
}

// ─── Gráfico 1: Ingresos acumulados (snapshot real)
// El backend no tiene ingresos por hora — mostramos el ingreso total del reporte
// y los ingresos acumulados por zona (visitantesActuales × costoPromedio estimado)
function GraficoIngresos({ zonas, resumen, jornada, loading }) {
    // Construimos barras por zona con sus visitantes reales
    const dataZonas = (zonas ?? []).map((z, i) => ({
        zona: z.nombre,
        visitantes: z.visitantesActuales ?? 0,
        capacidad:  z.capacidadMaxima ?? 0,
        color:      RAINBOW_COLORS[i % RAINBOW_COLORS.length],
    }))

    const ingresoTotal = resumen?.ingresosDiarios ?? jornada?.ingresosDiarios ?? 0

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.22)' }}>
                        <DollarSign size={15} style={{ color: '#22c55e' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Visitantes por zona</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                            Ocupación actual · Ingresos totales: <span style={{ color: '#22c55e' }}>{formatPeso(ingresoTotal)}</span>
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
                {loading
                    ? <Skeleton style={{ height: '100%' }} />
                    : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataZonas} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid {...CHART_PROPS.cartesianGrid} />
                                <XAxis dataKey="zona" {...CHART_PROPS.xAxis} />
                                <YAxis {...CHART_PROPS.yAxis} />
                                <Tooltip content={<ChartTooltip suffix=" visitantes" />} />
                                <Bar dataKey="visitantes" name="Visitantes" radius={[6, 6, 0, 0]}>
                                    {dataZonas.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                                    ))}
                                </Bar>
                                <Bar dataKey="capacidad" name="Capacidad máx." radius={[6, 6, 0, 0]} fill="rgba(255,255,255,0.06)" />
                            </BarChart>
                        </ResponsiveContainer>
                    )
                }
            </div>
        </div>
    )
}

// ─── Gráfico 2: Atracciones más visitadas ────────────────────────────────────
// Campos reales: atracciones[].contadorVisitantes, .nombre, .tiempoEsperaEstimado
function GraficoAtracciones({ atracciones, loading }) {
    // Ordenar por visitas descendente y tomar top 6
    const top6 = [...(atracciones ?? [])]
        .sort((a, b) => (b.contadorVisitantes ?? 0) - (a.contadorVisitantes ?? 0))
        .slice(0, 6)
        .map((a, i) => ({
            nombre:  a.nombre,
            visitas: a.contadorVisitantes ?? 0,
            espera:  a.tiempoEsperaEstimado ?? 0,
            color:   RAINBOW_COLORS[i % RAINBOW_COLORS.length],
        }))

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.15)', border: '0.5px solid rgba(244,162,97,0.25)' }}>
                        <Activity size={15} style={{ color: '#f4a261' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Atracciones más visitadas</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Visitas acumuladas hoy</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
                {loading
                    ? <Skeleton style={{ height: '100%' }} />
                    : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={top6} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid {...CHART_PROPS.cartesianGrid} horizontal={false} vertical />
                                <XAxis type="number" {...CHART_PROPS.xAxis} />
                                <YAxis type="category" dataKey="nombre" width={130} tick={{ fill: RC.text, fontSize: 10, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip suffix=" visitas" />} />
                                <Bar dataKey="visitas" name="Visitas" radius={[0, 6, 6, 0]}>
                                    {top6.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} fillOpacity={entry.visitas > 0 ? 0.85 : 0.2} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )
                }
            </div>
        </div>
    )
}

// ─── Gráfico 3: Tiempos de espera actuales (snapshot) ───────────────────────
// Campos reales: atracciones[].tiempoEsperaEstimado, .nombre, .estado
function GraficoTiemposEspera({ atracciones, loading }) {
    // Top 8 atracciones abiertas con mayor tiempo de espera
    const conEspera = [...(atracciones ?? [])]
        .filter(a => a.estado === 'ABIERTA')
        .sort((a, b) => (b.tiempoEsperaEstimado ?? 0) - (a.tiempoEsperaEstimado ?? 0))
        .slice(0, 8)
        .map((a, i) => ({
            nombre:  a.nombre.length > 16 ? a.nombre.slice(0, 14) + '…' : a.nombre,
            espera:  a.tiempoEsperaEstimado ?? 0,
            color:   RAINBOW_COLORS[i % RAINBOW_COLORS.length],
        }))

    const umbral = 20 // minutos — umbral operacional

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.22)' }}>
                        <Clock size={15} style={{ color: '#e63946' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Tiempos de espera actuales</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Atracciones abiertas — snapshot en tiempo real</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
                {loading
                    ? <Skeleton style={{ height: '100%' }} />
                    : conEspera.length === 0
                        ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Sin atracciones abiertas</p>
                            </div>
                        )
                        : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={conEspera} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid {...CHART_PROPS.cartesianGrid} horizontal={false} vertical />
                                    <XAxis type="number" tickFormatter={v => `${v}m`} {...CHART_PROPS.xAxis} />
                                    <YAxis type="category" dataKey="nombre" width={120} tick={{ fill: RC.text, fontSize: 10, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip suffix=" min" />} />
                                    <ReferenceLine x={umbral} stroke={RC.red} strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: `${umbral}m`, fill: RC.red, fontSize: 10 }} />
                                    <Bar dataKey="espera" name="Espera (min)" radius={[0, 6, 6, 0]}>
                                        {conEspera.map((entry, i) => (
                                            <Cell key={i} fill={entry.espera > umbral ? RC.red : entry.color} fillOpacity={0.85} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )
                }
            </div>
        </div>
    )
}

// ─── Gráfico 4: Distribución de estados de atracciones (reemplaza Tickets Pie)
// Campos reales: atracciones[].estado (ABIERTA / CERRADA / MANTENIMIENTO / etc.)
function GraficoEstadosAtracciones({ atracciones, loading }) {
    const RADIAN = Math.PI / 180

    // Agrupar atracciones por estado
    const conteo = (atracciones ?? []).reduce((acc, a) => {
        const estado = a.estado ?? 'DESCONOCIDO'
        acc[estado] = (acc[estado] ?? 0) + 1
        return acc
    }, {})

    const ESTADO_COLORES = {
        ABIERTA:       RC.green,
        CERRADA:       RC.blue,
        MANTENIMIENTO: RC.yellow,
        SUSPENDIDA:    RC.red,
        DESCONOCIDO:   RC.text,
    }

    const pieData = Object.entries(conteo).map(([estado, count]) => ({
        name:  estado.charAt(0) + estado.slice(1).toLowerCase(),
        value: count,
        color: ESTADO_COLORES[estado] ?? RC.purple,
    }))

    const total = pieData.reduce((s, p) => s + p.value, 0)

    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.08) return null
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fontFamily="Syne, sans-serif">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
    }

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                        <PieIcon size={15} style={{ color: '#e9c46a' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Estado de atracciones</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Distribución por estado operacional</p>
                    </div>
                </div>
            </div>
            <div className="p-4 flex items-center gap-6">
                {loading
                    ? <Skeleton style={{ height: 200, width: '100%' }} className="rounded-xl" />
                    : (
                        <>
                            <div style={{ height: 200, width: 200, flexShrink: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                             paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel}>
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} stroke="transparent" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<ChartTooltip suffix=" atracciones" />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 space-y-3">
                                {pieData.map((t) => (
                                    <div key={t.name}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                                                <span style={{ color: 'var(--c-dim)' }}>{t.name}</span>
                                            </span>
                                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: t.color }}>
                                                {t.value}
                                            </span>
                                        </div>
                                        <ProgressBar value={t.value} max={total} color={t.color} />
                                    </div>
                                ))}
                                <div className="pt-2 border-t" style={{ borderColor: 'var(--c-border)' }}>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Total {total} atracciones registradas</p>
                                </div>
                            </div>
                        </>
                    )
                }
            </div>
        </div>
    )
}

// ─── Gráfico 5: Ocupación por zona (reemplaza tendencia semanal DEMO) ─────────
// Campos reales: zonas[].visitantesActuales, .capacidadMaxima, .nombre, .cantidadAtracciones
function GraficoOcupacionZonas({ zonas, loading }) {
    const dataZonas = (zonas ?? []).map((z, i) => ({
        zona:        z.nombre,
        visitantes:  z.visitantesActuales ?? 0,
        capacidad:   z.capacidadMaxima ?? 0,
        atracciones: z.cantidadAtracciones ?? 0,
        ocupacion:   z.capacidadMaxima > 0
            ? Math.round(((z.visitantesActuales ?? 0) / z.capacidadMaxima) * 100)
            : 0,
        llena:       z.estaLlena ?? false,
        color:       RAINBOW_COLORS[i % RAINBOW_COLORS.length],
    }))

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                        <Calendar size={15} style={{ color: '#457b9d' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Ocupación por zona</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Visitantes actuales vs capacidad máxima</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 240 }}>
                {loading
                    ? <Skeleton style={{ height: '100%' }} />
                    : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataZonas} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                                <CartesianGrid {...CHART_PROPS.cartesianGrid} />
                                <XAxis dataKey="zona" {...CHART_PROPS.xAxis} />
                                <YAxis {...CHART_PROPS.yAxis} />
                                <Tooltip content={<ChartTooltip suffix=" personas" />} />
                                <Bar dataKey="capacidad"  name="Capacidad máx." radius={[4, 4, 0, 0]} fill="rgba(255,255,255,0.07)" />
                                <Bar dataKey="visitantes" name="Visitantes actuales" radius={[4, 4, 0, 0]}>
                                    {dataZonas.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} fillOpacity={entry.llena ? 1 : 0.75} />
                                    ))}
                                </Bar>
                                <Legend formatter={v => <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>{v}</span>} />
                            </BarChart>
                        </ResponsiveContainer>
                    )
                }
            </div>
        </div>
    )
}

// ─── Gráfico 6: Radar rendimiento por zona ─────────────────────────────────────
// Campos reales: zonas[].visitantesActuales, .capacidadMaxima, .cantidadAtracciones
// Métricas calculadas desde datos reales
function GraficoRadar({ zonas, atracciones, loading }) {
    // Construir métricas normalizadas por zona
    const maxVisitantes = Math.max(...(zonas ?? []).map(z => z.visitantesActuales ?? 0), 1)
    const maxCapacidad  = Math.max(...(zonas ?? []).map(z => z.capacidadMaxima ?? 0), 1)
    const maxAtracciones= Math.max(...(zonas ?? []).map(z => z.cantidadAtracciones ?? 0), 1)

    // Para cada zona, calcular % de atracciones abiertas
    const atraccionesPorZona = (atracciones ?? []).reduce((acc, a) => {
        // El backend no retorna idZona en atracciones, pero podemos usar el total
        return acc
    }, {})

    const radarData = [
        {
            metric: 'Ocupación',
            ...(zonas ?? []).reduce((acc, z) => ({
                ...acc,
                [z.nombre]: z.capacidadMaxima > 0
                    ? Math.round(((z.visitantesActuales ?? 0) / z.capacidadMaxima) * 100)
                    : 0,
            }), {}),
        },
        {
            metric: 'Visitantes',
            ...(zonas ?? []).reduce((acc, z) => ({
                ...acc,
                [z.nombre]: Math.round(((z.visitantesActuales ?? 0) / maxVisitantes) * 100),
            }), {}),
        },
        {
            metric: 'Atracciones',
            ...(zonas ?? []).reduce((acc, z) => ({
                ...acc,
                [z.nombre]: Math.round(((z.cantidadAtracciones ?? 0) / maxAtracciones) * 100),
            }), {}),
        },
        {
            metric: 'Capacidad',
            ...(zonas ?? []).reduce((acc, z) => ({
                ...acc,
                [z.nombre]: Math.round(((z.capacidadMaxima ?? 0) / maxCapacidad) * 100),
            }), {}),
        },
        {
            metric: 'Disponibilidad',
            ...(zonas ?? []).reduce((acc, z) => ({
                ...acc,
                [z.nombre]: z.estaLlena ? 0 : 100,
            }), {}),
        },
    ]

    const zonaColors = [RC.orange, RC.blue, RC.purple, RC.teal, RC.red]

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                        <Target size={15} style={{ color: '#2a9d8f' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Rendimiento por zona</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Radar multidimensional</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 280 }}>
                {loading
                    ? <Skeleton style={{ height: '100%' }} />
                    : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                                <PolarGrid stroke={RC.grid} />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: RC.text, fontSize: 11, fontFamily: 'var(--font-body)' }} />
                                {(zonas ?? []).map((z, i) => (
                                    <Radar
                                        key={z.id}
                                        name={z.nombre}
                                        dataKey={z.nombre}
                                        stroke={zonaColors[i % zonaColors.length]}
                                        fill={zonaColors[i % zonaColors.length]}
                                        fillOpacity={0.13}
                                        strokeWidth={1.5}
                                    />
                                ))}
                                <Legend formatter={v => <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>{v}</span>} />
                                <Tooltip content={<ChartTooltip suffix="%" />} />
                            </RadarChart>
                        </ResponsiveContainer>
                    )
                }
            </div>
        </div>
    )
}

// ─── Alertas estadísticas (generadas desde datos reales) ─────────────────────
// Fuentes reales: atracciones con cola/espera alta, zonas llenas, alertas mantenimiento/clima
function AlertasEstadisticas({ atracciones, zonas, mantenimiento, climaticas, loading }) {
    if (loading) {
        return (
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                    <Skeleton style={{ height: 20, width: '60%' }} />
                </div>
                <div className="p-4 space-y-2">
                    {[1, 2, 3].map(k => <Skeleton key={k} style={{ height: 56 }} className="rounded-xl" />)}
                </div>
            </div>
        )
    }

    const alertas = []

        // 1. Alertas climáticas activas
    ;(climaticas ?? [])
        .filter(c => c.activa)
        .forEach(c => {
            alertas.push({
                icono: CloudLightning,
                color: '#e63946',
                msg:   `Alerta climática activa: ${c.tipo?.replace('_', ' ') ?? 'Clima'} — atracciones afectadas: ${c.atraccionesAfectadas ?? 0}`,
                badge: 'Clima',
            })
        })

    // 2. Atracciones con espera superior al umbral (20 min)
    ;(atracciones ?? [])
        .filter(a => a.tiempoEsperaEstimado > 20 && a.estado === 'ABIERTA')
        .slice(0, 2)
        .forEach(a => {
            alertas.push({
                icono: Flame,
                color: '#f4a261',
                msg:   `${a.nombre}: ${a.tiempoEsperaEstimado} min de espera — umbral de 20 min superado.`,
                badge: 'Alta demanda',
            })
        })

    // 3. Zonas a más del 80% de aforo
    ;(zonas ?? [])
        .filter(z => z.capacidadMaxima > 0 && (z.visitantesActuales / z.capacidadMaxima) >= 0.8)
        .forEach(z => {
            const pct = Math.round((z.visitantesActuales / z.capacidadMaxima) * 100)
            alertas.push({
                icono: AlertTriangle,
                color: '#e9c46a',
                msg:   `${z.nombre} al ${pct}% de aforo${z.estaLlena ? ' — acceso suspendido.' : ' — monitorear.'}`,
                badge: z.estaLlena ? 'Llena' : 'Monitorear',
            })
        })

    // 4. Alertas de mantenimiento pendientes
    const pendientes = (mantenimiento ?? []).filter(m => !m.resuelta)
    if (pendientes.length > 0) {
        alertas.push({
            icono: Wrench,
            color: '#6a4c93',
            msg:   `${pendientes.length} alerta${pendientes.length > 1 ? 's' : ''} de mantenimiento sin resolver.`,
            badge: 'Mantenimiento',
        })
    }

    // 5. Sin alertas
    if (alertas.length === 0) {
        alertas.push({
            icono: TrendingUp,
            color: '#2a9d8f',
            msg:   'Sin anomalías detectadas. Operación normal.',
            badge: 'OK',
        })
    }

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.22)' }}>
                    <AlertTriangle size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Alertas estadísticas</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Anomalías y tendencias detectadas</p>
                </div>
            </div>
            <div className="p-4 space-y-2">
                {alertas.slice(0, 5).map((a, i) => {
                    const Ico = a.icono
                    return (
                        <div key={i} className="flex items-start gap-3 rounded-xl p-3"
                             style={{ background: `${a.color}08`, border: `0.5px solid ${a.color}25` }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                 style={{ background: `${a.color}18` }}>
                                <Ico size={13} style={{ color: a.color }} />
                            </div>
                            <p className="text-xs flex-1 leading-relaxed" style={{ color: 'var(--c-dim)', fontFamily: 'var(--font-body)' }}>
                                {a.msg}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-semibold"
                                  style={{ background: `${a.color}18`, color: a.color, border: `0.5px solid ${a.color}30`, fontFamily: 'var(--font-display)' }}>
                                {a.badge}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Panel rendimiento por zona ────────────────────────────────────────────────
// Campos reales: zonas[].nombre, .visitantesActuales, .capacidadMaxima, .cantidadAtracciones, .estaLlena
function RendimientoZonas({ zonas, loading }) {
    const ICONOS_ZONA = ['🎢', '🌊', '🎭', '🎡', '🏄']

    if (loading) {
        return (
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b"><Skeleton style={{ height: 20, width: '50%' }} /></div>
                <div className="p-5 space-y-5">
                    {[1, 2, 3].map(k => <Skeleton key={k} style={{ height: 72 }} className="rounded-xl" />)}
                </div>
            </div>
        )
    }

    const zonaColors = [RC.orange, RC.blue, RC.purple, RC.teal, RC.red]

    const data = (zonas ?? []).map((z, i) => {
        const ocupacion = z.capacidadMaxima > 0
            ? Math.round(((z.visitantesActuales ?? 0) / z.capacidadMaxima) * 100)
            : 0
        // "eficiencia" operacional: % de atracciones disponibles × ocupación
        // Sin más datos reales, usamos ocupación como métrica directa
        return {
            zona:        z.nombre,
            visitantes:  z.visitantesActuales ?? 0,
            capacidad:   z.capacidadMaxima ?? 0,
            atracciones: z.cantidadAtracciones ?? 0,
            ocupacion,
            llena:       z.estaLlena ?? false,
            color:       zonaColors[i % zonaColors.length],
            icono:       ICONOS_ZONA[i % ICONOS_ZONA.length],
        }
    })

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                    <Award size={15} style={{ color: '#457b9d' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Rendimiento por zona</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Ocupación y atracciones activas</p>
                </div>
            </div>
            <div className="p-5 space-y-5">
                {data.map((z) => (
                    <div key={z.zona}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{z.icono}</span>
                                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{z.zona}</span>
                                {z.llena && (
                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                          style={{ background: `${RC.red}20`, color: RC.red, border: `0.5px solid ${RC.red}30` }}>
                                        LLENA
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: z.color }}>
                                {z.visitantes} / {z.capacidad}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: 'var(--c-muted)' }}>Ocupación</span>
                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: z.color }}>{z.ocupacion}%</span>
                                </div>
                                <ProgressBar value={z.ocupacion} max={100} color={z.color} />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span style={{ color: 'var(--c-muted)' }}>Atracciones</span>
                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: '#22c55e' }}>{z.atracciones}</span>
                                </div>
                                <ProgressBar value={z.atracciones} max={Math.max(...(zonas ?? []).map(zz => zz.cantidadAtracciones ?? 0), 1)} color="#22c55e" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Tabla cierres por clima ──────────────────────────────────────────────────
// Campos reales: alertaClimatica.tipo, .activa, .atraccionesAfectadas (size), .id
function TablaCierresClima({ climaticas, loading }) {
    if (loading) {
        return (
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b"><Skeleton style={{ height: 20, width: '50%' }} /></div>
                <div className="p-4 space-y-2">
                    {[1, 2].map(k => <Skeleton key={k} style={{ height: 40 }} className="rounded" />)}
                </div>
            </div>
        )
    }

    const cierres = (climaticas ?? [])
        .map(c => ({
            tipo:         c.tipo?.replace(/_/g, ' ') ?? '—',
            atraccionesN: c.atraccionesAfectadas ?? 0,
            activa:       c.activa ?? false,
            id:           c.id,
        }))

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                    <Activity size={15} style={{ color: '#e9c46a' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Cierres por clima</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Historial de alertas meteorológicas</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                {cierres.length === 0
                    ? (
                        <div className="p-6 text-center">
                            <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Sin alertas climáticas registradas</p>
                        </div>
                    )
                    : (
                        <table className="tp-table">
                            <thead>
                            <tr>
                                <th>Tipo</th>
                                <th>Atracciones afectadas</th>
                                <th>Estado</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cierres.map((c, i) => (
                                <tr key={c.id ?? i}>
                                    <td><span className="text-sm" style={{ color: 'var(--c-text)' }}>{c.tipo}</span></td>
                                    <td>
                                            <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)' }}>
                                                {c.atraccionesN} atracción{c.atraccionesN !== 1 ? 'es' : ''}
                                            </span>
                                    </td>
                                    <td>
                                        <Badge variant={c.activa ? 'pending' : 'resolved'} dot>
                                            {c.activa ? 'Activa' : 'Resuelta'}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )
                }
            </div>
        </div>
    )
}

// ─── Incidentes por atracción (desde alertas de mantenimiento reales) ─────────
// Campos reales: alertaMantenimiento.atraccion (nombre), .resuelta
function IncidentesPorAtraccion({ mantenimiento, loading }) {
    if (loading) {
        return (
            <div className="glass rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b"><Skeleton style={{ height: 20, width: '60%' }} /></div>
                <div className="p-5 space-y-3">
                    {[1, 2, 3].map(k => <Skeleton key={k} style={{ height: 36 }} className="rounded" />)}
                </div>
            </div>
        )
    }

    // Agrupar alertas de mantenimiento por atracción
    const conteo = (mantenimiento ?? []).reduce((acc, m) => {
        const nombre = m.atraccion ?? m.idAtraccion ?? 'Desconocida'
        acc[nombre] = (acc[nombre] ?? 0) + 1
        return acc
    }, {})

    const incidentes = Object.entries(conteo)
        .map(([atraccion, n], i) => ({
            atraccion,
            incidentes: n,
            color: RAINBOW_COLORS[i % RAINBOW_COLORS.length],
        }))
        .sort((a, b) => b.incidentes - a.incidentes)
        .slice(0, 6)

    const max = Math.max(...incidentes.map(i => i.incidentes), 1)

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.22)' }}>
                    <Flame size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Atracciones con más incidentes</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Histórico de alertas de mantenimiento</p>
                </div>
            </div>
            <div className="p-5 space-y-3">
                {incidentes.length === 0
                    ? (
                        <div className="text-center py-4">
                            <p className="text-sm" style={{ color: 'var(--c-muted)' }}>Sin alertas de mantenimiento registradas</p>
                        </div>
                    )
                    : incidentes.map((item, i) => (
                        <div key={item.atraccion} className="flex items-center gap-4">
                            <span
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{ background: `${item.color}20`, color: item.color, fontFamily: 'var(--font-display)' }}
                            >
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="truncate" style={{ color: 'var(--c-dim)' }}>{item.atraccion}</span>
                                    <span className="font-mono font-bold ml-2 flex-shrink-0" style={{ fontFamily: 'var(--font-mono)', color: item.color }}>
                                        {item.incidentes} inc.
                                    </span>
                                </div>
                                <ProgressBar value={item.incidentes} max={max} color={item.color} />
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Estadisticas() {
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const { data, loading, error, recargar } = useEstadisticas()
    const [refreshing, setRefreshing]  = useState(false)

    async function handleRefresh() {
        setRefreshing(true)
        await recargar()
        setLastUpdate(new Date())
        setRefreshing(false)
    }

    const { resumen, jornada, atracciones, zonas, mantenimiento, climaticas } = data ?? {}

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>

            {/* Top bar */}
            <div className="flex items-center justify-between mb-2">
                <div />
                <div className="flex items-center gap-3">
                    {error && (
                        <span className="text-xs font-mono" style={{ color: RC.red, fontFamily: 'var(--font-mono)' }}>
                            Error: {error}
                        </span>
                    )}
                    <span className="text-xs font-mono" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                        Actualizado: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button variant="ghost" size="sm" loading={refreshing} onClick={handleRefresh}>
                        <RefreshCw size={13} /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Hero */}
            <HeroEstadisticas resumen={resumen} jornada={jornada} loading={loading} />

            {/* KPIs */}
            <KPIsRapidos resumen={resumen} jornada={jornada} atracciones={atracciones} loading={loading} />

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* Main charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <GraficoIngresos   zonas={zonas} resumen={resumen} jornada={jornada} loading={loading} />
                <GraficoAtracciones atracciones={atracciones} loading={loading} />
                <GraficoTiemposEspera atracciones={atracciones} loading={loading} />
                <GraficoEstadosAtracciones atracciones={atracciones} loading={loading} />
            </div>

            {/* Full-width zona chart */}
            <div className="mb-6">
                <GraficoOcupacionZonas zonas={zonas} loading={loading} />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <GraficoRadar      zonas={zonas} atracciones={atracciones} loading={loading} />
                <AlertasEstadisticas
                    atracciones={atracciones}
                    zonas={zonas}
                    mantenimiento={mantenimiento}
                    climaticas={climaticas}
                    loading={loading}
                />
                <RendimientoZonas  zonas={zonas} loading={loading} />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TablaCierresClima    climaticas={climaticas} loading={loading} />
                <IncidentesPorAtraccion mantenimiento={mantenimiento} loading={loading} />
            </div>
        </div>
    )
}