// src/pages/Visitante.jsx
import { useState } from 'react'
import {
    User, Clock, Users, Ticket, Bell,
    Heart, History, Plus, CheckCircle,
    Zap, Gift, AlertTriangle, Info, Sparkles,
    CreditCard, Activity, X, Star, Shield,
} from 'lucide-react'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input, Select } from '@/components/ui/Input'
import { visitanteService, atraccionService, alertaService } from '@/services/parqueService'
import { useApp, COSTO_TICKET } from '@/context/AppContext'
import { LogIn } from 'lucide-react'

// ─── Tickets ──────────────────────────────────────────────────────────────────
const TICKETS = [
    {
        tipo: 'GENERAL', backendKey: 'GENERAL', precio: 50000, prioridad: 2,
        color: '#457b9d', icono: '🎟️', label: 'General',
        beneficios: ['Acceso a todas las zonas', 'Cola prioridad 2', 'Mapa del parque'],
    },
    {
        tipo: 'FAMILIAR', backendKey: 'FAMILIAR', precio: 70000, prioridad: 2,
        color: '#2a9d8f', icono: '👨‍👩‍👧‍👦', label: 'Familiar', popular: true,
        beneficios: ['Hasta 4 personas', 'Cola prioridad 2', '20% descuento en precio base', 'Zona kids incluida'],
    },
    {
        tipo: 'FASTPASS', backendKey: 'FAST_PASS', precio: 120000, prioridad: 1,
        color: '#e9c46a', icono: '⚡', label: 'FastPass',
        beneficios: ['Cola prioridad 1 — atendido primero', 'Acceso VIP', 'Sin espera adicional', 'Descuento 15% souvenirs'],
    },
]

const NOTIF_COLORS = {
    CLIMA:         { color: '#e9c46a', bg: 'rgba(233,196,106,0.1)',  border: 'rgba(233,196,106,0.25)', icono: AlertTriangle },
    SHOW:          { color: '#6a4c93', bg: 'rgba(106,76,147,0.1)',   border: 'rgba(106,76,147,0.25)',  icono: Sparkles      },
    MANTENIMIENTO: { color: '#e63946', bg: 'rgba(230,57,70,0.08)',   border: 'rgba(230,57,70,0.2)',    icono: Info          },
    PROMO:         { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)',    icono: Gift          },
}

function formatPeso(n) {
    if (n == null || isNaN(n)) return '$0'
    return `$${Number(n).toLocaleString('es-CO')}`
}
function truncate(str, max = 60) {
    if (!str) return ''
    return str.length > max ? str.slice(0, max) + '…' : str
}
function normalizarTipo(tipo) {
    if (!tipo) return 'GENERAL'
    const t = tipo.toUpperCase()
    if (t === 'FAST_PASS' || t === 'FASTPASS') return 'FASTPASS'
    return t
}
function prioridadDeTicket(tipoUI) {
    return normalizarTipo(tipoUI) === 'FASTPASS' ? 1 : 2
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroVisitante({ visitante, saldo, visitasTotal }) {
    if (!visitante) return null
    const tipoUI    = normalizarTipo(visitante.tipoTicket)
    const prioridad = prioridadDeTicket(tipoUI)
    return (
        <div className="relative overflow-hidden rounded-3xl mb-8"
             style={{ background: 'linear-gradient(135deg,rgba(26,29,40,0.97),rgba(13,15,20,0.99))', border: '0.5px solid var(--c-border)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
                 style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#2a9d8f' }} />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="relative z-10 px-8 py-8">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                             style={{ background: 'linear-gradient(135deg,#2a9d8f,#457b9d)', fontFamily: 'var(--font-display)', color: 'white', boxShadow: '0 0 30px rgba(42,157,143,0.3)' }}>
                            {visitante.nombre?.split(' ').slice(0, 2).map(w => w[0]).join('') || '?'}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                             style={{ background: tipoUI === 'FASTPASS' ? '#e9c46a' : tipoUI === 'FAMILIAR' ? '#2a9d8f' : '#457b9d' }}>
                            {tipoUI === 'FASTPASS' ? <Zap size={12} color="#000" /> : <Ticket size={12} color="#fff" />}
                        </div>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>Bienvenido de vuelta</p>
                        <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{visitante.nombre}</h1>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={tipoUI === 'FASTPASS' ? 'fastpass' : tipoUI === 'FAMILIAR' ? 'active' : 'info'} dot>
                                Ticket {tipoUI}
                            </Badge>
                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"
                                  style={{ background: prioridad === 1 ? 'rgba(233,196,106,0.15)' : 'rgba(69,123,157,0.15)', color: prioridad === 1 ? '#e9c46a' : '#457b9d', border: `0.5px solid ${prioridad === 1 ? 'rgba(233,196,106,0.3)' : 'rgba(69,123,157,0.3)'}` }}>
                                <Star size={10} /> Cola prioridad {prioridad}
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                        {[
                            { label: 'Saldo disponible', value: formatPeso(saldo), color: (saldo ?? 0) > 0 ? '#22c55e' : '#e63946' },
                            { label: 'Visitas',           value: visitasTotal ?? 0,  color: '#6a4c93' },
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

// ─── Login de visitante ───────────────────────────────────────────────────────
function LoginVisitante({ onLogin }) {
    const { loginVisitante } = useApp()
    const [form, setForm]     = useState({ email: '', contrasena: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError]   = useState('')

    const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

    async function handleLogin() {
        if (!form.email.trim() || !form.contrasena.trim()) {
            setError('Email y contraseña son obligatorios'); return
        }
        setError(''); setLoading(true)
        try {
            const v = await loginVisitante(form.email.trim(), form.contrasena.trim())
            onLogin(v)
        } catch (err) {
            const msg = err?.response?.data
            setError(typeof msg === 'string' ? msg : 'Credenciales incorrectas o visitante no encontrado')
        } finally { setLoading(false) }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-4">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(69,123,157,0.15)', border: '0.5px solid rgba(69,123,157,0.25)' }}>
                    <LogIn size={15} style={{ color: '#457b9d' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Iniciar sesión</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>¿Ya tienes cuenta? Accede con tu email y contraseña</p>
                </div>
            </div>
            <div className="p-6">
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                         style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                        <AlertTriangle size={14} /> {error}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input label="Email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={f('email')} />
                    <Input label="Contraseña" type="password" placeholder="••••••••" value={form.contrasena} onChange={f('contrasena')} />
                    <div className="flex items-end">
                        <Button variant="primary" size="md" loading={loading} onClick={handleLogin} className="w-full justify-center">
                            <LogIn size={14} /> Ingresar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Registro rápido ──────────────────────────────────────────────────────────
function RegistroRapido({ onRegistrar }) {
    const [form, setForm] = useState({
        nombre: '', edad: '', telefono: '', email: '',
        contrasena: '', estatura: '', saldoVirtual: '',
        tipoTicket: 'GENERAL',
    })
    const [loading, setLoading] = useState(false)
    const [errors,  setErrors]  = useState({})
    const [exito,   setExito]   = useState(null)

    const ticketInfo  = TICKETS.find(t => t.tipo === form.tipoTicket) || TICKETS[0]
    const costoTicket = COSTO_TICKET[ticketInfo.backendKey] ?? ticketInfo.precio
    const saldoNum    = Number(form.saldoVirtual) || 0
    const saldoTras   = Math.max(0, saldoNum - costoTicket)

    function validate() {
        const e = {}
        if (!form.nombre.trim())                             e.nombre       = 'El nombre es obligatorio'
        if (!form.email.trim())                              e.email        = 'El email es obligatorio'
        if (!form.contrasena.trim())                         e.contrasena   = 'La contraseña es obligatoria'
        if (!form.edad || form.edad === '')                  e.edad         = 'La edad es obligatoria'
        else if (Number(form.edad) < 1)                      e.edad         = 'La edad debe ser mayor a 0'
        if (!form.estatura || form.estatura === '')          e.estatura     = 'La estatura es obligatoria'
        else if (Number(form.estatura) < 0.5)                e.estatura     = 'Estatura inválida (mín. 0.50 m)'
        if (!form.telefono || form.telefono.trim() === '')   e.telefono     = 'El teléfono es obligatorio'
        else if (form.telefono.length !== 10)                e.telefono     = 'El teléfono debe tener exactamente 10 dígitos'
        if (form.saldoVirtual === '' || form.saldoVirtual == null) e.saldoVirtual = 'El saldo es obligatorio'
        else if (saldoNum < 0)                               e.saldoVirtual = 'El saldo no puede ser negativo'
        else if (saldoNum < costoTicket)
            e.saldoVirtual = `Saldo insuficiente — ticket ${ticketInfo.label}: ${formatPeso(costoTicket)}`
        return e
    }

    async function handleSubmit() {
        const e = validate()
        if (Object.keys(e).length) { setErrors(e); return }
        setErrors({}); setLoading(true); setExito(null)
        try {
            await visitanteService.registrar({
                nombre:       form.nombre.trim(),
                edad:         Number(form.edad),
                telefono:     form.telefono.trim() || '0000000000',
                email:        form.email.trim(),
                contrasena:   form.contrasena.trim(),
                estatura:     Number(form.estatura),
                saldoVirtual: saldoNum,
                tipoTicket:   ticketInfo.backendKey,
            })
            setExito(`¡Registro exitoso! Ya puedes iniciar sesión con tu email y contraseña.`)
            setForm({ nombre: '', edad: '', telefono: '', email: '', contrasena: '', estatura: '', saldoVirtual: '', tipoTicket: 'GENERAL' })
            // Notificar al padre para redirigir al tab de login
            onRegistrar()
        } catch (err) {
            const msg = err?.response?.data || 'Error al registrar visitante'
            setErrors({ general: typeof msg === 'string' ? msg : 'Error al registrar' })
        } finally { setLoading(false) }
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
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Registro de visitante</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>El costo del ticket se descuenta del saldo al registrarse</p>
                </div>
            </div>
            <div className="p-6">
                {exito && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
                         style={{ background: 'rgba(34,197,94,0.08)', border: '0.5px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                        <CheckCircle size={14} className="flex-shrink-0 mt-0.5" /> {exito}
                    </div>
                )}
                {errors.general && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
                         style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                        <AlertTriangle size={14} /> {errors.general}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <Input label="Nombre completo" placeholder="Tu nombre" value={form.nombre} onChange={f('nombre')} error={errors.nombre} />
                    <Input label="Email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={f('email')} error={errors.email} />
                    <Input label="Contraseña" type="password" placeholder="••••••••" value={form.contrasena} onChange={f('contrasena')} error={errors.contrasena} />
                    <Input label="Edad" type="number" min="1" placeholder="Ej: 24" value={form.edad} onChange={f('edad')} error={errors.edad} />
                    <Input label="Estatura (m)" type="number" min="0" step="0.01" placeholder="Ej: 1.75" value={form.estatura} onChange={f('estatura')} error={errors.estatura} />
                    <Input
                        label="Teléfono"
                        type="tel"
                        placeholder="Ej: 3001234567"
                        value={form.telefono}
                        maxLength={10}
                        onChange={e => setForm(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        error={errors.telefono}
                    />
                    <div>
                        <Input
                            label="Saldo virtual ($COP)"
                            type="number"
                            min="0"
                            placeholder={`Mín. ${formatPeso(costoTicket)}`}
                            value={form.saldoVirtual}
                            onChange={f('saldoVirtual')}
                            error={errors.saldoVirtual}
                        />
                        {saldoNum > 0 && (
                            <div className="mt-2 rounded-lg px-3 py-2 text-xs space-y-0.5"
                                 style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid var(--c-border)' }}>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--c-muted)' }}>Saldo ingresado</span>
                                    <span style={{ color: 'var(--c-dim)' }}>{formatPeso(saldoNum)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--c-muted)' }}>Ticket {ticketInfo.label}</span>
                                    <span style={{ color: '#e63946' }}>−{formatPeso(costoTicket)}</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-0.5"
                                     style={{ borderTop: '0.5px solid var(--c-border)' }}>
                                    <span style={{ color: 'var(--c-muted)' }}>Saldo disponible</span>
                                    <span style={{ color: saldoTras > 0 ? '#22c55e' : '#e63946' }}>{formatPeso(saldoTras)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <Select label="Tipo de ticket" value={form.tipoTicket} onChange={f('tipoTicket')}>
                        <option value="GENERAL">General — {formatPeso(50000)} — Prioridad 2</option>
                        <option value="FAMILIAR">Familiar — {formatPeso(70000)} — Prioridad 2 (20% desc.)</option>
                        <option value="FASTPASS">FastPass — {formatPeso(120000)} — Prioridad 1</option>
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

// ─── Sección de tickets ───────────────────────────────────────────────────────
function SeccionTickets({ ticketActual }) {
    // Solo marcar activo si hay sesión (ticketActual !== null)
    const tipoUI = ticketActual != null ? normalizarTipo(ticketActual) : null
    return (
        <div className="mb-8">
            <div className="mb-5">
                <h2 className="section-title">Tipos de ticket</h2>
                <p className="section-subtitle">El ticket define tu prioridad en la cola virtual</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TICKETS.map((t) => {
                    const activo = tipoUI === t.tipo
                    return (
                        <div key={t.tipo} className="relative rounded-2xl p-5 overflow-hidden group transition-transform duration-300 hover:scale-[1.02]"
                             style={{ background: activo ? `${t.color}18` : 'rgba(255,255,255,0.03)', border: `${activo ? '1.5px' : '0.5px'} solid ${activo ? t.color : 'var(--c-border)'}` }}>
                            {t.popular && (
                                <div className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                                     style={{ background: `${t.color}22`, color: t.color, fontFamily: 'var(--font-display)', border: `0.5px solid ${t.color}44` }}>
                                    Popular
                                </div>
                            )}
                            {activo && (
                                <div className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                     style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.25)' }}>
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
                                <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                                     style={{ background: `${t.color}18`, color: t.color, border: `0.5px solid ${t.color}30` }}>
                                    <Shield size={10} />
                                    Prioridad {t.prioridad}{t.prioridad === 1 ? ' — atendido primero' : ''}
                                </div>
                            </div>
                            <ul className="space-y-2 mb-5">
                                {t.beneficios.map((b) => (
                                    <li key={b} className="flex items-center gap-2 text-xs" style={{ color: 'var(--c-dim)' }}>
                                        <CheckCircle size={12} style={{ color: t.color, flexShrink: 0 }} />{b}
                                    </li>
                                ))}
                            </ul>
                            <div className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                                 style={{ background: activo ? `${t.color}30` : `${t.color}18`, color: t.color, border: `0.5px solid ${t.color}40`, fontFamily: 'var(--font-display)' }}>
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
// Sin precios. Sin costoAdicional. Sin getSaldo.
// La cola es solo prioridad: FastPass=1, General/Familiar=2.
function ColaVirtual({ visitanteId, visitanteTipoTicket, atracciones }) {
    const { setHistorial } = useApp()
    const [seleccionada, setSeleccionada] = useState('')
    const [resultado,    setResultado]    = useState(null)
    const [colaInfo,     setColaInfo]     = useState(null)
    const [colaActiva,   setColaActiva]   = useState(null)
    const [loading,      setLoading]      = useState(false)

    const activas     = atracciones.filter(a => a.estado === 'ACTIVA')
    const prioridadUI = prioridadDeTicket(visitanteTipoTicket)

    async function unirse() {
        if (!seleccionada || !visitanteId) return
        setLoading(true); setResultado(null); setColaInfo(null)
        const atraccion = atracciones.find(a => a.id === seleccionada)
        try {
            const res = await visitanteService.unirseACola(seleccionada, visitanteId)
            setResultado(res.data)
            setColaActiva(atraccion)
            // Consultar tamaño de cola
            try {
                const colaRes = await atraccionService.getCola(seleccionada)
                setColaInfo(colaRes.data)
            } catch { /* silencioso */ }
// Refrescar historial tras unirse a la cola
            try {
                const histRes = await visitanteService.getHistorial(visitanteId)
                const raw = histRes?.data
                setHistorial(Array.isArray(raw) ? raw : (raw?.historial ?? []))
            } catch { /* silencioso */ }
            // NO llamar getSaldo — la cola no modifica el saldo
        } catch (err) {
            const msg = err?.response?.data
            setResultado(typeof msg === 'string' ? msg : 'No se pudo procesar la solicitud')
            setColaActiva(atraccion)
        } finally { setLoading(false) }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                         style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                        <Users size={15} style={{ color: '#e63946' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Cola virtual</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Prioridad por tipo de ticket — sin costo adicional</p>
                    </div>
                </div>
                {visitanteId && (
                    <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-semibold"
                          style={{ background: prioridadUI === 1 ? 'rgba(233,196,106,0.15)' : 'rgba(69,123,157,0.15)', color: prioridadUI === 1 ? '#e9c46a' : '#457b9d', border: `0.5px solid ${prioridadUI === 1 ? 'rgba(233,196,106,0.3)' : 'rgba(69,123,157,0.3)'}` }}>
                        <Star size={10} /> Tu prioridad: {prioridadUI}
                    </span>
                )}
            </div>
            <div className="p-6">
                {!visitanteId && (
                    <div className="mb-4 rounded-xl px-4 py-3 text-xs flex items-center gap-2"
                         style={{ background: 'rgba(233,196,106,0.08)', border: '0.5px solid rgba(233,196,106,0.2)', color: '#e9c46a' }}>
                        <AlertTriangle size={13} /> Regístrate primero para unirte a la cola
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                    {[
                        { label: 'FastPass', prioridad: 1, color: '#e9c46a', desc: 'Atendido primero' },
                        { label: 'General / Familiar', prioridad: 2, color: '#457b9d', desc: 'Cola estándar' },
                    ].map(p => (
                        <div key={p.prioridad} className="flex items-center gap-2 rounded-xl px-3 py-2"
                             style={{ background: `${p.color}0d`, border: `0.5px solid ${p.color}25` }}>
                            <Shield size={13} style={{ color: p.color, flexShrink: 0 }} />
                            <span className="text-xs font-semibold" style={{ color: p.color }}>{p.label}</span>
                            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>— {p.desc}</span>
                            <span className="ml-auto text-xs font-bold font-mono"
                                  style={{ fontFamily: 'var(--font-mono)', color: p.color }}>P{p.prioridad}</span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 mb-6 flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                        <Select label="Seleccionar atracción" value={seleccionada} onChange={e => setSeleccionada(e.target.value)}>
                            <option value="">Elige una atracción…</option>
                            {activas.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.nombre}{a.tiempoEsperaEstimado > 0 ? ` — ~${a.tiempoEsperaEstimado} min` : ''}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" size="md" loading={loading} onClick={unirse}
                                disabled={!visitanteId || !seleccionada}>
                            <Plus size={14} /> Unirme a la cola
                        </Button>
                    </div>
                </div>

                {resultado && colaActiva && (
                    <div className="rounded-2xl p-5 mb-5"
                         style={{ background: 'rgba(42,157,143,0.06)', border: '0.5px solid rgba(42,157,143,0.2)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <p className="text-xs uppercase tracking-widest mb-1"
                                   style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>{colaActiva.nombre}</p>
                                <p className="text-sm" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{resultado}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>
                                    Ingresaste con prioridad {prioridadUI}
                                    {prioridadUI === 1 ? ' — serás atendido primero' : ' — cola estándar'}
                                </p>
                            </div>
                            {colaInfo && (
                                <div className="text-right ml-4 flex-shrink-0">
                                    <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#2a9d8f' }}>
                                        {colaInfo.visitantesEnCola}
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>en cola</p>
                                </div>
                            )}
                        </div>
                        {colaInfo && (
                            <>
                                <ProgressBar value={Math.max(1, 20 - (colaInfo.visitantesEnCola || 0))} max={20} color="#2a9d8f" />
                                <div className="flex items-center justify-between text-xs mt-2">
                                    <span style={{ color: 'var(--c-muted)' }}>
                                        <Clock size={10} className="inline mr-1" />
                                        ~{colaActiva.tiempoEsperaEstimado ?? 0} min estimado
                                    </span>
                                    <Badge variant={(colaInfo.visitantesEnCola ?? 0) < 15 ? 'active' : 'pending'} dot>
                                        {(colaInfo.visitantesEnCola ?? 0) < 15 ? 'Flujo normal' : 'Alta demanda'}
                                    </Badge>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="mt-5 space-y-2">
                    <p className="text-xs uppercase tracking-widest mb-3"
                       style={{ fontFamily: 'var(--font-display)', color: 'var(--c-muted)' }}>Atracciones activas</p>
                    {activas.length === 0 && (
                        <p className="text-xs text-center py-4" style={{ color: 'var(--c-muted)' }}>No hay atracciones activas</p>
                    )}
                    {activas.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                             style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid var(--c-border)' }}>
                            <div className="flex items-center gap-3">
                                <span className="status-dot active" />
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{a.nombre}</p>
                                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                        {a.tipo}
                                        {a.alturaMinima > 0 ? ` · Alt. mín. ${Math.round(a.alturaMinima * 100)} cm` : ''}
                                        {a.edadMinima > 0 ? ` · Edad mín. ${a.edadMinima} años` : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3 text-xs" style={{ color: 'var(--c-muted)' }}>
                                {a.tiempoEsperaEstimado > 0 && <div>~{a.tiempoEsperaEstimado} min</div>}
                                <div>{a.contadorVisitantes} visitantes</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─── Favoritos ────────────────────────────────────────────────────────────────
function Favoritos({ favoritos, setFavoritos, visitanteId, atracciones }) {
    const [seleccionada, setSeleccionada] = useState('')
    const [loading,      setLoading]      = useState(false)
    const [msg,          setMsg]          = useState(null)

    const disponibles = atracciones.filter(a => !favoritos.some(f => f.id === a.id))

    async function agregar() {
        if (!seleccionada || !visitanteId) return
        setLoading(true); setMsg(null)
        try {
            const res = await visitanteService.agregarFavorito(visitanteId, seleccionada)
            const atraccion = atracciones.find(a => a.id === seleccionada)
            if (atraccion) setFavoritos(prev => [...prev, atraccion])
            setMsg(res.data); setSeleccionada('')
        } catch (err) {
            const errMsg = err?.response?.data
            setMsg(typeof errMsg === 'string' ? errMsg : 'No se pudo agregar a favoritos')
        } finally { setLoading(false) }
    }

    function quitar(id) { setFavoritos(prev => prev.filter(f => f.id !== id)) }

    const TIPO_COLORS = {
        MECANICA_ALTURA: '#f4a261', MECANICA: '#f4a261',
        ACUATICA: '#457b9d', ESPECTACULO: '#6a4c93', SHOW: '#6a4c93',
        INFANTIL: '#2a9d8f', OTRO: '#2a9d8f',
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Heart size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Mis favoritos</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{favoritos.length} atracciones guardadas</p>
                </div>
            </div>
            {visitanteId && (
                <div className="px-5 pt-4 pb-2 border-b flex gap-3 flex-wrap" style={{ borderColor: 'var(--c-border)' }}>
                    <div className="flex-1 min-w-[180px]">
                        <Select label="Agregar atracción" value={seleccionada} onChange={e => setSeleccionada(e.target.value)}>
                            <option value="">Elige una atracción…</option>
                            {disponibles.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </Select>
                    </div>
                    <div className="flex items-end pb-0.5">
                        <Button variant="outline" size="sm" loading={loading} onClick={agregar} disabled={!seleccionada}>
                            <Heart size={13} /> Guardar
                        </Button>
                    </div>
                    {msg && <p className="w-full text-xs mt-1" style={{ color: '#2a9d8f' }}>{msg}</p>}
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
                        <div key={f.id} className="flex items-center gap-3 rounded-xl px-4 py-3 group"
                             style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${accent}30` }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                 style={{ background: `${accent}18`, border: `0.5px solid ${accent}30` }}>
                                <Activity size={15} style={{ color: accent }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate"
                                   style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{f.nombre}</p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {f.tipo}
                                    {f.estado === 'ACTIVA' && f.tiempoEsperaEstimado > 0 ? ` · ~${f.tiempoEsperaEstimado} min` : ''}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={f.estado} />
                                <button onClick={() => quitar(f.id)}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946' }}>
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
function Historial({ historial, visitanteNombre }) {
    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b flex items-center" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                     style={{ background: 'rgba(106,76,147,0.15)', border: '0.5px solid rgba(106,76,147,0.25)' }}>
                    <History size={15} style={{ color: '#6a4c93' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Historial de visitas</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                        {historial.length} entradas{visitanteNombre ? ` · ${visitanteNombre}` : ''}
                    </p>
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
                        <thead><tr><th>#</th><th>Registro</th></tr></thead>
                        <tbody>
                        {historial.map((entrada, i) => (
                            <tr key={i}>
                                <td>
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                                         style={{ background: 'rgba(106,76,147,0.15)', color: '#6a4c93', fontWeight: 700 }}>
                                        {i + 1}
                                    </div>
                                </td>
                                <td><span className="text-sm" style={{ color: 'var(--c-text)' }}>{truncate(String(entrada), 80)}</span></td>
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
function Notificaciones({ notifs, setNotifs }) {
    function marcarLeida(idx) { setNotifs(prev => prev.map((n, i) => i === idx ? { ...n, _leida: true } : n)) }
    function marcarTodas()    { setNotifs(prev => prev.map(n => ({ ...n, _leida: true }))) }
    function getTipo(n) {
        const t = (n.tipo || n.tipoAlerta || '').toUpperCase()
        if (t.includes('CLIMA') || t.includes('TORMENTA') || t.includes('LLUVIA')) return 'CLIMA'
        if (t.includes('SHOW')  || t.includes('ESPECT'))                            return 'SHOW'
        if (t.includes('MANT'))                                                      return 'MANTENIMIENTO'
        return 'CLIMA'
    }
    function getMensaje(n) { return n.mensaje || n.descripcion || n.texto || JSON.stringify(n) }
    function getFecha(n) {
        const raw = n.fecha || n.fechaHora || n.timestamp || ''
        if (!raw) return ''
        try { return new Date(raw).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }
        catch { return String(raw).slice(0, 16) }
    }
    const noLeidas = notifs.filter(n => !n._leida && !n.leida).length
    return (
        <div className="glass rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                            <Bell size={15} style={{ color: '#e9c46a' }} />
                        </div>
                        {noLeidas > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                                  style={{ background: '#e63946', color: 'white', fontSize: 9 }}>
                                {noLeidas}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Notificaciones</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{noLeidas} sin leer</p>
                    </div>
                </div>
                {noLeidas > 0 && <button className="text-xs" style={{ color: 'var(--c-muted)' }} onClick={marcarTodas}>Marcar todas</button>}
            </div>
            <div className="p-4 space-y-3">
                {notifs.length === 0 && (
                    <div className="py-6 text-center" style={{ color: 'var(--c-muted)' }}>
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">Sin notificaciones</p>
                    </div>
                )}
                {notifs.map((n, idx) => {
                    const tipo = getTipo(n), cfg = NOTIF_COLORS[tipo], Icono = cfg.icono
                    const leida = n._leida || n.leida || false
                    return (
                        <div key={idx} className="flex items-start gap-3 rounded-xl p-3 cursor-pointer"
                             style={{ background: leida ? 'rgba(255,255,255,0.02)' : cfg.bg, border: `0.5px solid ${leida ? 'var(--c-border)' : cfg.border}`, opacity: leida ? 0.65 : 1 }}
                             onClick={() => marcarLeida(idx)}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${cfg.color}20` }}>
                                <Icono size={13} style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs leading-relaxed" style={{ color: leida ? 'var(--c-muted)' : 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{getMensaje(n)}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                    <span className="text-xs" style={{ color: 'var(--c-muted)', fontSize: 10 }}>{getFecha(n)}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cfg.color}18`, color: cfg.color, fontSize: 10 }}>{tipo}</span>
                                </div>
                            </div>
                            {!leida && <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: cfg.color }} />}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Visitante() {
    const {
        visitante, saldo, historial, favoritos, notifs,
        atracciones,
        setFavoritos, setNotifs,
        refrescarAtracciones,
    } = useApp()

    const [tab,     setTab]     = useState('cola')
    const [error,   setError]   = useState(null)
    const [authTab, setAuthTab] = useState('login')

    // Tras registro exitoso: ir a login para que el usuario inicie sesión
    function handleRegistrar() {
        setAuthTab('login')
    }

    function handleLogin() {
        refrescarAtracciones()
    }

    const TABS = [
        { id: 'cola',      label: 'Cola virtual', icon: Users   },
        { id: 'favoritos', label: 'Favoritos',     icon: Heart   },
        { id: 'historial', label: 'Historial',     icon: History },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {error && (
                <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2 text-sm"
                     style={{ background: 'rgba(230,57,70,0.08)', border: '0.5px solid rgba(230,57,70,0.2)', color: '#e63946' }}>
                    <AlertTriangle size={14} /> {error}
                    <button className="ml-auto" onClick={() => setError(null)}><X size={14} /></button>
                </div>
            )}

            {/* Bienvenida: SOLO visible cuando hay visitante activo */}
            {visitante && <HeroVisitante visitante={visitante} saldo={saldo} visitasTotal={historial.length} />}

            {/* Panel de autenticación: SOLO visible cuando NO hay visitante activo */}
            {!visitante && (
                <div className="mb-8">
                    <div className="flex gap-1 p-1 rounded-xl mb-4 w-fit"
                         style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                        {[
                            { id: 'login',    label: 'Iniciar sesión', icon: LogIn },
                            { id: 'registro', label: 'Registrarse',    icon: User  },
                        ].map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setAuthTab(id)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                                    style={{
                                        background: authTab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                        color: authTab === id ? 'var(--c-text)' : 'var(--c-muted)',
                                        fontFamily: 'var(--font-display)',
                                        fontWeight: authTab === id ? 600 : 400,
                                        border: authTab === id ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
                                    }}>
                                <Icon size={14} />{label}
                            </button>
                        ))}
                    </div>

                    {authTab === 'login'    && <LoginVisitante onLogin={handleLogin} />}
                    {authTab === 'registro' && <RegistroRapido onRegistrar={handleRegistrar} />}
                </div>
            )}

            <SeccionTickets ticketActual={visitante ? visitante.tipoTicket : null} />

            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* Tabs de cola/favoritos/historial: solo con sesión activa */}
            {visitante && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit"
                             style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)' }}>
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setTab(id)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
                                        style={{
                                            background: tab === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                                            color: tab === id ? 'var(--c-text)' : 'var(--c-muted)',
                                            fontFamily: 'var(--font-display)',
                                            fontWeight: tab === id ? 600 : 400,
                                            border: tab === id ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid transparent',
                                        }}>
                                    <Icon size={14} />{label}
                                </button>
                            ))}
                        </div>

                        {tab === 'cola' && (
                            <ColaVirtual
                                visitanteId={visitante?.id}
                                visitanteTipoTicket={visitante?.tipoTicket}
                                atracciones={atracciones}
                            />
                        )}
                        {tab === 'favoritos' && (
                            <Favoritos favoritos={favoritos} setFavoritos={setFavoritos}
                                       visitanteId={visitante?.id} atracciones={atracciones} />
                        )}
                        {tab === 'historial' && (
                            <Historial historial={historial} visitanteNombre={visitante?.nombre} />
                        )}
                    </div>

                    <div className="xl:col-span-1">
                        <div className="sticky top-24">
                            <Notificaciones notifs={notifs} setNotifs={setNotifs} />
                            <div className="glass rounded-2xl p-5 mt-5">
                                <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Mis estadísticas</h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Atracciones en historial', value: historial.length, max: Math.max(15, historial.length), color: '#6a4c93' },
                                        { label: 'Favoritos guardados',       value: favoritos.length, max: Math.max(10, favoritos.length), color: '#e63946' },
                                        { label: 'Notificaciones leídas',    value: notifs.filter(n => n._leida || n.leida).length, max: Math.max(1, notifs.length), color: '#2a9d8f' },
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
            )}
        </div>
    )
}