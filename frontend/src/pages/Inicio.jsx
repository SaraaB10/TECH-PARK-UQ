import { useState, useEffect } from 'react'
import {
    Users, Zap, AlertTriangle, DollarSign,
    MapPin, Clock, ChevronRight, Rocket,
    Waves, Star, Activity, TrendingUp,
    RefreshCw, CheckCircle, XCircle, Settings
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { parqueService, zonaService } from '@/services/parqueService'

// ─── Demo data (se reemplaza con la respuesta del backend) ───────────────────
const DEMO_STATS = {
    visitantes: 847,
    capacidadMax: 2000,
    atraccionesActivas: 4,
    totalAtracciones: 6,
    alertas: 2,
    ingresos: 12450,
}

const DEMO_ZONAS = [
    {
        id: 'aventura',
        nombre: 'Zona Aventura',
        capacidadActual: 312,
        capacidadMax: 600,
        color: '#f4a261',
        icono: '🎢',
        atracciones: [
            { nombre: 'Montaña Rusa X', estado: 'ACTIVA',           cola: 23, espera: 18 },
            { nombre: 'Torre del Terror', estado: 'EN_MANTENIMIENTO', cola: 0,  espera: 0  },
            { nombre: 'Free Fall 360',   estado: 'ACTIVA',           cola: 11, espera: 9  },
        ],
    },
    {
        id: 'acuatica',
        nombre: 'Zona Acuática',
        capacidadActual: 289,
        capacidadMax: 500,
        color: '#457b9d',
        icono: '🌊',
        atracciones: [
            { nombre: 'Río Salvaje',    estado: 'ACTIVA',  cola: 18, espera: 14 },
            { nombre: 'Ola Gigante',    estado: 'CERRADA', cola: 0,  espera: 0  },
        ],
    },
    {
        id: 'espectaculos',
        nombre: 'Zona Espectáculos',
        capacidadActual: 246,
        capacidadMax: 900,
        color: '#6a4c93',
        icono: '🎭',
        atracciones: [
            { nombre: 'Show Holográfico', estado: 'ACTIVA', cola: 42, espera: 30 },
        ],
    },
]

const ZONA_COLORS = {
    aventura:     { accent: '#f4a261', glow: 'rgba(244,162,97,0.15)'  },
    acuatica:     { accent: '#457b9d', glow: 'rgba(69,123,157,0.15)'  },
    espectaculos: { accent: '#6a4c93', glow: 'rgba(106,76,147,0.15)'  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(n) {
    return `$${n.toLocaleString('es-CO')}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeroSection({ onCargarDatos, loading, mensaje }) {
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
                {/* Cinematic overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            'linear-gradient(to bottom, rgba(13,15,20,0.25) 0%, rgba(13,15,20,0.4) 40%, rgba(13,15,20,0.92) 85%, rgba(13,15,20,1) 100%)',
                    }}
                />
                {/* Rainbow top glow */}
                <div
                    className="absolute top-0 left-0 right-0 h-1 opacity-80"
                    style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }}
                />
            </div>

            {/* Hero content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 pt-32 w-full">
                {/* Status pill */}
                <div className="animate-fade-up mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                     style={{ background: 'rgba(13,15,20,0.6)', borderColor: 'rgba(34,197,94,0.3)', backdropFilter: 'blur(8px)' }}>
                    <span className="status-dot active" />
                    <span className="text-xs font-semibold tracking-widest uppercase"
                          style={{ fontFamily: 'var(--font-display)', color: '#22c55e' }}>
            Parque abierto
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
                        {mensaje.ok
                            ? <CheckCircle size={15} />
                            : <XCircle size={15} />}
                        {mensaje.texto}
                    </div>
                )}

                {/* Quick stats bar */}
                <div
                    className="animate-fade-up-delay-4 grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden"
                    style={{ background: 'var(--c-border)' }}
                >
                    {[
                        { label: 'Visitantes hoy', value: DEMO_STATS.visitantes.toLocaleString('es-CO') },
                        { label: 'Capacidad máx.',  value: DEMO_STATS.capacidadMax.toLocaleString('es-CO') },
                        { label: 'Ingresos del día', value: formatCurrency(DEMO_STATS.ingresos) },
                        { label: 'Atracciones activas', value: `${DEMO_STATS.atraccionesActivas}/${DEMO_STATS.totalAtracciones}` },
                    ].map(({ label, value }) => (
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


function ResumenCards({ stats }) {
    return (
        <section className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Visitantes hoy"
                    value={stats.visitantes.toLocaleString('es-CO')}
                    sub={`${Math.round((stats.visitantes / stats.capacidadMax) * 100)}% de aforo`}
                    accent="#2a9d8f"
                    icon={Users}
                    className="animate-fade-up-delay-1"
                />
                <StatCard
                    label="Atracciones activas"
                    value={`${stats.atraccionesActivas}/${stats.totalAtracciones}`}
                    sub="En operación normal"
                    accent="#457b9d"
                    icon={Zap}
                    className="animate-fade-up-delay-2"
                />
                <StatCard
                    label="Alertas activas"
                    value={stats.alertas}
                    sub={stats.alertas > 0 ? 'Requieren atención' : 'Todo en orden'}
                    accent={stats.alertas > 0 ? '#e63946' : '#22c55e'}
                    icon={AlertTriangle}
                    className="animate-fade-up-delay-3"
                />
                <StatCard
                    label="Ingresos del día"
                    value={formatCurrency(stats.ingresos)}
                    sub="Tickets + servicios"
                    accent="#e9c46a"
                    icon={DollarSign}
                    className="animate-fade-up-delay-4"
                />
            </div>
        </section>
    )
}


function ZonasSection({ zonas }) {
    return (
        <section id="zonas" className="max-w-7xl mx-auto px-6 pb-12">
            {/* Header */}
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
                {zonas.map((zona) => {
                    const { accent, glow } = ZONA_COLORS[zona.id] || { accent: '#6a4c93', glow: 'rgba(106,76,147,0.15)' }
                    const pct = Math.round((zona.capacidadActual / zona.capacidadMax) * 100)

                    return (
                        <div
                            key={zona.id}
                            className="glass rounded-2xl overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
                            style={{ borderTop: `2px solid ${accent}` }}
                        >
                            {/* Glow bg */}
                            <div
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                                style={{ background: glow }}
                            />

                            <div className="p-5 relative z-10">
                                {/* Zona header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{zona.icono}</span>
                                        <div>
                                            <h3
                                                className="font-bold text-sm"
                                                style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                                            >
                                                {zona.nombre}
                                            </h3>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                                {zona.atracciones.length} atracciones
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

                                {/* Capacity bar */}
                                <div className="mb-1.5">
                                    <ProgressBar
                                        value={zona.capacidadActual}
                                        max={zona.capacidadMax}
                                        color={accent}
                                    />
                                </div>
                                <div className="flex justify-between text-xs mb-5" style={{ color: 'var(--c-muted)' }}>
                                    <span>{zona.capacidadActual.toLocaleString('es-CO')} visitantes</span>
                                    <span>Máx. {zona.capacidadMax.toLocaleString('es-CO')}</span>
                                </div>

                                {/* Atracciones list */}
                                <div className="space-y-2">
                                    {zona.atracciones.map((a) => (
                                        <div
                                            key={a.nombre}
                                            className="flex items-center justify-between rounded-xl px-3 py-2.5"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                        <span
                            className="status-dot flex-shrink-0"
                            style={{
                                background:
                                    a.estado === 'ACTIVA' ? '#22c55e' :
                                        a.estado === 'EN_MANTENIMIENTO' ? '#f4a261' : '#e63946',
                            }}
                        />
                                                <span className="text-xs truncate" style={{ color: 'var(--c-dim)' }}>
                          {a.nombre}
                        </span>
                                            </div>
                                            {a.estado === 'ACTIVA' && (
                                                <span className="text-xs flex-shrink-0 flex items-center gap-1"
                                                      style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                          <Clock size={10} />
                                                    {a.espera}min
                        </span>
                                            )}
                                            {a.estado !== 'ACTIVA' && (
                                                <StatusBadge status={a.estado} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}


function AtraccionesDestacadas({ zonas }) {
    // Flatten all atracciones from all zones
    const todas = zonas.flatMap((z) =>
        z.atracciones.map((a) => ({ ...a, zona: z.nombre, zonaColor: ZONA_COLORS[z.id]?.accent || '#6a4c93' }))
    )

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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {todas.map((a, i) => (
                    <AtraccionCard key={`${a.nombre}-${i}`} atraccion={a} delay={i} />
                ))}
            </div>
        </section>
    )
}


function AtraccionCard({ atraccion: a, delay }) {
    const stateColor =
        a.estado === 'ACTIVA' ? '#22c55e' :
            a.estado === 'EN_MANTENIMIENTO' ? '#f4a261' : '#e63946'

    return (
        <div
            className="glass rounded-2xl p-4 flex items-center gap-4 group hover:scale-[1.01] transition-all duration-300"
            style={{ animationDelay: `${delay * 0.08}s` }}
        >
            {/* Color block */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${a.zonaColor}18`, border: `0.5px solid ${a.zonaColor}30` }}
            >
                <Activity size={20} style={{ color: a.zonaColor }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4
                    className="font-semibold text-sm truncate"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}
                >
                    {a.nombre}
                </h4>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-muted)' }}>
                    {a.zona}
                </p>
                {a.estado === 'ACTIVA' && (
                    <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-dim)' }}>
              <Users size={10} />
                {a.cola} en cola
            </span>
                        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--c-dim)' }}>
              <Clock size={10} />
              ~{a.espera} min
            </span>
                    </div>
                )}
            </div>

            {/* Status */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
        />
                {a.estado === 'ACTIVA' && a.espera > 0 && (
                    <span
                        className="text-xs font-bold"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-dim)' }}
                    >
            {a.espera}′
          </span>
                )}
            </div>
        </div>
    )
}


function CargarDatosSection({ onCargarDatos, loading, mensaje }) {
    return (
        <section className="max-w-7xl mx-auto px-6 pb-20">
            <div
                className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden"
                style={{ border: '0.5px solid rgba(255,255,255,0.06)' }}
            >
                {/* Background rainbow glow */}
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


// ─── Main page ────────────────────────────────────────────────────────────────
export default function Inicio() {
    const [stats, setStats]     = useState(DEMO_STATS)
    const [zonas, setZonas]     = useState(DEMO_ZONAS)
    const [loading, setLoading] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [backendOk, setBackendOk] = useState(null)

    // Intenta cargar datos reales al montar
    useEffect(() => {
        async function fetchData() {
            try {
                const [resZonas] = await Promise.all([
                    zonaService.getAll(),
                ])
                if (resZonas?.data) setZonas(resZonas.data)
                setBackendOk(true)
            } catch {
                setBackendOk(false)
            }
        }
        fetchData()
    }, [])

    async function handleCargarDatos() {
        setLoading(true)
        setMensaje(null)
        try {
            await parqueService.cargarDatos()
            setMensaje({ ok: true, texto: 'Escenario cargado correctamente ✓' })
            // Refrescar datos
            const resZonas = await zonaService.getAll()
            if (resZonas?.data) setZonas(resZonas.data)
        } catch {
            setMensaje({ ok: false, texto: 'Error: no se pudo conectar al backend' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ background: 'var(--c-night)' }}>
            {/* Backend warning banner */}
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
                    Backend no detectado — mostrando datos de demostración.
                    Corre el servidor en{' '}
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
            />

            {/* 2. Resumen en cards */}
            <ResumenCards stats={stats} />

            {/* Divider */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="h-px mb-12" style={{ background: 'var(--c-border)' }} />
            </div>

            {/* 3. Zonas */}
            <ZonasSection zonas={zonas} />

            {/* 4. Atracciones destacadas */}
            <AtraccionesDestacadas zonas={zonas} />

            {/* 5. CTA Cargar datos */}
            <CargarDatosSection
                onCargarDatos={handleCargarDatos}
                loading={loading}
                mensaje={mensaje}
            />
        </div>
    )
}