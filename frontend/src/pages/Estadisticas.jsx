import { useState, useEffect } from 'react'
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
    RefreshCw, Calendar, Minus
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { estadisticasService } from '@/services/parqueService'

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

// ─── Demo data ────────────────────────────────────────────────────────────────
const INGRESOS_HORA = [
    { hora: '08:00', hoy: 1200,  ayer: 950  },
    { hora: '09:00', hoy: 2800,  ayer: 2100 },
    { hora: '10:00', hoy: 4600,  ayer: 3800 },
    { hora: '11:00', hoy: 6200,  ayer: 5100 },
    { hora: '12:00', hoy: 7800,  ayer: 6400 },
    { hora: '13:00', hoy: 8900,  ayer: 7200 },
    { hora: '14:00', hoy: 10200, ayer: 8800 },
    { hora: '15:00', hoy: 11500, ayer: 9600 },
    { hora: '16:00', hoy: 12450, ayer: 10200},
]

const VISITANTES_ZONA = [
    { zona: 'Aventura',     visitantes: 312, capacidad: 600, ayer: 280 },
    { zona: 'Acuática',     visitantes: 289, capacidad: 500, ayer: 310 },
    { zona: 'Espectáculos', visitantes: 246, capacidad: 900, ayer: 190 },
]

const ATRACCIONES_POPULARES = [
    { nombre: 'Montaña Rusa X',   visitas: 234, color: RC.orange, espera: 18 },
    { nombre: 'Show Holográfico', visitas: 198, color: RC.purple, espera: 30 },
    { nombre: 'Río Salvaje',      visitas: 176, color: RC.blue,   espera: 14 },
    { nombre: 'Free Fall 360',    visitas: 143, color: RC.teal,   espera: 9  },
    { nombre: 'Ola Gigante',      visitas: 0,   color: RC.red,    espera: 0  },
    { nombre: 'Torre del Terror', visitas: 0,   color: RC.yellow, espera: 0  },
]

const TIEMPOS_ESPERA_HORA = [
    { hora: '08:00', montana: 5,  rio: 3,  show: 8  },
    { hora: '09:00', montana: 8,  rio: 6,  show: 12 },
    { hora: '10:00', montana: 12, rio: 9,  show: 18 },
    { hora: '11:00', montana: 16, rio: 12, show: 24 },
    { hora: '12:00', montana: 20, rio: 15, show: 28 },
    { hora: '13:00', montana: 18, rio: 13, show: 32 },
    { hora: '14:00', montana: 21, rio: 16, show: 35 },
    { hora: '15:00', montana: 19, rio: 14, show: 30 },
    { hora: '16:00', montana: 18, rio: 14, show: 30 },
]

const TICKETS_BREAKDOWN = [
    { name: 'FastPass', value: 38, color: RC.yellow },
    { name: 'General',  value: 45, color: RC.blue   },
    { name: 'Familiar', value: 17, color: RC.purple  },
]

const RADAR_DATA = [
    { metric: 'Ocupación',    aventura: 52, acuatica: 58, espectaculos: 27 },
    { metric: 'Ingresos',     aventura: 74, acuatica: 61, espectaculos: 45 },
    { metric: 'Satisfacción', aventura: 88, acuatica: 79, espectaculos: 92 },
    { metric: 'Eficiencia',   aventura: 66, acuatica: 73, espectaculos: 80 },
    { metric: 'Seguridad',    aventura: 95, acuatica: 90, espectaculos: 97 },
]

const SEMANA = [
    { dia: 'Lun', visitantes: 620,  ingresos: 8200  },
    { dia: 'Mar', visitantes: 750,  ingresos: 9800  },
    { dia: 'Mié', visitantes: 580,  ingresos: 7600  },
    { dia: 'Jue', visitantes: 810,  ingresos: 10600 },
    { dia: 'Vie', visitantes: 940,  ingresos: 12100 },
    { dia: 'Sáb', visitantes: 1200, ingresos: 15800 },
    { dia: 'Hoy', visitantes: 847,  ingresos: 12450 },
]

const INCIDENTES = [
    { atraccion: 'Torre del Terror', incidentes: 3, color: RC.red    },
    { atraccion: 'Ola Gigante',      incidentes: 2, color: RC.orange },
    { atraccion: 'Montaña Rusa X',   incidentes: 1, color: RC.yellow },
    { atraccion: 'Río Salvaje',      incidentes: 1, color: RC.blue   },
]

const CIERRES_CLIMA = [
    { tipo: 'Tormenta eléctrica', fecha: '14:32', atracciones: 'Montaña Rusa X, Free Fall 360', activa: true  },
    { tipo: 'Lluvia fuerte',      fecha: '11:15', atracciones: 'Río Salvaje',                   activa: false },
]

function formatPeso(n) {
    return `$${Number(n).toLocaleString('es-CO')}`
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

// ─── Hero analítico ───────────────────────────────────────────────────────────
function HeroEstadisticas() {
    const hoyIngresos = 12450
    const ayerIngresos = 10200
    const deltaIngresos = Math.round(((hoyIngresos - ayerIngresos) / ayerIngresos) * 100)

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
                    </div>

                    {/* Right — KPI pills */}
                    <div className="flex flex-wrap gap-3">
                        {[
                            { label: 'Ingresos hoy',    value: formatPeso(hoyIngresos), delta: `+${deltaIngresos}%`, up: true,  color: '#22c55e' },
                            { label: 'Visitantes hoy',  value: '847',                   delta: '+12%',               up: true,  color: '#2a9d8f' },
                            { label: 'Tickets vendidos',value: '312',                   delta: '-3%',                up: false, color: '#f4a261' },
                        ].map(({ label, value, delta, up, color }) => (
                            <div key={label} className="glass rounded-xl px-5 py-3">
                                <div className="text-xs mb-1" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-display)' }}>{label}</div>
                                <div className="flex items-end gap-2">
                                    <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{value}</span>
                                    <span className="flex items-center gap-0.5 text-xs pb-0.5 font-semibold" style={{ color }}>
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                        {delta}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── KPIs rápidos ─────────────────────────────────────────────────────────────
function KPIsRapidos() {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ingresos totales"   value={formatPeso(12450)} sub="+22% vs ayer"          accent="#22c55e" icon={DollarSign}  className="animate-fade-up-delay-1" />
            <StatCard label="Tickets vendidos"   value="312"               sub="38% FastPass"           accent="#e9c46a" icon={Zap}         className="animate-fade-up-delay-2" />
            <StatCard label="Promedio espera"    value="18 min"            sub="Todas las atracciones"  accent="#f4a261" icon={Clock}       className="animate-fade-up-delay-3" />
            <StatCard label="Satisfacción"       value="91%"               sub="Basado en visitas"      accent="#6a4c93" icon={Star}        className="animate-fade-up-delay-4" />
        </div>
    )
}

// ─── Gráfico 1: Ingresos hoy vs ayer ─────────────────────────────────────────
function GraficoIngresos() {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '0.5px solid rgba(34,197,94,0.22)' }}>
                        <DollarSign size={15} style={{ color: '#22c55e' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Ingresos acumulados</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Hoy vs ayer — por hora</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: '#22c55e' }}><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: '#22c55e' }} />Hoy</span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-muted)' }}><span className="w-3 h-0.5 rounded-full inline-block" style={{ background: 'var(--c-muted)' }} />Ayer</span>
                </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={INGRESOS_HORA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradHoy"  x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
                            </linearGradient>
                            <linearGradient id="gradAyer" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#6b7280" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="#6b7280" stopOpacity={0}    />
                            </linearGradient>
                        </defs>
                        <CartesianGrid {...CHART_PROPS.cartesianGrid} />
                        <XAxis dataKey="hora"  {...CHART_PROPS.xAxis} />
                        <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} {...CHART_PROPS.yAxis} />
                        <Tooltip content={<ChartTooltip prefix="$" />} />
                        <Area type="monotone" dataKey="ayer" name="Ayer" stroke="#6b7280" strokeWidth={1.5} fill="url(#gradAyer)" dot={false} strokeDasharray="4 2" />
                        <Area type="monotone" dataKey="hoy"  name="Hoy"  stroke="#22c55e" strokeWidth={2}   fill="url(#gradHoy)"  dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// ─── Gráfico 2: Atracciones más visitadas ────────────────────────────────────
function GraficoAtracciones() {
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
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ATRACCIONES_POPULARES} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid {...CHART_PROPS.cartesianGrid} horizontal={false} vertical />
                        <XAxis type="number" {...CHART_PROPS.xAxis} />
                        <YAxis type="category" dataKey="nombre" width={130} tick={{ fill: RC.text, fontSize: 10, fontFamily: 'var(--font-body)' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip suffix=" visitas" />} />
                        <Bar dataKey="visitas" name="Visitas" radius={[0, 6, 6, 0]}>
                            {ATRACCIONES_POPULARES.map((entry, i) => (
                                <Cell key={i} fill={entry.color} fillOpacity={entry.visitas > 0 ? 0.85 : 0.2} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// ─── Gráfico 3: Tiempos de espera por hora ───────────────────────────────────
function GraficoTiemposEspera() {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.22)' }}>
                        <Clock size={15} style={{ color: '#e63946' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Tiempos de espera</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Evolución por hora — top 3 atracciones</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={TIEMPOS_ESPERA_HORA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid {...CHART_PROPS.cartesianGrid} />
                        <XAxis dataKey="hora" {...CHART_PROPS.xAxis} />
                        <YAxis tickFormatter={v => `${v}m`} {...CHART_PROPS.yAxis} />
                        <Tooltip content={<ChartTooltip suffix=" min" />} />
                        <ReferenceLine y={20} stroke={RC.red} strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: 'Umbral', fill: RC.red, fontSize: 10 }} />
                        <Line type="monotone" dataKey="montana" name="Montaña Rusa X"   stroke={RC.orange} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="rio"     name="Río Salvaje"      stroke={RC.blue}   strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="show"    name="Show Holográfico" stroke={RC.purple}  strokeWidth={2} dot={false} />
                        <Legend formatter={v => <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>{v}</span>} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// ─── Gráfico 4: Tickets (PieChart) ───────────────────────────────────────────
function GraficoTickets() {
    const RADIAN = Math.PI / 180
    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
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
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Distribución de tickets</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>General · Familiar · FastPass</p>
                    </div>
                </div>
            </div>
            <div className="p-4 flex items-center gap-6">
                <div style={{ height: 200, width: 200, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={TICKETS_BREAKDOWN} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                 paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel}>
                                {TICKETS_BREAKDOWN.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip content={<ChartTooltip suffix="%" />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                    {TICKETS_BREAKDOWN.map((t) => (
                        <div key={t.name}>
                            <div className="flex justify-between text-xs mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                  <span style={{ color: 'var(--c-dim)' }}>{t.name}</span>
                </span>
                                <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color: t.color }}>{t.value}%</span>
                            </div>
                            <ProgressBar value={t.value} max={100} color={t.color} />
                        </div>
                    ))}
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--c-border)' }}>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Total 312 tickets vendidos hoy</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Gráfico 5: Semana actual ─────────────────────────────────────────────────
function GraficoSemana() {
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                        <Calendar size={15} style={{ color: '#457b9d' }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Tendencia semanal</h3>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Visitantes e ingresos — últimos 7 días</p>
                    </div>
                </div>
            </div>
            <div className="p-4" style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SEMANA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }} barGap={4}>
                        <CartesianGrid {...CHART_PROPS.cartesianGrid} />
                        <XAxis dataKey="dia" {...CHART_PROPS.xAxis} />
                        <YAxis yAxisId="left"  orientation="left"  tickFormatter={v => v}          {...CHART_PROPS.yAxis} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(v/1000).toFixed(0)}k`} {...CHART_PROPS.yAxis} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar yAxisId="left"  dataKey="visitantes" name="Visitantes" radius={[4,4,0,0]}>
                            {SEMANA.map((entry, i) => (
                                <Cell key={i} fill={entry.dia === 'Hoy' ? RC.teal : RC.blue} fillOpacity={entry.dia === 'Hoy' ? 1 : 0.5} />
                            ))}
                        </Bar>
                        <Bar yAxisId="right" dataKey="ingresos"   name="Ingresos ($)" radius={[4,4,0,0]}>
                            {SEMANA.map((entry, i) => (
                                <Cell key={i} fill={entry.dia === 'Hoy' ? RC.green : RC.purple} fillOpacity={entry.dia === 'Hoy' ? 1 : 0.45} />
                            ))}
                        </Bar>
                        <Legend formatter={v => <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>{v}</span>} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// ─── Gráfico 6: Radar rendimiento por zona ────────────────────────────────────
function GraficoRadar() {
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
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                        <PolarGrid stroke={RC.grid} />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: RC.text, fontSize: 11, fontFamily: 'var(--font-body)' }} />
                        <Radar name="Aventura"     dataKey="aventura"     stroke={RC.orange} fill={RC.orange} fillOpacity={0.15} strokeWidth={1.5} />
                        <Radar name="Acuática"     dataKey="acuatica"     stroke={RC.blue}   fill={RC.blue}   fillOpacity={0.12} strokeWidth={1.5} />
                        <Radar name="Espectáculos" dataKey="espectaculos" stroke={RC.purple}  fill={RC.purple}  fillOpacity={0.12} strokeWidth={1.5} />
                        <Legend formatter={v => <span style={{ color: 'var(--c-muted)', fontSize: 11 }}>{v}</span>} />
                        <Tooltip content={<ChartTooltip />} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

// ─── Alertas estadísticas ─────────────────────────────────────────────────────
function AlertasEstadisticas() {
    const alertas = [
        { tipo: 'CRITICO',  icono: Flame,         color: '#e63946', msg: 'Show Holográfico: 42 en cola — umbral de 40 superado.',       badge: 'Alta demanda'  },
        { tipo: 'AVISO',    icono: AlertTriangle,  color: '#f4a261', msg: 'Zona Aventura al 52% de aforo — tendencia ascendente.',       badge: 'Monitorear'    },
        { tipo: 'INFO',     icono: TrendingUp,     color: '#2a9d8f', msg: 'Ingresos hoy +22% vs ayer — mejor día de la semana.',         badge: 'Positivo'      },
        { tipo: 'AVISO',    icono: Shield,         color: '#e9c46a', msg: 'Torre del Terror en mantenimiento — desviar visitantes.',     badge: 'Mantenimiento' },
    ]

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
                {alertas.map((a, i) => {
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

// ─── Panel rendimiento por zona ───────────────────────────────────────────────
function RendimientoZonas() {
    const data = [
        { zona: 'Zona Aventura',     ocupacion: 52, ingresos: 5200, eficiencia: 78, color: '#f4a261', icono: '🎢' },
        { zona: 'Zona Acuática',     ocupacion: 58, ingresos: 4100, eficiencia: 73, color: '#457b9d', icono: '🌊' },
        { zona: 'Zona Espectáculos', ocupacion: 27, ingresos: 3150, eficiencia: 80, color: '#6a4c93', icono: '🎭' },
    ]

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                    <Award size={15} style={{ color: '#457b9d' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Rendimiento por zona</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Ocupación, ingresos y eficiencia</p>
                </div>
            </div>
            <div className="p-5 space-y-5">
                {data.map((z) => (
                    <div key={z.zona}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{z.icono}</span>
                                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{z.zona}</span>
                            </div>
                            <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: z.color }}>
                {formatPeso(z.ingresos)}
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
                                    <span style={{ color: 'var(--c-muted)' }}>Eficiencia</span>
                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: '#22c55e' }}>{z.eficiencia}%</span>
                                </div>
                                <ProgressBar value={z.eficiencia} max={100} color="#22c55e" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Tabla cierres por clima ──────────────────────────────────────────────────
function TablaCierresClima() {
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
                <table className="tp-table">
                    <thead>
                    <tr><th>Tipo</th><th>Hora</th><th>Atracciones afectadas</th><th>Estado</th></tr>
                    </thead>
                    <tbody>
                    {CIERRES_CLIMA.map((c, i) => (
                        <tr key={i}>
                            <td><span className="text-sm" style={{ color: 'var(--c-text)' }}>{c.tipo}</span></td>
                            <td><span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)' }}>{c.fecha}</span></td>
                            <td><span className="text-xs" style={{ color: 'var(--c-dim)' }}>{c.atracciones}</span></td>
                            <td><Badge variant={c.activa ? 'pending' : 'resolved'} dot>{c.activa ? 'Activa' : 'Resuelta'}</Badge></td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Incidentes por atracción ─────────────────────────────────────────────────
function IncidentesPorAtraccion() {
    const max = Math.max(...INCIDENTES.map(i => i.incidentes))
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.22)' }}>
                    <Flame size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Atracciones con más incidentes</h3>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Histórico de mantenimiento no programado</p>
                </div>
            </div>
            <div className="p-5 space-y-3">
                {INCIDENTES.map((item, i) => (
                    <div key={i} className="flex items-center gap-4">
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
                ))}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Estadisticas() {
    const [lastUpdate, setLastUpdate] = useState(new Date())
    const [refreshing, setRefreshing] = useState(false)
    const [reporte,    setReporte]    = useState(null)

    async function fetchReporte() {
        try {
            const res = await estadisticasService.getReporteJornada()
            if (res?.data) setReporte(res.data)
        } catch {}
    }

    useEffect(() => { fetchReporte() }, [])

    async function handleRefresh() {
        setRefreshing(true)
        await fetchReporte()
        setLastUpdate(new Date())
        setRefreshing(false)
    }

    // Enriquecer datos demo con datos reales si están disponibles
    const atraccionesPopulares = reporte?.atraccionesMasVisitadas?.length
        ? reporte.atraccionesMasVisitadas.map(a => ({ nombre: a.nombre ?? a, visitantes: a.visitantes ?? 0 }))
        : ATRACCIONES_POPULARES
    const ingresosDiarios = reporte?.ingresosDiarios ?? null

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {/* Top bar */}
            <div className="flex items-center justify-between mb-2">
                <div />
                <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
            Actualizado: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
                    <Button variant="ghost" size="sm" loading={refreshing} onClick={handleRefresh}>
                        <RefreshCw size={13} /> Actualizar
                    </Button>
                </div>
            </div>

            {/* Hero */}
            <HeroEstadisticas />

            {/* KPIs */}
            <KPIsRapidos />

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* Main charts grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <GraficoIngresos />
                <GraficoAtracciones />
                <GraficoTiemposEspera />
                <GraficoTickets />
            </div>

            {/* Full-width weekly chart */}
            <div className="mb-6">
                <GraficoSemana />
            </div>

            {/* Bottom grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <GraficoRadar />
                <AlertasEstadisticas />
                <RendimientoZonas />
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TablaCierresClima />
                <IncidentesPorAtraccion />
            </div>
        </div>
    )
}