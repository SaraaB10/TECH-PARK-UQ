// src/pages/Inicio.jsx  ─── REEMPLAZO COMPLETO
import { useState, useCallback } from 'react'
import {
    Users, Zap, AlertTriangle, DollarSign,
    MapPin, Clock, Rocket,
    Activity, TrendingUp, RefreshCw,
    CheckCircle, XCircle, Loader2,
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { parqueService } from '@/services/parqueService'
import { useApp } from '@/context/AppContext'

// ─── Paleta de colores para zonas (asignada por índice, no por ID hardcodeado) ─
const ZONA_PALETTE = [
    { accent: '#f4a261', glow: 'rgba(244,162,97,0.15)',  icono: '🎢' },
    { accent: '#457b9d', glow: 'rgba(69,123,157,0.15)',  icono: '🌊' },
    { accent: '#6a4c93', glow: 'rgba(106,76,147,0.15)',  icono: '🎭' },
    { accent: '#2a9d8f', glow: 'rgba(42,157,143,0.15)',  icono: '🌿' },
    { accent: '#e63946', glow: 'rgba(230,57,70,0.15)',   icono: '🚀' },
    { accent: '#e9c46a', glow: 'rgba(233,196,106,0.15)', icono: '⭐' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(n) {
    if (n == null || isNaN(n)) return '$0'
    return `$${Number(n).toLocaleString('es-CO')}`
}

function getZonaPalette(index) {
    return ZONA_PALETTE[index % ZONA_PALETTE.length]
}

function estadoColor(estado) {
    if (!estado) return '#6b7280'
    const e = estado.toUpperCase()
    if (e === 'ACTIVA' || e === 'ABIERTA') return '#22c55e'
    if (e.includes('MANTENIMIENTO'))       return '#f4a261'
    return '#e63946'
}

// ─── Sección Hero ─────────────────────────────────────────────────────────────
function HeroSection({ onCargarDatos, loading, mensaje, parqueAbierto, quickStats }) {
    return (
        <section className="relative w-full min-h-screen flex flex-col justify-end overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/parque.jpg"
                    alt="Tech-Park UQ"
                    className="w-full h-full object-cover object-center"
                    style={{ filter: 'brightness(0.75) saturate(1.1)' }}
                />
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(13,15,20,0.25) 0%, rgba(13,15,20,0.4) 40%, rgba(13,15,20,0.92) 85%, rgba(13,15,20,1) 100%)',
                    }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }}
                />
            </div>

            {/* Hero content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 pt-32 w-full">
                {/* Status pill */}
                <div
                    className="animate-fade-up mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                    style={{
                        background: 'rgba(13,15,20,0.6)',
                        borderColor: parqueAbierto ? 'rgba(34,197,94,0.3)' : 'rgba(230,57,70,0.3)',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <span className={`status-dot ${parqueAbierto ? 'active' : ''}`} />
                    <span
                        className="text-xs font-semibold tracking-widest uppercase"
                        style={{ fontFamily: 'var(--font-display)', color: parqueAbierto ? '#22c55e' : '#e63946' }}
                    >
                        {parqueAbierto ? 'Parque abierto' : 'Parque cerrado'}
                    </span>
                </div>

                {/* Title */}
                <h1
                    className="animate-fade-up-delay-1 font-bold leading-none tracking-tight mb-4"
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(3rem, 8vw, 7rem)',
                        color: 'white',
                    }}
                >
                    <span className="text-rainbow">Tech-Park</span>
                    <br />
                    <span style={{ color: 'white' }}>UQ</span>
                </h1>

                {/* Description */}
                <p
                    className="animate-fade-up-delay-2 text-base md:text-lg max-w-xl mb-8"
                    style={{ color: 'rgba(232,234,240,0.7)', fontFamily: 'var(--font-body)' }}
                >
                    Sistema de Gestión Inteligente de Atracciones — control en tiempo real,
                    rutas optimizadas y experiencia premium para cada visitante.
                </p>

                {/* CTAs */}
                <div className="animate-fade-up-delay-3 flex flex-wrap gap-3 mb-12">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={onCargarDatos}
                        loading={loading}
                    >
                        <Rocket size={16} />
                        Cargar escenario de prueba
                    </Button>
                    <a href="#zonas">
                        <Button variant="ghost" size="lg">
                            <MapPin size={16} />
                            Ver zonas
                        </Button>
                    </a>
                </div>

                {/* Mensaje de respuesta */}
                {mensaje && (
                    <div
                        className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm mb-6"
                        style={{
                            background: mensaje.ok ? 'rgba(34,197,94,0.12)' : 'rgba(230,57,70,0.12)',
                            border: `0.5px solid ${mensaje.ok ? 'rgba(34,197,94,0.3)' : 'rgba(230,57,70,0.3)'}`,
                            color: mensaje.ok ? '#22c55e' : '#e63946',
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        {mensaje.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
                        {mensaje.texto}
                    </div>
                )}

                {/* Quick stats bar */}
                <div
                    className="animate-fade-up-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
                    style={{ background: 'var(--c-border)' }}
                >
                    {quickStats.map(({ label, value }) => (
                        <div
                            key={label}
                            className="px-5 py-4"
                            style={{ background: 'rgba(13,15,20,0.75)', backdropFilter: 'blur(12px)' }}
                        >
                            <div
                                className="text-xl font-bold tracking-tight"
                                style={{ fontFamily: 'var(--font-display)', color: 'white' }}
                            >
                                {value}
                            </div>
                            <div
                                className="text-xs uppercase tracking-wider mt-0.5"
                                style={{ color: 'rgba(232,234,240,0.45)', fontFamily: 'var(--font-display)' }}
                            >
                                {label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

// ─── Resumen en cards ─────────────────────────────────────────────────────────
function ResumenCards({ stats }) {
    const {
        visitantesActuales = 0,
        capacidadMaxima    = 1,
        ingresosDiarios    = 0,
        atraccionesActivas = 0,
        totalAtracciones   = 0,
        alertas            = 0,
    } = stats

    const pctAforo = capacidadMaxima > 0
        ? Math.round((visitantesActuales / capacidadMaxima) * 100)
        : 0

    return (
        <section className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Visitantes hoy"
                    value={visitantesActuales.toLocaleString('es-CO')}
                    sub={`${pctAforo}% de aforo`}
                    accent="#2a9d8f"
                    icon={Users}
                    className="animate-fade-up-delay-1"
                />
                <StatCard
                    label="Atracciones activas"
                    value={`${atraccionesActivas}/${totalAtracciones}`}
                    sub="En operación normal"
                    accent="#457b9d"
                    icon={Zap}
                    className="animate-fade-up-delay-2"
                />
                <StatCard
                    label="Alertas activas"
                    value={alertas}
                    sub={alertas > 0 ? 'Requieren atención' : 'Todo en orden'}
                    accent={alertas > 0 ? '#e63946' : '#22c55e'}
                    icon={AlertTriangle}
                    className="animate-fade-up-delay-3"
                />
                <StatCard
                    label="Ingresos del día"
                    value={formatCurrency(ingresosDiarios)}
                    sub="Tickets + servicios"
                    accent="#e9c46a"
                    icon={DollarSign}
                    className="animate-fade-up-delay-4"
                />
            </div>
        </section>
    )
}

// ─── Sección de Zonas ─────────────────────────────────────────────────────────
function ZonasSection({ zonas, atraccionesPorZona }) {
    return (
        <section id="zonas" className="max-w-7xl mx-auto px-6 pb-12">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h2 className="section-title">Estado por zonas</h2>
                    <p className="section-subtitle">Capacidad y atracciones en tiempo real</p>
                </div>
                <span
                    className="text-xs font-mono px-3 py-1.5 rounded-lg"
                    style={{ background: 'var(--c-card)', color: 'var(--c-muted)', border: '0.5px solid var(--c-border)' }}
                >
                    {zonas.length} zonas
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {zonas.map((zona, idx) => {
                    const { accent, glow, icono } = getZonaPalette(idx)
                    const actual = zona.visitantesActuales ?? 0
                    const max    = zona.capacidadMaxima    ?? 1
                    const pct = max > 0 ? Math.max(actual > 0 ? 1 : 0, Math.round((actual / max) * 100)) : 0
                    const atracciones = atraccionesPorZona[zona.id] ?? []

                    return (
                        <div
                            key={zona.id}
                            className="glass rounded-2xl overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
                            style={{ borderTop: `2px solid ${accent}` }}
                        >
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                                style={{ background: glow }}
                            />

                            <div className="p-5 relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{icono}</span>
                                        <div>
                                            <h3
                                                className="font-bold text-sm"
                                                style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                                            >
                                                {zona.nombre}
                                            </h3>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                                {zona.cantidadAtracciones ?? atracciones.length} atracciones
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                                        style={{ background: `${accent}20`, color: accent, fontFamily: 'var(--font-mono)' }}
                                    >
                                        {pct}%
                                    </span>
                                </div>

                                <div className="mb-1.5">
                                    <ProgressBar value={actual} max={max} color={accent} />
                                </div>
                                <div className="flex justify-between text-xs mb-5" style={{ color: 'var(--c-muted)' }}>
                                    <span>{actual.toLocaleString('es-CO')} visitantes</span>
                                    <span>Máx. {max.toLocaleString('es-CO')}</span>
                                </div>

                                {atracciones.length > 0 ? (
                                    <div className="space-y-2">
                                        {atracciones.map((a) => (
                                            <div
                                                key={a.id}
                                                className="flex items-center justify-between rounded-xl px-3 py-2.5"
                                                style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span
                                                        className="status-dot flex-shrink-0"
                                                        style={{ background: estadoColor(a.estado) }}
                                                    />
                                                    <span className="text-xs truncate" style={{ color: 'var(--c-dim)' }}>
                                                        {a.nombre}
                                                    </span>
                                                </div>
                                                {(a.estado?.toUpperCase() === 'ACTIVA' || a.estado?.toUpperCase() === 'ABIERTA') ? (
                                                    <span
                                                        className="text-xs flex-shrink-0 flex items-center gap-1"
                                                        style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}
                                                    >
                                                        <Users size={10} />
                                                        {a.visitantes ?? 0}
                                                    </span>
                                                ) : (
                                                    <StatusBadge status={a.estado} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-center py-3" style={{ color: 'var(--c-muted)' }}>
                                        Sin atracciones cargadas
                                    </p>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

// ─── Atracciones destacadas ───────────────────────────────────────────────────
function AtraccionesDestacadas({ atracciones, zonas }) {
    return (
        <section className="max-w-7xl mx-auto px-6 pb-16">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h2 className="section-title">Atracciones destacadas</h2>
                    <p className="section-subtitle">Tiempo de espera y estado actual</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="active" dot>Activa</Badge>
                    <Badge variant="maintenance" dot>Mantenimiento</Badge>
                    <Badge variant="closed" dot>Cerrada</Badge>
                </div>
            </div>

            {atracciones.length === 0 ? (
                <div
                    className="glass rounded-2xl p-12 text-center"
                    style={{ border: '0.5px solid var(--c-border)' }}
                >
                    <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                        No hay atracciones cargadas. Usa "Cargar escenario de prueba" para inicializar el sistema.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {atracciones.map((a, i) => (
                        <AtraccionCard key={a.id} atraccion={a} delay={i} zonas={zonas} />
                    ))}
                </div>
            )}
        </section>
    )
}

function AtraccionCard({ atraccion: a, delay, zonas }) {
    const paletteIdx = zonas.findIndex(z =>
        z.nombre?.toLowerCase().includes(a.tipo?.toLowerCase?.() ?? '')
    )
    const { accent: zonaColor } = getZonaPalette(paletteIdx >= 0 ? paletteIdx : delay % ZONA_PALETTE.length)
    const stColor = estadoColor(a.estado)
    const esActiva = a.estado?.toUpperCase() === 'ACTIVA' || a.estado?.toUpperCase() === 'ABIERTA'

    return (
        <div
            className="glass rounded-2xl p-4 flex items-center gap-4 group hover:scale-[1.01] transition-all duration-300"
            style={{ animationDelay: `${delay * 0.08}s` }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${zonaColor}18`, border: `0.5px solid ${zonaColor}30` }}
            >
                <Activity size={20} style={{ color: zonaColor }} />
            </div>

            <div className="flex-1 min-w-0">
                <h4
                    className="font-semibold text-sm truncate"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                >
                    {a.nombre}
                </h4>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
                    {a.tipo ?? '—'}
                </p>
                {esActiva && (
                    <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-dim)' }}>
                            <Users size={10} />
                            {a.visitantesEnCola ?? a.contadorVisitantes ?? 0} visitantes
                        </span>
                        {(a.tiempoEsperaEstimado ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-dim)' }}>
                                <Clock size={10} />
                                ~{a.tiempoEsperaEstimado} min
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: stColor, boxShadow: `0 0 8px ${stColor}` }}
                />
                {esActiva && (a.tiempoEsperaEstimado ?? 0) > 0 && (
                    <span
                        className="text-xs font-bold"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-dim)' }}
                    >
                        {a.tiempoEsperaEstimado}′
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── CTA Cargar datos ─────────────────────────────────────────────────────────
function CargarDatosSection({ onCargarDatos, loading, mensaje }) {
    return (
        <section className="max-w-7xl mx-auto px-6 pb-20">
            <div
                className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden"
                style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
                <div
                    className="absolute inset-0 opacity-5"
                    style={{ background: 'linear-gradient(135deg,#e63946,#f4a261,#2a9d8f,#6a4c93)' }}
                />
                <div
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl"
                    style={{ background: '#6a4c93' }}
                />
                <div
                    className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-10 blur-3xl"
                    style={{ background: '#e63946' }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}
                            >
                                <TrendingUp size={18} style={{ color: '#e9c46a' }} />
                            </div>
                            <span
                                className="text-xs uppercase tracking-widest font-semibold"
                                style={{ fontFamily: 'var(--font-display)', color: '#e9c46a' }}
                            >
                                Datos de prueba
                            </span>
                        </div>
                        <h3
                            className="text-2xl font-bold mb-2"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                        >
                            Cargar escenario inicial
                        </h3>
                        <p className="text-sm max-w-md" style={{ color: 'var(--c-muted)' }}>
                            Inicializa el sistema con zonas, atracciones, operadores y visitantes de prueba
                            listos para la sustentación del proyecto.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={onCargarDatos}
                            loading={loading}
                        >
                            <Rocket size={16} />
                            Cargar escenario de prueba
                        </Button>

                        {mensaje && (
                            <div
                                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl"
                                style={{
                                    background: mensaje.ok ? 'rgba(34,197,94,0.1)' : 'rgba(230,57,70,0.1)',
                                    color: mensaje.ok ? '#22c55e' : '#e63946',
                                    border: `0.5px solid ${mensaje.ok ? 'rgba(34,197,94,0.25)' : 'rgba(230,57,70,0.25)'}`,
                                }}
                            >
                                {mensaje.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                {mensaje.texto}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Inicio() {
    const {
        parqueInfo,
        zonas,
        atracciones,
        atraccionesPorZona,
        alertasMantenimiento,
        resumen,
        cargandoGlobal,
        backendOk,
        refrescarTodo,
        setDatosCargados,
    } = useApp()

    const [loading,  setLoading]  = useState(false)
    const [mensaje,  setMensaje]  = useState(null)

    // ── Cargar escenario de prueba ────────────────────────────────────────────
    const handleCargarDatos = useCallback(async () => {
        setLoading(true)
        setMensaje(null)
        try {
            await parqueService.cargarDatosPrueba()
            setMensaje({ ok: true, texto: 'Escenario cargado correctamente ✓' })
            setDatosCargados(true)
            await refrescarTodo()
        } catch {
            setMensaje({ ok: false, texto: 'Error: no se pudo conectar al backend' })
        } finally {
            setLoading(false)
        }
    }, [refrescarTodo, setDatosCargados])

    // ── Derivar stats ─────────────────────────────────────────────────────────
    const alertasPendientes = Array.isArray(alertasMantenimiento)
        ? alertasMantenimiento.filter(a => !a.resuelta).length
        : (resumen?.alertasMantenimiento ?? 0)

    const stats = {
        visitantesActuales: parqueInfo?.visitantesActuales ?? 0,
        capacidadMaxima:    parqueInfo?.capacidadMaxima    ?? 1,
        ingresosDiarios:    parqueInfo?.ingresosDiarios    ?? 0,
        atraccionesActivas: atracciones.filter(
            a => a.estado?.toUpperCase() === 'ACTIVA' || a.estado?.toUpperCase() === 'ABIERTA'
        ).length,
        totalAtracciones: atracciones.length,
        alertas: alertasPendientes,
    }

    const quickStats = [
        { label: 'Visitantes hoy',      value: stats.visitantesActuales.toLocaleString('es-CO') },
        { label: 'Capacidad máx.',       value: stats.capacidadMaxima.toLocaleString('es-CO') },
        { label: 'Ingresos del día',     value: formatCurrency(stats.ingresosDiarios) },
        { label: 'Atracciones activas',  value: stats.totalAtracciones > 0
                ? `${stats.atraccionesActivas}/${stats.totalAtracciones}`
                : '—'
        },
    ]

    return (
        <div style={{ background: 'var(--c-night)' }}>
            {/* Spinner de carga inicial */}
            {cargandoGlobal && (
                <div
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{
                        background: 'rgba(13,15,20,0.85)',
                        border: '0.5px solid var(--c-border)',
                        color: 'var(--c-muted)',
                        backdropFilter: 'blur(12px)',
                    }}
                >
                    <Loader2 size={12} className="animate-spin" />
                    Sincronizando con el backend…
                </div>
            )}

            {/* Botón de refresco manual */}
            {!cargandoGlobal && (
                <button
                    onClick={refrescarTodo}
                    className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                    style={{
                        background: 'rgba(13,15,20,0.85)',
                        border: '0.5px solid var(--c-border)',
                        color: 'var(--c-muted)',
                        backdropFilter: 'blur(12px)',
                        cursor: 'pointer',
                    }}
                >
                    <RefreshCw size={12} />
                    Actualizar
                </button>
            )}

            {/* Backend no disponible */}
            {backendOk === false && (
                <div
                    className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm"
                    style={{
                        background: 'rgba(233,196,106,0.12)',
                        border: '0.5px solid rgba(233,196,106,0.3)',
                        color: '#e9c46a',
                        backdropFilter: 'blur(12px)',
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <AlertTriangle size={14} />
                    Backend no detectado — corre el servidor en{' '}
                    <code
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(233,196,106,0.15)' }}
                    >
                        localhost:8080
                    </code>
                </div>
            )}

            {/* 1. Hero */}
            <HeroSection
                onCargarDatos={handleCargarDatos}
                loading={loading}
                mensaje={mensaje}
                parqueAbierto={parqueInfo?.estaAbierto ?? true}
                quickStats={quickStats}
            />

            {/* 2. Resumen en cards */}
            <ResumenCards stats={stats} />

            {/* Divider */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="h-px mb-12" style={{ background: 'var(--c-border)' }} />
            </div>

            {/* 3. Zonas */}
            <ZonasSection
                zonas={zonas}
                atraccionesPorZona={atraccionesPorZona}
            />

            {/* 4. Atracciones destacadas */}
            <AtraccionesDestacadas
                atracciones={atracciones}
                zonas={zonas}
            />

            {/* 5. CTA Cargar datos */}
            <CargarDatosSection
                onCargarDatos={handleCargarDatos}
                loading={loading}
                mensaje={mensaje}
            />
        </div>
    )
}