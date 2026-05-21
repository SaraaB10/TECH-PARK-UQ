import { useState, useEffect, useCallback } from 'react'
import {
    User, Star, Clock, Users, Ticket, Bell,
    Heart, History, Plus, CheckCircle,
    Zap, Trophy, Gift,
    AlertTriangle, Info, Sparkles,
    CreditCard, Activity, X, RefreshCw,
    MapPin
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input, Select } from '@/components/ui/Input'
import { visitanteService, atraccionService, alertaService } from '@/services/parqueService'

// ─── Constantes estáticas (NO son datos DEMO, son configuración UI) ────────────

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

// Mapeo de tipos de notificación a estilos visuales
// El backend puede devolver distintos tipos; los que no coincidan usan CLIMA como fallback
const NOTIF_COLORS = {
    CLIMA:         { color: '#e9c46a', bg: 'rgba(233,196,106,0.1)',  border: 'rgba(233,196,106,0.25)', icono: AlertTriangle },
    SHOW:          { color: '#6a4c93', bg: 'rgba(106,76,147,0.1)',   border: 'rgba(106,76,147,0.25)',  icono: Sparkles      },
    MANTENIMIENTO: { color: '#e63946', bg: 'rgba(230,57,70,0.08)',   border: 'rgba(230,57,70,0.2)',    icono: Info          },
    PROMO:         { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    icono: Gift          },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPeso(n) {
    if (n == null || isNaN(n)) return '$0'
    return `$${Number(n).toLocaleString('es-CO')}`
}

// El historial del backend devuelve strings planos, no objetos con fecha ISO
// Solo mostramos el texto tal como viene
function truncate(str, max = 60) {
    if (!str) return ''
    return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Hero visitante ───────────────────────────────────────────────────────────
// Recibe: { nombre, tipoTicket, saldo, visitasTotal }
// visitasTotal se deriva de historial.length en el componente padre
function HeroVisitante({ visitante, saldo, visitasTotal }) {
    if (!visitante) return null
    const { nombre, tipoTicket } = visitante

    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{
                background: 'linear-gradient(135deg, rgba(26,29,40,0.97), rgba(13,15,20,0.99))',
                border: '0.5px solid var(--c-border)',
            }}
        >
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl"
                 style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl"
                 style={{ background: '#6a4c93' }} />

            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                            style={{
                                background: 'linear-gradient(135deg,#2a9d8f,#457b9d)',
                                fontFamily: 'var(--font-display)',
                                color: 'white',
                                boxShadow: '0 0 30px rgba(42,157,143,0.3)',
                            }}
                        >
                            {nombre
                                ? nombre.split(' ').slice(0, 2).map(w => w[0]).join('')
                                : '?'}
                        </div>
                        <div
                            className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                                background: tipoTicket === 'FASTPASS' ? '#e9c46a'
                                    : tipoTicket === 'FAMILIAR' ? '#2a9d8f' : '#457b9d',
                                boxShadow: `0 0 10px ${tipoTicket === 'FASTPASS' ? '#e9c46a' : '#2a9d8f'}66`,
                            }}
                        >
                            {tipoTicket === 'FASTPASS'
                                ? <Zap size={12} color="#000" />
                                : <Ticket size={12} color="#fff" />}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest mb-1"
                           style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                            Bienvenido de vuelta
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight mb-2"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            {nombre}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                variant={tipoTicket === 'FASTPASS' ? 'fastpass' : tipoTicket === 'FAMILIAR' ? 'active' : 'info'}
                                dot
                            >
                                Ticket {tipoTicket || 'GENERAL'}
                            </Badge>
                        </div>
                    </div>

                    {/* Stats rápidas — saldo real y visitas derivadas de historial */}
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                        {[
                            { label: 'Saldo',   value: formatPeso(saldo),  color: '#22c55e' },
                            { label: 'Visitas', value: visitasTotal ?? 0,   color: '#6a4c93' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className="glass rounded-xl px-4 py-3 text-center">
                                <div className="text-lg font-bold"
                                     style={{ fontFamily: 'var(--font-display)', color }}>{value}</div>
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
// POST /api/visitantes/registrar
// Respuesta del backend: { mensaje, idVisitante, idTicket, tipoTicket }
function RegistroRapido({ onRegistrar }) {
    const [form, setForm] = useState({
        nombre: '',
        edad: '',
        telefono: '',
        email: '',
        contrasena: '',
        estatura: '',
        saldoVirtual: '',
        tipoTicket: 'GENERAL',
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors]   = useState({})
    const [exito, setExito]     = useState(null) // mensaje de éxito del backend

    function validate() {
        const e = {}
        if (!form.nombre.trim())              e.nombre      = 'Nombre requerido'
        if (!form.edad || form.edad < 1 || form.edad > 120) e.edad = 'Edad inválida (1–120)'
        if (!form.estatura || form.estatura < 50)           e.estatura = 'Estatura inválida'
        if (!form.saldoVirtual || form.saldoVirtual < 0)    e.saldoVirtual = 'Saldo inválido'
        if (!form.email.trim())               e.email       = 'Email requerido'
        if (!form.contrasena.trim())          e.contrasena  = 'Contraseña requerida'
        return e
    }

    async function handleSubmit() {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        setErrors({})
        setLoading(true)
        setExito(null)
        try {
            const res = await visitanteService.registrar({
                nombre:       form.nombre.trim(),
                edad:         Number(form.edad),
                telefono:     form.telefono.trim() || '0000000000',
                email:        form.email.trim(),
                contrasena:   form.contrasena.trim(),
                // El backend espera metros (double), el formulario recibe cm
                estatura:     Number(form.estatura) / 100,
                saldoVirtual: Number(form.saldoVirtual),
                tipoTicket:   form.tipoTicket,
            })
            // res.data = { mensaje, idVisitante, idTicket, tipoTicket }
            const { mensaje, idVisitante, tipoTicket } = res.data
            setExito(mensaje)
            onRegistrar({
                id:         idVisitante,
                nombre:     form.nombre.trim(),
                tipoTicket: tipoTicket,
            })
        } catch (err) {
            const msg = err?.response?.data || 'Error al registrar visitante'
            setErrors({ general: typeof msg === 'string' ? msg : 'Error al registrar' })
        } finally {
            setLoading(false)
        }
    }

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                    <User size={15} style={{ color: '#2a9d8f' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Registro de visitante
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        Obtén tu ticket y accede a todas las funciones
                    </p>
                </div>
            </div>

            <div className="p-6">
                {exito && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                         style={{ background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                        <CheckCircle size={14} /> {exito}
                    </div>
                )}
                {errors.general && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                         style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                        <AlertTriangle size={14} /> {errors.general}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <Input
                        label="Nombre completo" placeholder="Tu nombre"
                        value={form.nombre} onChange={f('nombre')} error={errors.nombre}
                    />
                    <Input
                        label="Email" type="email" placeholder="correo@ejemplo.com"
                        value={form.email} onChange={f('email')} error={errors.email}
                    />
                    <Input
                        label="Contraseña" type="password" placeholder="••••••••"
                        value={form.contrasena} onChange={f('contrasena')} error={errors.contrasena}
                    />
                    <Input
                        label="Edad" type="number" placeholder="Ej: 24"
                        value={form.edad} onChange={f('edad')} error={errors.edad}
                    />
                    <Input
                        label="Estatura (cm)" type="number" placeholder="Ej: 175"
                        value={form.estatura} onChange={f('estatura')} error={errors.estatura}
                    />
                    <Input
                        label="Teléfono" type="tel" placeholder="Ej: 3001234567"
                        value={form.telefono} onChange={f('telefono')}
                    />
                    <Input
                        label="Saldo virtual ($COP)" type="number" placeholder="Ej: 80000"
                        value={form.saldoVirtual} onChange={f('saldoVirtual')} error={errors.saldoVirtual}
                    />
                    <Select label="Tipo de ticket" value={form.tipoTicket} onChange={f('tipoTicket')}>
                        <option value="GENERAL">General — $35.000</option>
                        <option value="FAMILIAR">Familiar — $90.000</option>
                        <option value="FASTPASS">FastPass — $65.000</option>
                    </Select>
                    <div className="flex items-end">
                        <Button
                            variant="primary" size="md" loading={loading}
                            onClick={handleSubmit} className="w-full justify-center"
                        >
                            <Ticket size={14} /> Registrarme y obtener ticket
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Tickets ──────────────────────────────────────────────────────────────────
// Los tickets son solo informativos — el tipo real viene del registro en el backend
// No hay endpoint de "comprar ticket" separado: el ticket se asigna al registrar
function SeccionTickets({ ticketActual }) {
    return (
        <div className="mb-8">
            <div className="mb-5">
                <h2 className="section-title">Tipos de ticket</h2>
                <p className="section-subtitle">El ticket se asigna al registrarse en el parque</p>
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
                                    style={{
                                        background: `${t.color}22`,
                                        color: t.color,
                                        fontFamily: 'var(--font-display)',
                                        border: `0.5px solid ${t.color}44`,
                                    }}
                                >
                                    Popular
                                </div>
                            )}
                            {activo && (
                                <div
                                    className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                    style={{
                                        background: 'rgba(34,197,94,0.12)',
                                        color: '#22c55e',
                                        border: '0.5px solid rgba(34,197,94,0.25)',
                                    }}
                                >
                                    <CheckCircle size={10} /> Tu ticket
                                </div>
                            )}

                            <div className="mb-4 mt-2">
                                <div className="text-3xl mb-2">{t.icono}</div>
                                <h3 className="text-lg font-bold"
                                    style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                    {t.label}
                                </h3>
                                <div className="text-2xl font-bold mt-1"
                                     style={{ fontFamily: 'var(--font-display)', color: t.color }}>
                                    {formatPeso(t.precio)}
                                    <span className="text-xs font-normal ml-1" style={{ color: 'var(--c-muted)' }}>/persona</span>
                                </div>
                            </div>

                            <ul className="space-y-2 mb-5">
                                {t.beneficios.map((b) => (
                                    <li key={b} className="flex items-center gap-2 text-xs"
                                        style={{ color: 'var(--c-dim)' }}>
                                        <CheckCircle size={12} style={{ color: t.color, flexShrink: 0 }} />
                                        {b}
                                    </li>
                                ))}
                            </ul>

                            <div
                                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                style={{
                                    background: activo ? `${t.color}30` : `${t.color}18`,
                                    color: t.color,
                                    border: `0.5px solid ${t.color}40`,
                                    fontFamily: 'var(--font-display)',
                                }}
                            >
                                {activo ? <><CheckCircle size={14} /> Activo</> : <><CreditCard size={14} /> {formatPeso(t.precio)}</>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Cola virtual ─────────────────────────────────────────────────────────────
// POST /api/atracciones/{id}/ingresar?idVisitante={visitanteId}
// Respuesta: string con mensaje de resultado (acceso concedido, en cola, requisito no cumplido, etc.)
// GET  /api/atracciones/{id}/cola → { atraccion, visitantesEnCola }
// GET  /api/atracciones         → lista con { id, nombre, estado, tiempoEsperaEstimado, alturaMinima, ... }
function ColaVirtual({ visitanteId, atracciones }) {
    const [seleccionada, setSeleccionada] = useState('')
    const [resultado,    setResultado]    = useState(null)  // string del backend
    const [colaInfo,     setColaInfo]     = useState(null)  // { atraccion, visitantesEnCola }
    const [colaActiva,   setColaActiva]   = useState(null)  // objeto atraccion seleccionada
    const [loading,      setLoading]      = useState(false)
    const [loadingCola,  setLoadingCola]  = useState(false)

    // Solo atracciones activas para el selector
    const activas = atracciones.filter(a => a.estado === 'ACTIVA')

    async function unirse() {
        if (!seleccionada || !visitanteId) return
        setLoading(true)
        setResultado(null)
        setColaInfo(null)

        const atraccion = atracciones.find(a => a.id === seleccionada)
        try {
            // POST /api/atracciones/{id}/ingresar?idVisitante={vid}
            const res = await visitanteService.unirseACola(seleccionada, visitanteId)
            // El backend devuelve un string directo (no JSON estructurado)
            setResultado(res.data)
            setColaActiva(atraccion)

            // Si el mensaje indica que quedó en cola, obtenemos el tamaño
            await fetchCola(seleccionada)
        } catch (err) {
            const msg = err?.response?.data
            setResultado(typeof msg === 'string' ? msg : 'No se pudo procesar la solicitud')
            setColaActiva(atraccion)
        } finally {
            setLoading(false)
        }
    }

    async function fetchCola(atraccionId) {
        setLoadingCola(true)
        try {
            // GET /api/atracciones/{id}/cola → { atraccion, visitantesEnCola }
            const res = await atraccionService.getCola(atraccionId)
            setColaInfo(res.data)
        } catch {
            setColaInfo(null)
        } finally {
            setLoadingCola(false)
        }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Users size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Cola virtual
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        Únete sin esperar en físico
                    </p>
                </div>
            </div>

            <div className="p-6">
                {!visitanteId && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-xs flex items-center gap-2"
                         style={{ background: 'rgba(233,196,106,0.08)', border: '0.5px solid rgba(233,196,106,0.2)', color: '#e9c46a' }}>
                        <AlertTriangle size={13} /> Regístrate primero para unirte a la cola
                    </div>
                )}

                <div className="flex gap-3 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <Select
                            label="Seleccionar atracción"
                            value={seleccionada}
                            onChange={e => setSeleccionada(e.target.value)}
                        >
                            <option value="">Elige una atracción…</option>
                            {activas.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}
                                    {a.tiempoEsperaEstimado > 0 ? ` — ~${a.tiempoEsperaEstimado} min` : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="primary" size="md"
                            loading={loading}
                            onClick={unirse}
                            disabled={!visitanteId || !seleccionada}
                        >
                            <Plus size={14} /> Unirme a la cola
                        </Button>
                    </div>
                </div>

                {/* Respuesta del backend tras intentar ingresar */}
                {resultado && colaActiva && (
                    <div
                        className="rounded-2xl p-5 mb-5"
                        style={{ background: 'rgba(230,57,70,0.06)', border: '0.5px solid rgba(230,57,70,0.2)' }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1"
                                   style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                                    Resultado — {colaActiva.nombre}
                                </p>
                                <p className="text-sm leading-relaxed"
                                   style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>
                                    {resultado}
                                </p>
                            </div>
                            {/* Tamaño real de la cola desde el backend */}
                            {colaInfo && (
                                <div className="text-right ml-4 flex-shrink-0">
                                    <div className="text-4xl font-bold"
                                         style={{ fontFamily: 'var(--font-display)', color: '#e63946' }}>
                                        {loadingCola ? '…' : colaInfo.visitantesEnCola}
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>en cola</p>
                                </div>
                            )}
                        </div>

                        {colaInfo && (
                            <div className="mb-3">
                                <ProgressBar
                                    value={Math.max(1, 20 - (colaInfo.visitantesEnCola || 0))}
                                    max={20}
                                    color="#e63946"
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--c-muted)' }}>
                                <Clock size={10} className="inline mr-1" />
                                Espera estimada: ~{colaActiva.tiempoEsperaEstimado ?? 0} min
                            </span>
                            {colaInfo && (
                                <Badge
                                    variant={(colaInfo.visitantesEnCola ?? 0) < 15 ? 'active' : 'pending'}
                                    dot
                                >
                                    {(colaInfo.visitantesEnCola ?? 0) < 15 ? 'Poco tiempo' : 'Alta demanda'}
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Lista de atracciones activas con datos reales del backend */}
                <div className="mt-5 space-y-2">
                    <p className="text-xs uppercase tracking-widest mb-3"
                       style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>
                        Estado de atracciones activas
                    </p>
                    {activas.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--c-muted)' }}>
                            No hay atracciones activas en este momento
                        </p>
                    )}
                    {activas.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between rounded-xl px-4 py-3"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}
                        >
                            <div className="flex items-center gap-3">
                                <span className="status-dot active" />
                                <div>
                                    <p className="text-sm font-medium"
                                       style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>
                                        {a.nombre}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                        {a.tipo}
                                        {a.alturaMinima > 0 ? ` · Alt. mín. ${Math.round(a.alturaMinima * 100)}cm` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold font-mono"
                                     style={{ color: '#2a9d8f', fontFamily: 'var(--font-mono)' }}>
                                    {a.contadorVisitantes}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>visitantes</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Favoritos ────────────────────────────────────────────────────────────────
// POST /api/visitantes/{id}/favorito?idAtraccion={atraccionId}  → string resultado
// No existe GET de favoritos en el backend.
// Los favoritos se gestionan localmente: se agrega buscando la atracción en la lista cargada,
// y se persiste solo la confirmación del backend.
// "Quitar favorito" no tiene endpoint → solo se elimina del estado local.
function Favoritos({ favoritos, setFavoritos, visitanteId, atracciones }) {
    const [seleccionada, setSeleccionada] = useState('')
    const [loading,      setLoading]      = useState(false)
    const [msg,          setMsg]          = useState(null)

    // Atracciones que aún no están en favoritos
    const disponibles = atracciones.filter(
        a => !favoritos.some(f => f.id === a.id)
    )

    async function agregar() {
        if (!seleccionada || !visitanteId) return
        setLoading(true)
        setMsg(null)
        try {
            // POST /api/visitantes/{id}/favorito?idAtraccion={atraccionId}
            const res = await visitanteService.agregarFavorito(visitanteId, seleccionada)
            const atraccion = atracciones.find(a => a.id === seleccionada)
            if (atraccion) {
                setFavoritos(prev => [...prev, atraccion])
            }
            setMsg(res.data) // mensaje del backend
            setSeleccionada('')
        } catch (err) {
            const errMsg = err?.response?.data
            setMsg(typeof errMsg === 'string' ? errMsg : 'No se pudo agregar a favoritos')
        } finally {
            setLoading(false)
        }
    }

    // No hay endpoint para quitar favorito → solo local
    function quitar(id) {
        setFavoritos(prev => prev.filter(f => f.id !== id))
    }

    const TIPO_COLORS = {
        MECANICA:    '#f4a261',
        ACUATICA:    '#457b9d',
        SHOW:        '#6a4c93',
        INFANTIL:    '#2a9d8f',
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Heart size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Mis favoritos
                    </h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        {favoritos.length} atracciones guardadas
                    </p>
                </div>
            </div>

            {/* Agregar favorito */}
            {visitanteId && (
                <div className="px-5 pt-4 pb-2 border-b flex gap-3 flex-wrap"
                     style={{ borderColor: 'var(--c-border)' }}>
                    <div className="flex-1 min-w-[180px]">
                        <Select
                            label="Agregar atracción"
                            value={seleccionada}
                            onChange={e => setSeleccionada(e.target.value)}
                        >
                            <option value="">Elige una atracción…</option>
                            {disponibles.map(a => (
                                <option key={a.id} value={a.id}>{a.nombre}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end pb-0.5">
                        <Button
                            variant="outline" size="sm"
                            loading={loading}
                            onClick={agregar}
                            disabled={!seleccionada}
                        >
                            <Heart size={13} /> Guardar
                        </Button>
                    </div>
                    {msg && (
                        <p className="w-full text-xs mt-1" style={{ color: '#2a9d8f' }}>{msg}</p>
                    )}
                </div>
            )}

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favoritos.length === 0 && (
                    <div className="col-span-2 py-10 text-center" style={{ color: 'var(--c-muted)' }}>
                        <Heart size={30} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Aún no tienes favoritos</p>
                    </div>
                )}
                {favoritos.map((f) => {
                    const accent = TIPO_COLORS[f.tipo] || '#6a4c93'
                    return (
                        <div
                            key={f.id}
                            className="flex items-center gap-3 rounded-xl px-4 py-3 group"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: `0.5px solid ${accent}30`,
                            }}
                        >
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: `${accent}18`, border: `0.5px solid ${accent}30` }}
                            >
                                <Activity size={15} style={{ color: accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate"
                                   style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                    {f.nombre}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {f.tipo}
                                    {f.estado === 'ACTIVA' && f.tiempoEsperaEstimado > 0
                                        ? ` · ~${f.tiempoEsperaEstimado} min`
                                        : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={f.estado} />
                                <button
                                    onClick={() => quitar(f.id)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946' }}
                                    title="Quitar de favoritos"
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
// GET /api/visitantes/{id}/historial
// Respuesta: { visitante: string, historial: string[] }
// El backend devuelve un array de strings planos, no objetos estructurados.
// Se renderiza cada entrada tal como viene.
function Historial({ historial, visitanteNombre }) {
    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center justify-between"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                         style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                        <History size={15} style={{ color: '#6a4c93' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Historial de visitas
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                            {historial.length} entradas registradas
                            {visitanteNombre ? ` · ${visitanteNombre}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                {historial.length === 0 ? (
                    <div className="py-10 text-center" style={{ color: 'var(--c-muted)' }}>
                        <History size={30} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Sin historial registrado aún</p>
                    </div>
                ) : (
                    <table className="tp-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>Registro</th>
                        </tr>
                        </thead>
                        <tbody>
                        {historial.map((entrada, i) => (
                            <tr key={i}>
                                <td>
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                                        style={{
                                            background: 'rgba(106,76,147,0.15)',
                                            color: '#6a4c93',
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: 700,
                                        }}
                                    >
                                        {i + 1}
                                    </div>
                                </td>
                                <td>
                                    <span className="text-sm" style={{ color: 'var(--c-text)' }}>
                                        {truncate(String(entrada), 80)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

// ─── Notificaciones ───────────────────────────────────────────────────────────
// GET /api/alertas/notificaciones/{idVisitante}
// Respuesta: lista de Map<String, Object> — estructura variable del backend
// Se renderizan los campos que vengan: mensaje (o descripcion), tipo, activa/leida, etc.
function Notificaciones({ notifs, setNotifs }) {
    // Marcar como leída localmente (el backend no tiene endpoint para esto)
    function marcarLeida(idx) {
        setNotifs(prev => prev.map((n, i) => i === idx ? { ...n, _leida: true } : n))
    }

    function marcarTodas() {
        setNotifs(prev => prev.map(n => ({ ...n, _leida: true })))
    }

    // Derivar tipo visual desde el objeto del backend
    // El backend puede devolver 'tipo', 'tipoAlerta', etc.
    function getTipo(n) {
        const t = (n.tipo || n.tipoAlerta || '').toUpperCase()
        if (t.includes('CLIMA') || t.includes('TORMENTA') || t.includes('LLUVIA')) return 'CLIMA'
        if (t.includes('SHOW') || t.includes('ESPECT'))                             return 'SHOW'
        if (t.includes('MANT'))                                                      return 'MANTENIMIENTO'
        return 'CLIMA' // fallback
    }

    // Extraer mensaje del objeto (el backend puede usar distintos campos)
    function getMensaje(n) {
        return n.mensaje || n.descripcion || n.texto || JSON.stringify(n)
    }

    // Fecha: el backend puede devolver distintos formatos
    function getFecha(n) {
        const raw = n.fecha || n.fechaHora || n.timestamp || ''
        if (!raw) return ''
        try {
            return new Date(raw).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        } catch {
            return String(raw).slice(0, 16)
        }
    }

    const noLeidas = notifs.filter(n => !n._leida && !(n.leida)).length

    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between"
                 style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
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
                        <h2 className="text-sm font-bold"
                            style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            Notificaciones
                        </h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{noLeidas} sin leer</p>
                    </div>
                </div>
                {noLeidas > 0 && (
                    <button className="text-xs" style={{ color: 'var(--c-muted)' }} onClick={marcarTodas}>
                        Marcar todas
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3">
                {notifs.length === 0 && (
                    <div className="py-6 text-center" style={{ color: 'var(--c-muted)' }}>
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Sin notificaciones</p>
                    </div>
                )}
                {notifs.map((n, idx) => {
                    const tipo  = getTipo(n)
                    const cfg   = NOTIF_COLORS[tipo]
                    const Icono = cfg.icono
                    // Una notificación está "leída" si el backend lo indica O si se marcó localmente
                    const leida = n._leida || n.leida || false

                    return (
                        <div
                            key={idx}
                            className="flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-all"
                            style={{
                                background: leida ? 'rgba(255,255,255,0.02)' : cfg.bg,
                                border: `0.5px solid ${leida ? 'var(--c-border)' : cfg.border}`,
                                opacity: leida ? 0.65 : 1,
                            }}
                            onClick={() => marcarLeida(idx)}
                        >
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ background: `${cfg.color}20` }}
                            >
                                <Icono size={13} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed"
                                   style={{ color: leida ? 'var(--c-muted)' : 'var(--c-text)', fontFamily: 'var(--font-body)' }}>
                                    {getMensaje(n)}
                                </p>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs font-mono"
                                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--c-muted)', fontSize: 10 }}>
                                        {getFecha(n)}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 rounded-full"
                                          style={{ background: `${cfg.color}18`, color: cfg.color, fontSize: 10 }}>
                                        {tipo}
                                    </span>
                                </div>
                            </div>
                            {!leida && (
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                      style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
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
    // Visitante registrado en esta sesión: { id, nombre, tipoTicket }
    // Viene del backend tras POST /api/visitantes/registrar
    const [visitante,   setVisitante]   = useState(null)

    // Saldo real: GET /api/visitantes/{id}/saldo → { visitante, saldo }
    const [saldo,       setSaldo]       = useState(null)

    // Atracciones: GET /api/atracciones → array de objetos con propiedades reales
    const [atracciones, setAtracciones] = useState([])

    // Historial: GET /api/visitantes/{id}/historial → { visitante, historial: string[] }
    const [historial,   setHistorial]   = useState([])

    // Favoritos: gestionados localmente (no hay GET en el backend)
    // Se pueblan al agregar desde la lista de atracciones
    const [favoritos,   setFavoritos]   = useState([])

    // Notificaciones: GET /api/alertas/notificaciones/{id}
    const [notifs,      setNotifs]      = useState([])

    const [tab,         setTab]         = useState('cola')
    const [loadingData, setLoadingData] = useState(false)
    const [error,       setError]       = useState(null)

    // Cargar atracciones al montar (no requieren visitante)
    useEffect(() => {
        async function fetchAtracciones() {
            setLoadingData(true)
            try {
                const res = await atraccionService.getAll()
                if (res?.data) setAtracciones(res.data)
            } catch {
                setError('No se pudieron cargar las atracciones')
            } finally {
                setLoadingData(false)
            }
        }
        fetchAtracciones()
    }, [])

    // Al registrar un visitante, cargar sus datos desde el backend
    const cargarDatosVisitante = useCallback(async (id) => {
        try {
            // GET /api/visitantes/{id}/saldo → { visitante, saldo }
            const saldoRes = await visitanteService.getSaldo(id)
            if (saldoRes?.data?.saldo != null) setSaldo(saldoRes.data.saldo)

            // GET /api/visitantes/{id}/historial → { visitante, historial: string[] }
            const histRes = await visitanteService.getHistorial(id)
            if (histRes?.data?.historial) setHistorial(histRes.data.historial)

            // GET /api/alertas/notificaciones/{id}
            const notifRes = await alertaService.getNotificaciones(id)
            if (notifRes?.data) setNotifs(notifRes.data)
        } catch {
            // Si falla alguna carga secundaria, no bloqueamos la UI
        }
    }, [])

    // Callback que recibe el resultado del registro
    function handleRegistrar(data) {
        // data = { id, nombre, tipoTicket } extraído de la respuesta del backend
        setVisitante(data)
        // Cargar saldo, historial y notificaciones con el ID real
        cargarDatosVisitante(data.id)
    }

    const TABS = [
        { id: 'cola',      label: 'Cola virtual', icon: Users   },
        { id: 'favoritos', label: 'Favoritos',     icon: Heart   },
        { id: 'historial', label: 'Historial',     icon: History },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>

            {/* Error global de carga */}
            {error && (
                <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
                     style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                    <AlertTriangle size={14} /> {error}
                    <button className="ml-auto" onClick={() => setError(null)}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Hero — solo se muestra si hay visitante registrado */}
            {visitante && (
                <HeroVisitante
                    visitante={visitante}
                    saldo={saldo}
                    visitasTotal={historial.length}
                />
            )}

            {/* Registro */}
            <RegistroRapido onRegistrar={handleRegistrar} />

            {/* Tickets — informativo, refleja el tipo actual del visitante */}
            <SeccionTickets ticketActual={visitante?.tipoTicket} />

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
                                    border: tab === id
                                        ? '0.5px solid rgba(255,255,255,0.1)'
                                        : '0.5px solid transparent',
                                }}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>

                    {loadingData && (
                        <div className="flex items-center gap-2 text-xs mb-4"
                             style={{ color: 'var(--c-muted)' }}>
                            <RefreshCw size={12} className="animate-spin" />
                            Cargando atracciones…
                        </div>
                    )}

                    {tab === 'cola' && (
                        <ColaVirtual
                            visitanteId={visitante?.id}
                            atracciones={atracciones}
                        />
                    )}
                    {tab === 'favoritos' && (
                        <Favoritos
                            favoritos={favoritos}
                            setFavoritos={setFavoritos}
                            visitanteId={visitante?.id}
                            atracciones={atracciones}
                        />
                    )}
                    {tab === 'historial' && (
                        <Historial
                            historial={historial}
                            visitanteNombre={visitante?.nombre}
                        />
                    )}
                </div>

                {/* Right 1/3 — Notificaciones sticky */}
                <div className="xl:col-span-1">
                    <div className="sticky top-24">
                        <Notificaciones notifs={notifs} setNotifs={setNotifs} />

                        {/* Quick stats derivadas de datos reales */}
                        <div className="glass rounded-2xl p-5 mt-5">
                            <h3 className="text-sm font-bold mb-4"
                                style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                Mis estadísticas
                            </h3>
                            <div className="space-y-4">
                                {[
                                    {
                                        label: 'Atracciones en historial',
                                        value: historial.length,
                                        max: Math.max(15, historial.length),
                                        color: '#6a4c93',
                                    },
                                    {
                                        label: 'Favoritos guardados',
                                        value: favoritos.length,
                                        max: Math.max(10, favoritos.length),
                                        color: '#e63946',
                                    },
                                    {
                                        label: 'Notificaciones leídas',
                                        value: notifs.filter(n => n._leida || n.leida).length,
                                        max: Math.max(1, notifs.length),
                                        color: '#2a9d8f',
                                    },
                                ].map(({ label, value, max, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span style={{ color: 'var(--c-muted)' }}>{label}</span>
                                            <span className="font-mono font-bold"
                                                  style={{ fontFamily: 'var(--font-mono)', color }}>
                                                {value}
                                            </span>
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