import { useState, useEffect } from 'react'
import {
    User, Star, Clock, Users, Ticket, Bell,
    Heart, History, Plus, Trash2, CheckCircle,
    MapPin, Zap, Trophy, ChevronRight, Gift,
    ArrowRight, AlertTriangle, Info, Sparkles,
    CreditCard, Shield, Waves, Activity, X
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input, Select } from '@/components/ui/Input'
import { visitanteService, atraccionService } from '@/services/parqueService'

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_VISITANTE = {
    id: 1,
    nombre: 'Alejandro Gómez',
    edad: 24,
    estatura: 175,
    saldo: 85000,
    tipoTicket: 'FASTPASS',
    puntosAcumulados: 1240,
    visitasTotal: 7,
}

const DEMO_ATRACCIONES = [
    { id: 1, nombre: 'Montaña Rusa X',    estado: 'ACTIVA',           cola: 23, espera: 18, zona: 'Aventura',     alturaMin: 140 },
    { id: 2, nombre: 'Torre del Terror',  estado: 'EN_MANTENIMIENTO', cola: 0,  espera: 0,  zona: 'Aventura',     alturaMin: 130 },
    { id: 3, nombre: 'Free Fall 360',     estado: 'ACTIVA',           cola: 11, espera: 9,  zona: 'Aventura',     alturaMin: 120 },
    { id: 4, nombre: 'Río Salvaje',       estado: 'ACTIVA',           cola: 18, espera: 14, zona: 'Acuática',     alturaMin: 100 },
    { id: 5, nombre: 'Ola Gigante',       estado: 'CERRADA',          cola: 0,  espera: 0,  zona: 'Acuática',     alturaMin: 90  },
    { id: 6, nombre: 'Show Holográfico',  estado: 'ACTIVA',           cola: 42, espera: 30, zona: 'Espectáculos', alturaMin: 0   },
]

const DEMO_HISTORIAL = [
    { id: 1, atraccion: 'Montaña Rusa X',   fecha: '2025-05-13 15:30', ticket: 'FASTPASS', duracion: 4  },
    { id: 2, atraccion: 'Free Fall 360',     fecha: '2025-05-13 14:10', ticket: 'FASTPASS', duracion: 3  },
    { id: 3, atraccion: 'Show Holográfico',  fecha: '2025-05-12 17:00', ticket: 'FASTPASS', duracion: 45 },
    { id: 4, atraccion: 'Río Salvaje',       fecha: '2025-05-11 12:45', ticket: 'FASTPASS', duracion: 6  },
]

const DEMO_FAVORITOS = [
    { id: 1, nombre: 'Montaña Rusa X',   estado: 'ACTIVA',           zona: 'Aventura',     espera: 18 },
    { id: 6, nombre: 'Show Holográfico', estado: 'ACTIVA',           zona: 'Espectáculos', espera: 30 },
    { id: 3, nombre: 'Free Fall 360',    estado: 'ACTIVA',           zona: 'Aventura',     espera: 9  },
    { id: 2, nombre: 'Torre del Terror', estado: 'EN_MANTENIMIENTO', zona: 'Aventura',     espera: 0  },
]

const DEMO_NOTIFICACIONES = [
    { id: 1, tipo: 'CLIMA',          mensaje: 'Tormenta eléctrica activa — Montaña Rusa X cerrada temporalmente.',         fecha: '14:32', leida: false },
    { id: 2, tipo: 'SHOW',           mensaje: 'Show Holográfico especial a las 18:00 — ¡No te lo pierdas!',                 fecha: '13:00', leida: false },
    { id: 3, tipo: 'MANTENIMIENTO',  mensaje: 'Torre del Terror en revisión técnica. Reapertura estimada: 16:00.',          fecha: '09:21', leida: true  },
    { id: 4, tipo: 'PROMO',          mensaje: '2x1 en Fast Pass esta tarde. Usa tu saldo para más atracciones hoy.',        fecha: '08:00', leida: true  },
]

const TICKETS = [
    {
        tipo: 'GENERAL',
        precio: 35000,
        color: '#457b9d',
        icono: '🎟️',
        label: 'General',
        beneficios: ['Acceso a todas las zonas', 'Cola estándar', 'Mapa del parque'],
    },
    {
        tipo: 'FAMILIAR',
        precio: 90000,
        color: '#2a9d8f',
        icono: '👨‍👩‍👧‍👦',
        label: 'Familiar',
        beneficios: ['Hasta 4 personas', 'Descuento en restaurantes', 'Zona kids incluida', 'Locker gratis'],
        popular: true,
    },
    {
        tipo: 'FASTPASS',
        precio: 65000,
        color: '#e9c46a',
        icono: '⚡',
        label: 'FastPass',
        beneficios: ['Cola prioritaria', 'Acceso VIP', 'Descuento 15% en souvenirs', 'Re-ride ilimitado'],
    },
]

const NOTIF_COLORS = {
    CLIMA:         { color: '#e9c46a', bg: 'rgba(233,196,106,0.1)',  border: 'rgba(233,196,106,0.25)', icono: AlertTriangle },
    SHOW:          { color: '#6a4c93', bg: 'rgba(106,76,147,0.1)',   border: 'rgba(106,76,147,0.25)',  icono: Sparkles      },
    MANTENIMIENTO: { color: '#e63946', bg: 'rgba(230,57,70,0.08)',   border: 'rgba(230,57,70,0.2)',    icono: Info          },
    PROMO:         { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    icono: Gift          },
}

function formatPeso(n) {
    return `$${n.toLocaleString('es-CO')}`
}
function formatFecha(str) {
    const d = new Date(str)
    return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── Hero visitante ───────────────────────────────────────────────────────────
function HeroVisitante({ visitante }) {
    if (!visitante) return null
    const { nombre, tipoTicket, saldo, puntosAcumulados, visitasTotal } = visitante

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.97), rgba(13,15,20,0.99))', border: '0.5px solid var(--c-border)' }}
        >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                            style={{ background: 'linear-gradient(135deg,#2a9d8f,#457b9d)', fontFamily: 'var(--font-display)', color: 'white', boxShadow: '0 0 30px rgba(42,157,143,0.3)' }}
                        >
                            {nombre.split(' ').slice(0, 2).map(w => w[0]).join('')}
                        </div>
                        <div
                            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background: tipoTicket === 'FASTPASS' ? '#e9c46a' : tipoTicket === 'FAMILIAR' ? '#2a9d8f' : '#457b9d', boxShadow: `0 0 10px ${tipoTicket === 'FASTPASS' ? '#e9c46a' : '#2a9d8f'}66` }}
                        >
                            {tipoTicket === 'FASTPASS' ? <Zap size={12} color="#000" /> : <Ticket size={12} color="#fff" />}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                            Bienvenido de vuelta
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            {nombre}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={tipoTicket === 'FASTPASS' ? 'fastpass' : tipoTicket === 'FAMILIAR' ? 'active' : 'info'} dot>
                                Ticket {tipoTicket}
                            </Badge>
                            <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--c-dim)', border: '0.5px solid var(--c-border)' }}>
                <Trophy size={10} className="inline mr-1" style={{ color: '#e9c46a' }} />
                                {puntosAcumulados.toLocaleString('es-CO')} pts
              </span>
                        </div>
                    </div>

                    {/* Stats rápidas */}
                    <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                        {[
                            { label: 'Saldo',    value: formatPeso(saldo),         color: '#22c55e' },
                            { label: 'Puntos',   value: puntosAcumulados.toLocaleString('es-CO'), color: '#e9c46a' },
                            { label: 'Visitas',  value: visitasTotal,              color: '#6a4c93' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="glass rounded-xl px-4 py-3 text-center">
                                <div className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
                                <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Registro rápido ──────────────────────────────────────────────────────────
function RegistroRapido({ onRegistrar }) {
    const [form, setForm] = useState({ nombre: '', edad: '', estatura: '', saldo: '', tipoTicket: 'GENERAL' })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors]   = useState({})

    function validate() {
        const e = {}
        if (!form.nombre.trim()) e.nombre = 'Nombre requerido'
        if (!form.edad || form.edad < 1 || form.edad > 120) e.edad = 'Edad inválida (1-120)'
        if (!form.estatura || form.estatura < 50) e.estatura = 'Estatura inválida'
        if (!form.saldo || form.saldo < 0) e.saldo = 'Saldo inválido'
        return e
    }

    async function handleSubmit() {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        setErrors({})
        setLoading(true)
        try {
            const res = await visitanteService.registrar(form)
            onRegistrar(res.data)
        } catch {
            onRegistrar({ id: Date.now(), ...form, puntosAcumulados: 0, visitasTotal: 0 })
        } finally { setLoading(false) }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                    <User size={15} style={{ color: '#2a9d8f' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Registro de visitante</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Obtén tu ticket y accede a todas las funciones</p>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <Input label="Nombre completo" placeholder="Tu nombre" value={form.nombre} onChange={f('nombre')} error={errors.nombre} />
                    <Input label="Edad" type="number" placeholder="Ej: 24" value={form.edad} onChange={f('edad')} error={errors.edad} />
                    <Input label="Estatura (cm)" type="number" placeholder="Ej: 175" value={form.estatura} onChange={f('estatura')} error={errors.estatura} />
                    <Input label="Saldo virtual ($COP)" type="number" placeholder="Ej: 80000" value={form.saldo} onChange={f('saldo')} error={errors.saldo} />
                    <Select label="Tipo de ticket" value={form.tipoTicket} onChange={f('tipoTicket')}>
                        <option value="GENERAL">General — $35.000</option>
                        <option value="FAMILIAR">Familiar — $90.000</option>
                        <option value="FASTPASS">FastPass — $65.000</option>
                    </Select>
                    <div className="flex items-end">
                        <Button variant="primary" size="md" loading={loading} onClick={handleSubmit} className="w-full justify-center">
                            <Ticket size={14} /> Registrarme y obtener ticket
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
function SeccionTickets({ ticketActual, onComprar }) {
    return (
        <div className="mb-8">
            <div className="mb-5">
                <h2 className="section-title">Tipos de ticket</h2>
                <p className="section-subtitle">Elige el que mejor se adapte a tu visita</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TICKETS.map((t) => {
                    const activo = ticketActual === t.tipo
                    return (
                        <div
                            key={t.tipo}
                            className="relative rounded-2xl p-5 overflow-hidden group transition-transform duration-300 hover:scale-[1.02]"
                            style={{
                                background: activo ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                                border: `${activo ? '1.5px' : '0.5px'} solid ${activo ? t.color : 'var(--c-border)'}`,
                            }}
                        >
                            {t.popular && (
                                <div
                                    className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                                    style={{ background: `${t.color}22`, color: t.color, fontFamily: 'var(--font-display)', border: `0.5px solid ${t.color}44` }}
                                >
                                    Popular
                                </div>
                            )}
                            {activo && (
                                <div
                                    className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                    style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.25)' }}
                                >
                                    <CheckCircle size={10} /> Tu ticket
                                </div>
                            )}

                            <div className="mb-4 mt-2">
                                <div className="text-3xl mb-2">{t.icono}</div>
                                <h3 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{t.label}</h3>
                                <div className="text-2xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)', color: t.color }}>
                                    {formatPeso(t.precio)}
                                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--c-muted)' }}>/persona</span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-5">
                                {t.beneficios.map((b) => (
                                    <li key={b} className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-dim)' }}>
                                        <CheckCircle size={12} style={{ color: t.color, flexShrink: 0 }} />
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => onComprar(t.tipo)}
                                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                                style={{
                                    background: activo ? `${t.color}30` : `${t.color}18`,
                                    color: t.color,
                                    border: `0.5px solid ${t.color}40`,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                {activo ? <><CheckCircle size={14} /> Activo</> : <><CreditCard size={14} /> Comprar</>}
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Cola virtual ─────────────────────────────────────────────────────────────
function ColaVirtual({ visitanteId, atracciones }) {
    const [seleccionada, setSeleccionada] = useState('')
    const [posicion,     setPosicion]     = useState(null)
    const [loading,      setLoading]      = useState(false)
    const [colaActiva,   setColaActiva]   = useState(null)

    const activas = atracciones.filter(a => a.estado === 'ACTIVA')

    async function unirse() {
        if (!seleccionada) return
        setLoading(true)
        const atraccion = atracciones.find(a => a.id === Number(seleccionada))
        try {
            const res = await visitanteService.unirseACola(visitanteId, seleccionada)
            setPosicion(res.data.posicion ?? 3)
        } catch {
            setPosicion(Math.floor(Math.random() * 15) + 1)
        } finally {
            setColaActiva(atraccion)
            setLoading(false)
        }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Users size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Cola virtual</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Únete sin esperar en físico</p>
                </div>
            </div>

            <div className="p-6">
                <div className="flex gap-3 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <Select label="Seleccionar atracción" value={seleccionada} onChange={e => setSeleccionada(e.target.value)}>
                            <option value="">Elige una atracción…</option>
                            {activas.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre} — ~{a.espera} min</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" size="md" loading={loading} onClick={unirse}>
                            <Plus size={14} /> Unirme a la cola
                        </Button>
                    </div>
                </div>

                {/* Panel de posición */}
                {posicion !== null && colaActiva && (
                    <div
                        className="rounded-2xl p-5"
                        style={{ background: 'rgba(230,57,70,0.06)', border: '0.5px solid rgba(230,57,70,0.2)' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                                    Tu posición en
                                </p>
                                <h3 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                    {colaActiva.nombre}
                                </h3>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#e63946' }}>
                                    #{posicion}
                                </div>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>en la cola</p>
                            </div>
                        </div>

                        <div className="mb-3">
                            <ProgressBar
                                value={Math.max(1, 20 - posicion)}
                                max={20}
                                color="#e63946"
                            />
                        </div>

                        <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--c-muted)' }}>
                <Clock size={10} className="inline mr-1" />
                Espera estimada: ~{colaActiva.espera} min
              </span>
                            <Badge variant={colaActiva.espera < 15 ? 'active' : 'pending'} dot>
                                {colaActiva.espera < 15 ? 'Poco tiempo' : 'Alta demanda'}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* Lista de colas activas */}
                <div className="mt-5 space-y-2">
                    <p className="text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                        Estado de atracciones
                    </p>
                    {activas.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="status-dot active" />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{a.nombre}</p>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{a.zona} · Alt. mín. {a.alturaMin}cm</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold font-mono" style={{ color: '#2a9d8f', fontFamily: 'var(--font-mono)' }}>{a.cola}</div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>en cola</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Favoritos ────────────────────────────────────────────────────────────────
function Favoritos({ favoritos, setFavoritos, visitanteId }) {
    async function quitar(id) {
        try { await visitanteService.quitarFavorito(visitanteId, id) } catch {}
        setFavoritos(prev => prev.filter(f => f.id !== id))
    }

    const ZONE_COLORS = { Aventura: '#f4a261', Acuática: '#457b9d', Espectáculos: '#6a4c93' }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Heart size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Mis favoritos</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{favoritos.length} atracciones guardadas</p>
                </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoritos.length === 0 && (
                    <div className="col-span-2 py-10 text-center" style={{ color: 'var(--c-muted)' }}>
                        <Heart size={30} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Aún no tienes favoritos</p>
                    </div>
                )}
                {favoritos.map((f) => {
                    const accent = ZONE_COLORS[f.zona] || '#6a4c93'
                    return (
                        <div
                            key={f.id}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 group"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${accent}30` }}
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${accent}18`, border: `0.5px solid ${accent}30` }}
                            >
                                <Activity size={15} style={{ color: accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{f.nombre}</p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {f.zona}
                                    {f.estado === 'ACTIVA' && ` · ~${f.espera} min`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={f.estado} />
                                <button
                                    onClick={() => quitar(f.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946' }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Historial ────────────────────────────────────────────────────────────────
function Historial({ historial }) {
    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                        <History size={15} style={{ color: '#6a4c93' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Historial de visitas</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{historial.length} atracciones visitadas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <StatCard
                        label="" value={historial.reduce((s, h) => s + h.duracion, 0) + ' min'}
                        sub="tiempo total" accent="#6a4c93"
                        className="!p-2 !rounded-xl"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="tp-table">
                    <thead>
                    <tr>
                        <th>Atracción</th>
                        <th className="hidden sm:table-cell">Fecha y hora</th>
                        <th>Ticket</th>
                        <th className="hidden md:table-cell">Duración</th>
                    </tr>
                    </thead>
                    <tbody>
                    {historial.map((h, i) => (
                        <tr key={h.id}>
                            <td>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                                        style={{ background: 'rgba(106,76,147,0.15)', color: '#6a4c93', fontFamily: 'var(--font-display)', fontWeight: 700 }}
                                    >
                                        {i + 1}
                                    </div>
                                    <span className="text-sm" style={{ color: 'var(--c-text)' }}>{h.atraccion}</span>
                                </div>
                            </td>
                            <td className="hidden sm:table-cell">
                  <span className="font-mono text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)' }}>
                    {formatFecha(h.fecha)}
                  </span>
                            </td>
                            <td>
                                <Badge variant={h.ticket === 'FASTPASS' ? 'fastpass' : h.ticket === 'FAMILIAR' ? 'active' : 'info'}>
                                    {h.ticket}
                                </Badge>
                            </td>
                            <td className="hidden md:table-cell">
                  <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-dim)' }}>
                    {h.duracion} min
                  </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Notificaciones ───────────────────────────────────────────────────────────
function Notificaciones({ notifs, setNotifs }) {
    function marcarLeida(id) {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    }

    const noLeidas = notifs.filter(n => !n.leida).length

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                            <Bell size={15} style={{ color: '#e9c46a' }} />
                        </div>
                        {noLeidas > 0 && (
                            <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                                style={{ background: '#e63946', color: 'white', fontSize: 9, fontFamily: 'var(--font-display)' }}
                            >
                {noLeidas}
              </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Notificaciones</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{noLeidas} sin leer</p>
                    </div>
                </div>
                {noLeidas > 0 && (
                    <button
                        className="text-xs" style={{ color: 'var(--c-muted)' }}
                        onClick={() => setNotifs(prev => prev.map(n => ({ ...n, leida: true })))}
                    >
                        Marcar todas
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {notifs.map((n) => {
                    const cfg = NOTIF_COLORS[n.tipo] || NOTIF_COLORS.CLIMA
                    const Icono = cfg.icono
                    return (
                        <div
                            key={n.id}
                            className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all"
                            style={{
                                background: n.leida ? 'rgba(255,255,255,0.02)' : cfg.bg,
                                border: `0.5px solid ${n.leida ? 'var(--c-border)' : cfg.border}`,
                                opacity: n.leida ? 0.65 : 1,
                            }}
                            onClick={() => marcarLeida(n.id)}
                        >
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: `${cfg.color}20` }}
                            >
                                <Icono size={13} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed" style={{ color: n.leida ? 'var(--c-muted)' : 'var(--c-text)', fontFamily: 'var(--font-body)' }}>
                                    {n.mensaje}
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs font-mono" style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', fontSize: 10 }}>{n.fecha}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color, fontSize: 10 }}>{n.tipo}</span>
                                </div>
                            </div>
                            {!n.leida && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Visitante() {
    const [visitante,   setVisitante]   = useState(DEMO_VISITANTE)
    const [atracciones, setAtracciones] = useState(DEMO_ATRACCIONES)
    const [historial,   setHistorial]   = useState(DEMO_HISTORIAL)
    const [favoritos,   setFavoritos]   = useState(DEMO_FAVORITOS)
    const [notifs,      setNotifs]      = useState(DEMO_NOTIFICACIONES)
    const [tab,         setTab]         = useState('cola') // cola | favoritos | historial

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await atraccionService.getAll()
                if (res?.data) setAtracciones(res.data)
            } catch {}
        }
        fetchData()
    }, [])

    function handleRegistrar(data) {
        setVisitante(prev => ({ ...prev, ...data }))
    }

    function handleComprar(tipo) {
        setVisitante(prev => ({ ...prev, tipoTicket: tipo }))
    }

    const TABS = [
        { id: 'cola',      label: 'Cola virtual',  icon: Users   },
        { id: 'favoritos', label: 'Favoritos',      icon: Heart   },
        { id: 'historial', label: 'Historial',      icon: History },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {/* Hero */}
            <HeroVisitante visitante={visitante} />

            {/* Registro */}
            <RegistroRapido onRegistrar={handleRegistrar} />

            {/* Tickets */}
            <SeccionTickets ticketActual={visitante?.tipoTicket} onComprar={handleComprar} />

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* 2-col layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left 2/3 — tabs */}
                <div className="xl:col-span-2">
                    {/* Tab bar */}
                    <div
                        className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}
                    >
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTab(id)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                                style={{
                                    background: tab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: tab === id ? 'var(--c-text)' : 'var(--c-muted)',
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: tab === id ? 600 : 400,
                                    border: tab === id ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
                                }}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'cola'      && <ColaVirtual visitanteId={visitante?.id} atracciones={atracciones} />}
                    {tab === 'favoritos' && <Favoritos   favoritos={favoritos} setFavoritos={setFavoritos} visitanteId={visitante?.id} />}
                    {tab === 'historial' && <Historial   historial={historial} />}
                </div>

                {/* Right 1/3 — Notificaciones sticky */}
                <div className="xl:col-span-1">
                    <div className="sticky top-24">
                        <Notificaciones notifs={notifs} setNotifs={setNotifs} />

                        {/* Quick stats */}
                        <div className="glass rounded-2xl p-5 mt-5">
                            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                Mis estadísticas
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Atracciones visitadas', value: historial.length,          max: 15,  color: '#6a4c93' },
                                    { label: 'Favoritos guardados',   value: favoritos.length,           max: 10,  color: '#e63946' },
                                    { label: 'Notificaciones leídas', value: notifs.filter(n=>n.leida).length, max: notifs.length || 1, color: '#2a9d8f' },
                                ].map(({ label, value, max, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span style={{ color: 'var(--c-muted)' }}>{label}</span>
                                            <span className="font-mono font-bold" style={{ fontFamily: 'var(--font-mono)', color }}>{value}</span>
                                        </div>
                                        <ProgressBar value={value} max={max} color={color} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}