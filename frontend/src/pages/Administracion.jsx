import { useState, useEffect } from 'react'
import {
    Users, MapPin, Zap, AlertTriangle, Settings,
    Plus, Trash2, UserCheck, Cloud, CloudLightning,
    CloudRain, CheckCircle, XCircle, Wrench, Shield,
    TrendingUp, Activity, ChevronRight, RefreshCw,
    ToggleLeft, ToggleRight, Clock, Eye
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge, { StatusBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input, Select } from '@/components/ui/Input'
import {
    operadorService,
    zonaService,
    climaService,
    atraccionService,
    mantenimientoService,
} from '@/services/parqueService'

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_OPERADORES = [
    { id: 1, nombre: 'Carlos Mendoza',  email: 'cmendoza@uq.edu.co',  zona: 'Zona Aventura',      estado: 'ACTIVO' },
    { id: 2, nombre: 'Laura Ríos',      email: 'lrios@uq.edu.co',     zona: 'Zona Acuática',      estado: 'ACTIVO' },
    { id: 3, nombre: 'Andrés Torres',   email: 'atorres@uq.edu.co',   zona: 'Zona Espectáculos',  estado: 'ACTIVO' },
    { id: 4, nombre: 'Valentina Cruz',  email: 'vcruz@uq.edu.co',     zona: 'Sin asignar',        estado: 'INACTIVO' },
]

const DEMO_ZONAS = [
    { id: 1, nombre: 'Zona Aventura',     capacidadActual: 312, capacidadMax: 600, atraccionesActivas: 2, totalAtracciones: 3, color: '#f4a261', icono: '🎢', estado: 'ABIERTA' },
    { id: 2, nombre: 'Zona Acuática',     capacidadActual: 289, capacidadMax: 500, atraccionesActivas: 1, totalAtracciones: 2, color: '#457b9d', icono: '🌊', estado: 'ABIERTA' },
    { id: 3, nombre: 'Zona Espectáculos', capacidadActual: 246, capacidadMax: 900, atraccionesActivas: 1, totalAtracciones: 1, color: '#6a4c93', icono: '🎭', estado: 'ABIERTA' },
]

const DEMO_ALERTAS = [
    { id: 1, tipo: 'TORMENTA_ELECTRICA', activa: true,  hora: '14:32', afectadas: ['Montaña Rusa X', 'Free Fall 360'] },
    { id: 2, tipo: 'LLUVIA_FUERTE',      activa: false, hora: '11:15', afectadas: ['Río Salvaje'] },
]

const DEMO_MANTENIMIENTO = [
    { id: 1, atraccion: 'Torre del Terror',  visitantesAlerta: 142, fecha: '2025-05-14 09:21', estado: 'PENDIENTE',  porcentaje: 30 },
    { id: 2, atraccion: 'Ola Gigante',       visitantesAlerta: 98,  fecha: '2025-05-13 16:45', estado: 'RESUELTA',   porcentaje: 100 },
    { id: 3, atraccion: 'Montaña Rusa X',    visitantesAlerta: 0,   fecha: '2025-05-12 08:00', estado: 'RESUELTA',   porcentaje: 100 },
]

const ZONA_COLORS = ['#f4a261', '#457b9d', '#6a4c93', '#2a9d8f', '#e63946']

function initials(nombre) {
    return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function tipoAlertaLabel(tipo) {
    return tipo === 'TORMENTA_ELECTRICA' ? 'Tormenta eléctrica' : 'Lluvia fuerte'
}

// ─── Hero compacto ────────────────────────────────────────────────────────────
function AdminHero({ operadores, zonas, alertasActivas }) {
    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{ background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))', border: '0.5px solid var(--c-border)' }}
        >
            {/* Background glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#e63946' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(106,76,147,0.2)', border: '0.5px solid rgba(106,76,147,0.3)' }}>
                            <Shield size={16} style={{ color: '#6a4c93' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#6a4c93' }}>
              Panel administrativo
            </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Administración <span className="text-rainbow">Central</span>
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                        Control total de personal, zonas, mantenimiento y alertas del parque.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                        <Users size={14} style={{ color: '#2a9d8f' }} />
                        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{operadores.length}</span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Operadores</span>
                    </div>
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#f4a261' }} />
                        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{zonas.length}</span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Zonas</span>
                    </div>
                    {alertasActivas > 0 && (
                        <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: 'rgba(230,57,70,0.1)', border: '0.5px solid rgba(230,57,70,0.25)' }}>
                            <AlertTriangle size={14} style={{ color: '#e63946' }} />
                            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e63946' }}>{alertasActivas}</span>
                            <span className="text-xs" style={{ color: 'rgba(230,57,70,0.7)' }}>Alertas</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Métricas rápidas ─────────────────────────────────────────────────────────
function MetricasRapidas({ operadores, zonas, mantenimiento, alertas }) {
    const activos    = operadores.filter(o => o.estado === 'ACTIVO').length
    const zonasAbiertas = zonas.filter(z => z.estado === 'ABIERTA').length
    const incidentes = mantenimiento.filter(m => m.estado === 'PENDIENTE').length
    const resueltas  = mantenimiento.filter(m => m.estado === 'RESUELTA').length
    const eficiencia = mantenimiento.length
        ? Math.round((resueltas / mantenimiento.length) * 100)
        : 100

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Operadores activos"  value={activos}           sub={`${operadores.length} en total`}      accent="#2a9d8f"  icon={UserCheck}   className="animate-fade-up-delay-1" />
            <StatCard label="Zonas abiertas"      value={zonasAbiertas}     sub={`de ${zonas.length} zonas`}            accent="#f4a261"  icon={MapPin}      className="animate-fade-up-delay-2" />
            <StatCard label="Incidentes activos"  value={incidentes}        sub={incidentes > 0 ? 'Requieren atención' : 'Sin incidentes'} accent={incidentes > 0 ? '#e63946' : '#22c55e'} icon={Wrench} className="animate-fade-up-delay-3" />
            <StatCard label="Eficiencia operativa" value={`${eficiencia}%`} sub="Mantenimientos resueltos"               accent="#6a4c93"  icon={TrendingUp}  className="animate-fade-up-delay-4" />
        </div>
    )
}

// ─── Gestión de operadores ────────────────────────────────────────────────────
function GestionOperadores({ operadores, setOperadores, zonas }) {
    const [showForm, setShowForm]   = useState(false)
    const [loading, setLoading]     = useState(false)
    const [form, setForm]           = useState({ nombre: '', email: '', edad: '', telefono: '', contrasena: '' })
    const [asignando, setAsignando] = useState(null) // operador id
    const [zonaSelec, setZonaSelec] = useState('')

    async function handleCrear() {
        if (!form.nombre || !form.email || !form.edad || !form.telefono || !form.contrasena) return
        setLoading(true)
        const payload = {
            id: 'OP-' + Date.now(),
            nombre: form.nombre,
            edad: parseInt(form.edad),
            telefono: form.telefono,
            email: form.email,
            contrasena: form.contrasena,
        }
        try {
            await operadorService.create(payload)
            const res = await operadorService.getAll()
            if (res?.data) setOperadores(res.data)
        } catch {
            setOperadores(prev => [...prev, { ...payload, zona: 'Sin asignar', estado: 'ACTIVO' }])
        } finally {
            setLoading(false)
            setForm({ nombre: '', email: '', edad: '', telefono: '', contrasena: '' })
            setShowForm(false)
        }
    }

    async function handleEliminar(id) {
        try { await operadorService.delete(id) } catch {}
        setOperadores(prev => prev.filter(o => o.id !== id))
    }

    async function handleAsignar(operadorId) {
        if (!zonaSelec) return
        const zona = zonas.find(z => z.id === Number(zonaSelec))
        try { await operadorService.asignarZona(operadorId, zonaSelec) } catch {}
        setOperadores(prev => prev.map(o => o.id === operadorId ? { ...o, zona: zona?.nombre || zonaSelec } : o))
        setAsignando(null)
        setZonaSelec('')
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(42,157,143,0.15)', border: '0.5px solid rgba(42,157,143,0.25)' }}>
                        <Users size={15} style={{ color: '#2a9d8f' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Gestión de operadores</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{operadores.length} registrados</p>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus size={13} /> Nuevo operador
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input label="Nombre completo"    placeholder="Ej: Carlos Mendoza"   value={form.nombre}    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                        <Input label="Correo electrónico" placeholder="nombre@uq.edu.co"      value={form.email}     onChange={e => setForm(p => ({ ...p, email: e.target.value }))} type="email" />
                        <Input label="Edad"               placeholder="Ej: 30"                value={form.edad}      onChange={e => setForm(p => ({ ...p, edad: e.target.value }))}   type="number" />
                        <Input label="Teléfono"           placeholder="Ej: 3001234567"        value={form.telefono}  onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
                        <Input label="Contraseña"         placeholder="Contraseña temporal"   value={form.contrasena} onChange={e => setForm(p => ({ ...p, contrasena: e.target.value }))} type="password" />
                        <div className="flex items-end">
                            <Button variant="success" size="md" loading={loading} onClick={handleCrear} className="w-full justify-center">
                                <CheckCircle size={14} /> Crear operador
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="tp-table">
                    <thead>
                    <tr>
                        <th>Operador</th>
                        <th className="hidden md:table-cell">Correo</th>
                        <th>Zona asignada</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {operadores.map((op) => (
                        <>
                            <tr key={op.id}>
                                <td>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                            style={{
                                                background: `${ZONA_COLORS[op.id % ZONA_COLORS.length]}22`,
                                                color: ZONA_COLORS[op.id % ZONA_COLORS.length],
                                                border: `0.5px solid ${ZONA_COLORS[op.id % ZONA_COLORS.length]}44`,
                                                fontFamily: 'var(--font-display)',
                                            }}
                                        >
                                            {initials(op.nombre)}
                                        </div>
                                        <span className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{op.nombre}</span>
                                    </div>
                                </td>
                                <td className="hidden md:table-cell">
                                    <span className="font-mono text-xs" style={{ color: 'var(--c-muted)' }}>{op.email}</span>
                                </td>
                                <td>
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--c-dim)', border: '0.5px solid var(--c-border)' }}>
                      {op.zona}
                    </span>
                                </td>
                                <td>
                                    <Badge variant={op.estado === 'ACTIVO' ? 'active' : 'closed'} dot>
                                        {op.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            style={{ background: 'rgba(69,123,157,0.12)', color: '#457b9d', border: '0.5px solid rgba(69,123,157,0.25)' }}
                                            onClick={() => setAsignando(asignando === op.id ? null : op.id)}
                                        >
                                            <MapPin size={11} /> Zona
                                        </button>
                                        <button
                                            className="text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}
                                            onClick={() => handleEliminar(op.id)}
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            {/* Inline assign row */}
                            {asignando === op.id && (
                                <tr key={`assign-${op.id}`}>
                                    <td colSpan={5} style={{ background: 'rgba(69,123,157,0.05)', padding: '12px 16px' }}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Asignar a zona:</span>
                                            <select
                                                className="tp-input tp-select"
                                                style={{ maxWidth: 200 }}
                                                value={zonaSelec}
                                                onChange={e => setZonaSelec(e.target.value)}
                                            >
                                                <option value="">Seleccionar zona…</option>
                                                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                            </select>
                                            <Button variant="success" size="sm" onClick={() => handleAsignar(op.id)}>
                                                <CheckCircle size={12} /> Asignar
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => setAsignando(null)}>
                                                Cancelar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Gestión de zonas ─────────────────────────────────────────────────────────
function GestionZonas({ zonas, setZonas }) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm]         = useState({ nombre: '', capacidadMax: '' })
    const [loading, setLoading]   = useState(false)

    async function handleCrear() {
        if (!form.nombre || !form.capacidadMax) return
        setLoading(true)
        try {
            const res = await zonaService.create(form)
            setZonas(prev => [...prev, res.data])
        } catch {
            setZonas(prev => [...prev, {
                id: Date.now(), ...form,
                capacidadActual: 0, atraccionesActivas: 0, totalAtracciones: 0,
                color: ZONA_COLORS[prev.length % ZONA_COLORS.length],
                icono: '🎡', estado: 'ABIERTA',
            }])
        } finally {
            setLoading(false)
            setForm({ nombre: '', capacidadMax: '' })
            setShowForm(false)
        }
    }

    async function handleEliminar(id) {
        try { await zonaService.delete(id) } catch {}
        setZonas(prev => prev.filter(z => z.id !== id))
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,162,97,0.15)', border: '0.5px solid rgba(244,162,97,0.25)' }}>
                        <MapPin size={15} style={{ color: '#f4a261' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Gestión de zonas</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{zonas.length} zonas activas</p>
                    </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus size={13} /> Nueva zona
                </Button>
            </div>

            {showForm && (
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input label="Nombre de la zona" placeholder="Ej: Zona Virtual" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                        <Input label="Capacidad máxima" type="number" placeholder="Ej: 500" value={form.capacidadMax} onChange={e => setForm(p => ({ ...p, capacidadMax: e.target.value }))} />
                        <div className="flex items-end">
                            <Button variant="success" size="md" loading={loading} onClick={handleCrear} className="w-full justify-center">
                                <CheckCircle size={14} /> Crear zona
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {zonas.map((zona, i) => {
                    const accent = zona.color || ZONA_COLORS[i % ZONA_COLORS.length]
                    const pct    = zona.capacidadMax > 0 ? Math.round((zona.capacidadActual / zona.capacidadMax) * 100) : 0
                    const saturada = pct >= 80

                    return (
                        <div
                            key={zona.id}
                            className="rounded-2xl p-4 relative overflow-hidden group"
                            style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${accent}30`, borderTop: `2px solid ${accent}` }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
                                 style={{ background: `${accent}08` }} />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{zona.icono}</span>
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{zona.nombre}</h3>
                                            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Cap. {zona.capacidadMax.toLocaleString('es-CO')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {saturada && <Badge variant="pending" dot>Saturada</Badge>}
                                        <Badge variant={zona.estado === 'ABIERTA' ? 'active' : 'closed'} dot>{zona.estado === 'ABIERTA' ? 'Abierta' : 'Cerrada'}</Badge>
                                    </div>
                                </div>

                                <div className="mb-1">
                                    <ProgressBar value={zona.capacidadActual} max={zona.capacidadMax} color={saturada ? '#e63946' : accent} />
                                </div>
                                <div className="flex justify-between text-xs mb-3" style={{ color: 'var(--c-muted)' }}>
                                    <span>{zona.capacidadActual} visitantes</span>
                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: saturada ? '#e63946' : accent }}>{pct}%</span>
                                </div>

                                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
                    <span className="font-semibold" style={{ color: 'var(--c-text)' }}>{zona.atraccionesActivas}</span>/{zona.totalAtracciones} atracciones activas
                  </span>
                                    <button
                                        onClick={() => handleEliminar(zona.id)}
                                        className="text-xs px-2 py-1 rounded-lg flex items-center gap-1 transition-colors"
                                        style={{ background: 'rgba(230,57,70,0.08)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.15)' }}
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Alertas climáticas ───────────────────────────────────────────────────────
function AlertasClimaticas({ alertas, setAlertas }) {
    const [loading, setLoading] = useState(null)

    async function activar(tipo) {
        setLoading(tipo)
        try {
            const fn = tipo === 'tormenta' ? climaService.activarTormenta : climaService.activarLluvia
            const res = await fn()
            setAlertas(prev => [...prev, res.data])
        } catch {
            setAlertas(prev => [...prev, {
                id: Date.now(),
                tipo: tipo === 'tormenta' ? 'TORMENTA_ELECTRICA' : 'LLUVIA_FUERTE',
                activa: true,
                hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
                afectadas: [],
            }])
        } finally { setLoading(null) }
    }

    async function desactivar(id) {
        try { await climaService.desactivar(id) } catch {}
        setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: false } : a))
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                        <Cloud size={15} style={{ color: '#e9c46a' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Alertas climáticas</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{alertas.filter(a => a.activa).length} activas ahora</p>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    <Button
                        variant="danger"
                        size="sm"
                        loading={loading === 'tormenta'}
                        onClick={() => activar('tormenta')}
                    >
                        <CloudLightning size={13} /> Activar tormenta eléctrica
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        loading={loading === 'lluvia'}
                        onClick={() => activar('lluvia')}
                    >
                        <CloudRain size={13} /> Activar lluvia fuerte
                    </Button>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {alertas.length === 0 && (
                    <div className="text-center py-6" style={{ color: 'var(--c-muted)' }}>
                        <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sin alertas climáticas</p>
                    </div>
                )}
                {alertas.map((alerta) => (
                    <div
                        key={alerta.id}
                        className="flex items-center justify-between rounded-xl px-4 py-3"
                        style={{
                            background: alerta.activa ? 'rgba(230,57,70,0.07)' : 'rgba(255,255,255,0.02)',
                            border: `0.5px solid ${alerta.activa ? 'rgba(230,57,70,0.2)' : 'var(--c-border)'}`,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            {alerta.tipo === 'TORMENTA_ELECTRICA'
                                ? <CloudLightning size={16} style={{ color: alerta.activa ? '#e9c46a' : 'var(--c-muted)' }} />
                                : <CloudRain      size={16} style={{ color: alerta.activa ? '#457b9d' : 'var(--c-muted)' }} />
                            }
                            <div>
                                <p className="text-sm font-medium" style={{ color: alerta.activa ? 'var(--c-text)' : 'var(--c-muted)', fontFamily: 'var(--font-body)' }}>
                                    {tipoAlertaLabel(alerta.tipo)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {alerta.hora} · {alerta.afectadas.length > 0 ? alerta.afectadas.join(', ') : 'Sin atracciones afectadas'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={alerta.activa ? 'pending' : 'resolved'} dot>
                                {alerta.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                            {alerta.activa && (
                                <button
                                    onClick={() => desactivar(alerta.id)}
                                    className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.2)' }}
                                >
                                    <XCircle size={11} /> Desactivar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Mantenimiento preventivo ─────────────────────────────────────────────────
function Mantenimiento({ items, setItems }) {
    const [loading, setLoading] = useState(null)

    async function registrarRevision(id) {
        setLoading(id)
        try { await atraccionService.registrarRevision(id) } catch {}
        setItems(prev => prev.map(m =>
            m.id === id ? { ...m, estado: 'RESUELTA', porcentaje: 100 } : m
        ))
        setLoading(null)
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Wrench size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Mantenimiento preventivo</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{items.filter(i => i.estado === 'PENDIENTE').length} pendientes de revisión</p>
                </div>
            </div>

            <div className="p-4 space-y-3">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="rounded-xl p-4"
                        style={{
                            background: item.estado === 'PENDIENTE' ? 'rgba(230,57,70,0.05)' : 'rgba(255,255,255,0.02)',
                            border: `0.5px solid ${item.estado === 'PENDIENTE' ? 'rgba(230,57,70,0.18)' : 'var(--c-border)'}`,
                        }}
                    >
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{
                                        background: item.estado === 'PENDIENTE' ? 'rgba(230,57,70,0.12)' : 'rgba(34,197,94,0.1)',
                                        border: `0.5px solid ${item.estado === 'PENDIENTE' ? 'rgba(230,57,70,0.2)' : 'rgba(34,197,94,0.2)'}`,
                                    }}
                                >
                                    <Wrench size={15} style={{ color: item.estado === 'PENDIENTE' ? '#e63946' : '#22c55e' }} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                        {item.atraccion}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                        {item.visitantesAlerta > 0 ? `${item.visitantesAlerta} visitantes al momento` : 'Sin visitantes en alerta'} · {item.fecha}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant={item.estado === 'PENDIENTE' ? 'pending' : 'resolved'} dot>
                                    {item.estado === 'PENDIENTE' ? 'Pendiente' : 'Resuelta'}
                                </Badge>
                                {item.estado === 'PENDIENTE' && (
                                    <Button
                                        variant="success"
                                        size="sm"
                                        loading={loading === item.id}
                                        onClick={() => registrarRevision(item.id)}
                                    >
                                        <CheckCircle size={12} /> Registrar revisión
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ProgressBar
                                value={item.porcentaje}
                                max={100}
                                color={item.estado === 'PENDIENTE' ? '#e63946' : '#22c55e'}
                            />
                            <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                {item.porcentaje}%
              </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Administracion() {
    const [operadores,    setOperadores]    = useState(DEMO_OPERADORES)
    const [zonas,         setZonas]         = useState(DEMO_ZONAS)
    const [alertas,       setAlertas]       = useState([])
    const [mantenimiento, setMantenimiento] = useState([])

    useEffect(() => {
        async function fetchAll() {
            try {
                const [resOp, resZonas, resAlertas, resMant] = await Promise.all([
                    operadorService.getAll(),
                    zonaService.getAll(),
                    climaService.getAlertasActivas(),
                    mantenimientoService.getAll(),
                ])
                if (resOp?.data)      setOperadores(resOp.data)
                if (resZonas?.data)   setZonas(resZonas.data)
                if (resAlertas?.data) setAlertas(resAlertas.data)
                if (resMant?.data)    setMantenimiento(resMant.data)
            } catch { /* mantiene demo data si backend no responde */ }
        }
        fetchAll()
    }, [])

    const alertasActivas = alertas.filter(a => a.activa).length

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>
            {/* Hero */}
            <AdminHero operadores={operadores} zonas={zonas} alertasActivas={alertasActivas} />

            {/* Métricas */}
            <MetricasRapidas operadores={operadores} zonas={zonas} mantenimiento={mantenimiento} alertas={alertas} />

            {/* Divider */}
            <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

            {/* Main grid: 2 cols on large */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    <GestionOperadores operadores={operadores} setOperadores={setOperadores} zonas={zonas} />
                    <GestionZonas      zonas={zonas}           setZonas={setZonas} />
                    <Mantenimiento     items={mantenimiento}   setItems={setMantenimiento} />
                </div>

                {/* Right (1/3) — Alertas climáticas sticky */}
                <div className="xl:col-span-1">
                    <div className="sticky top-24">
                        <AlertasClimaticas alertas={alertas} setAlertas={setAlertas} />

                        {/* Panel de resumen rápido */}
                        <div className="glass rounded-2xl p-5">
                            <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                                Resumen del sistema
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'Operadores activos',     value: operadores.filter(o => o.estado === 'ACTIVO').length,      total: operadores.length,       color: '#2a9d8f' },
                                    { label: 'Zonas operativas',        value: zonas.filter(z => z.estado === 'ABIERTA').length,         total: zonas.length,            color: '#f4a261' },
                                    { label: 'Mantenimientos resueltos',value: mantenimiento.filter(m => m.estado === 'RESUELTA').length, total: mantenimiento.length,    color: '#22c55e' },
                                    { label: 'Alertas climáticas',      value: alertas.filter(a => a.activa).length,                    total: alertas.length,          color: '#e63946' },
                                ].map(({ label, value, total, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span style={{ color: 'var(--c-muted)' }}>{label}</span>
                                            <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>
                        {value}/{total}
                      </span>
                                        </div>
                                        <ProgressBar value={value} max={total || 1} color={color} />
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