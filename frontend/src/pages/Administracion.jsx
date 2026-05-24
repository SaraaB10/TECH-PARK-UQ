// src/pages/Administracion.jsx  ─── REEMPLAZO COMPLETO
import React, { useState, useCallback } from 'react'
import {
    Users, MapPin, AlertTriangle,
    Plus, Trash2, UserCheck, Cloud, CloudLightning,
    CloudRain, CheckCircle, XCircle, Wrench, Shield,
    TrendingUp, RefreshCw,
} from 'lucide-react'
import { StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import ProgressBar from '@/components/ui/ProgressBar'
import { Input } from '@/components/ui/Input'
import {
    operadorService,
    zonaService,
    climaService,
    alertaService,
} from '@/services/parqueService'
import { useApp } from '@/context/AppContext'

// ─── Colores por índice ───────────────────────────────────────────────────────
const ZONA_COLORS = ['#f4a261', '#457b9d', '#6a4c93', '#2a9d8f', '#e63946']
const ZONA_ICONOS = ['🎢', '🌊', '🎭', '🎡', '🏔️']

function colorForIndex(index) { return ZONA_COLORS[index % ZONA_COLORS.length] }
function iconoForIndex(index) { return ZONA_ICONOS[index % ZONA_ICONOS.length] }
function initials(nombre = '') {
    return nombre.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase()
}
function tipoAlertaLabel(tipo) {
    if (tipo === 'TORMENTA_ELECTRICA') return 'Tormenta eléctrica'
    if (tipo === 'LLUVIA_FUERTE') return 'Lluvia fuerte'
    return tipo
}
function hashColor(str = '') {
    let h = 0
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
    return ZONA_COLORS[h % ZONA_COLORS.length]
}

// ─── Adaptadores ──────────────────────────────────────────────────────────────
function adaptarOperador(op) {
    return {
        id:           op.id,
        nombre:       op.nombre     || '',
        email:        op.email      || '',
        edad:         op.edad       || '',
        telefono:     op.telefono   || '',
        zonaAsignada: op.zonaAsignada || 'Sin zona asignada',
        activo:       op.zonaAsignada && op.zonaAsignada !== 'Sin zona asignada',
    }
}
function adaptarZona(z, index) {
    return {
        id:                  z.id,
        nombre:              z.nombre              || '',
        capacidadMaxima:     z.capacidadMaxima     || 0,
        visitantesActuales:  z.visitantesActuales  || 0,
        cantidadAtracciones: z.cantidadAtracciones || 0,
        estaLlena:           z.estaLlena           || false,
        color:               colorForIndex(index),
        icono:               iconoForIndex(index),
    }
}
function adaptarAlertaClimatica(a) {
    return {
        id:                  a.id,
        tipo:                a.tipo    || '',
        activa:              !!a.activa,
        atraccionesAfectadas: Array.isArray(a.atraccionesAfectadas) ? a.atraccionesAfectadas : [],
    }
}
function adaptarAlertaMantenimiento(a) {
    return {
        id:              a.id              || a.idAlerta || '',
        nombreAtraccion: a.nombreAtraccion || a.atraccion || a.nombre || 'Atracción desconocida',
        idAtraccion:     a.idAtraccion     || a.atraccionId || '',
        resuelta:        !!a.resuelta,
        fecha:           a.fecha           || a.fechaCreacion || '',
        descripcion:     a.descripcion     || a.mensaje       || '',
    }
}

// ─── Hero compacto ────────────────────────────────────────────────────────────
function AdminHero({ operadores, zonas, alertasActivas }) {
    return (
        <div
            className="relative overflow-hidden rounded-3xl mb-8"
            style={{
                background: 'linear-gradient(135deg, rgba(26,29,40,0.95), rgba(13,15,20,0.98))',
                border: '0.5px solid var(--c-border)',
            }}
        >
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#6a4c93' }} />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#e63946' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,#e63946,#f4a261,#e9c46a,#2a9d8f,#457b9d,#6a4c93)' }} />

            <div className="relative z-10 px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                             style={{ background: 'rgba(106,76,147,0.2)', border: '0.5px solid rgba(106,76,147,0.3)' }}>
                            <Shield size={16} style={{ color: '#6a4c93' }} />
                        </div>
                        <span className="text-xs uppercase tracking-widest font-semibold"
                              style={{ fontFamily: 'var(--font-display)', color: '#6a4c93' }}>
                            Panel administrativo
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2"
                        style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                        Administración <span className="text-rainbow">Central</span>
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--c-muted)' }}>
                        Control total de personal, zonas, mantenimiento y alertas del parque.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                        <Users size={14} style={{ color: '#2a9d8f' }} />
                        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            {operadores.length}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Operadores</span>
                    </div>
                    <div className="glass rounded-xl px-4 py-3 flex items-center gap-2">
                        <MapPin size={14} style={{ color: '#f4a261' }} />
                        <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>
                            {zonas.length}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Zonas</span>
                    </div>
                    {alertasActivas > 0 && (
                        <div className="rounded-xl px-4 py-3 flex items-center gap-2"
                             style={{ background: 'rgba(230,57,70,0.1)', border: '0.5px solid rgba(230,57,70,0.25)' }}>
                            <AlertTriangle size={14} style={{ color: '#e63946' }} />
                            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#e63946' }}>
                                {alertasActivas}
                            </span>
                            <span className="text-xs" style={{ color: 'rgba(230,57,70,0.7)' }}>Alertas</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Métricas rápidas ─────────────────────────────────────────────────────────
function MetricasRapidas({ operadores, zonas, mantenimiento }) {
    const activos       = operadores.filter(o => o.activo).length
    const zonasAbiertas = zonas.filter(z => !z.estaLlena).length
    const incidentes    = mantenimiento.filter(m => !m.resuelta).length
    const resueltas     = mantenimiento.filter(m => m.resuelta).length
    const eficiencia    = mantenimiento.length
        ? Math.round((resueltas / mantenimiento.length) * 100)
        : 100

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Operadores activos" value={activos} sub={`${operadores.length} en total`} accent="#2a9d8f" icon={UserCheck} className="animate-fade-up-delay-1" />
            <StatCard label="Zonas disponibles" value={zonasAbiertas} sub={`de ${zonas.length} zonas`} accent="#f4a261" icon={MapPin} className="animate-fade-up-delay-2" />
            <StatCard label="Incidentes activos" value={incidentes} sub={incidentes > 0 ? 'Requieren atención' : 'Sin incidentes'} accent={incidentes > 0 ? '#e63946' : '#22c55e'} icon={Wrench} className="animate-fade-up-delay-3" />
            <StatCard label="Eficiencia operativa" value={`${eficiencia}%`} sub="Mantenimientos resueltos" accent="#6a4c93" icon={TrendingUp} className="animate-fade-up-delay-4" />
        </div>
    )
}

// ─── Gestión de operadores ────────────────────────────────────────────────────
function GestionOperadores({ operadores, setOperadores, zonas, onRefresh }) {
    const [showForm,  setShowForm]  = useState(false)
    const [loading,   setLoading]   = useState(false)
    const [error,     setError]     = useState('')
    const [asignando, setAsignando] = useState(null)
    const [zonaSelec, setZonaSelec] = useState('')
    const [form, setForm] = useState({ id: '', nombre: '', edad: '', telefono: '', email: '', contrasena: '' })

    async function handleCrear() {
        if (!form.id || !form.nombre || !form.email) { setError('ID, nombre y correo son obligatorios.'); return }
        if (form.telefono && form.telefono.length !== 10) { setError('El teléfono debe tener exactamente 10 dígitos.'); return }
        setError(''); setLoading(true)
        try {
            await operadorService.create({ id: form.id, nombre: form.nombre, edad: form.edad ? parseInt(form.edad, 10) : null, telefono: form.telefono, email: form.email, contrasena: form.contrasena })
            await onRefresh()
            setForm({ id: '', nombre: '', edad: '', telefono: '', email: '', contrasena: '' })
            setShowForm(false)
        } catch (e) {
            setError(e?.response?.data || 'Error al crear operador.')
        } finally { setLoading(false) }
    }

    async function handleEliminar(id) {
        try {
            await operadorService.delete(id)
            setOperadores(prev => prev.filter(o => o.id !== id))
            await onRefresh()
        } catch (e) { console.error('Error eliminando operador:', e) }
    }

    async function handleAsignar(operadorId) {
        if (!zonaSelec) return
        const zona = zonas.find(z => String(z.id) === String(zonaSelec))
        try {
            await operadorService.asignarZona(operadorId, zonaSelec)
            setOperadores(prev => prev.map(o => o.id === operadorId ? { ...o, zonaAsignada: zona?.nombre || zonaSelec, activo: true } : o))
            await onRefresh()
        } catch (e) { console.error('Error asignando zona:', e) }
        finally { setAsignando(null); setZonaSelec('') }
    }

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
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
                <Button variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setError('') }}>
                    <Plus size={13} /> Nuevo operador
                </Button>
            </div>

            {showForm && (
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}>{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input label="ID del operador" placeholder="Ej: OP-004" value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))} />
                        <Input label="Nombre completo" placeholder="Ej: Carlos Mendoza" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                        <Input label="Correo electrónico" type="email" placeholder="nombre@uq.edu.co" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                        <Input label="Edad" type="number" placeholder="Ej: 28" value={form.edad} onChange={e => setForm(p => ({ ...p, edad: e.target.value }))} />
                        <Input label="Teléfono" type="tel" placeholder="Ej: 3101234567" maxLength={10} value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) }))} />
                        <Input label="Contraseña" type="password" placeholder="••••••" value={form.contrasena} onChange={e => setForm(p => ({ ...p, contrasena: e.target.value }))} />
                        <div className="flex items-end">
                            <Button variant="success" size="md" loading={loading} onClick={handleCrear} className="w-full justify-center">
                                <CheckCircle size={14} /> Crear operador
                            </Button>
                        </div>
                    </div>
                </div>
            )}

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
                    {operadores.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-8" style={{ color: 'var(--c-muted)' }}>No hay operadores registrados.</td></tr>
                    )}
                    {operadores.map((op) => {
                        const avatarColor = hashColor(op.id)
                        return (
                            <React.Fragment key={op.id}>
                                <tr>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                 style={{ background: `${avatarColor}22`, color: avatarColor, border: `0.5px solid ${avatarColor}44`, fontFamily: 'var(--font-display)' }}>
                                                {initials(op.nombre)}
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: 'var(--c-text)', fontFamily: 'var(--font-body)' }}>{op.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell"><span className="font-mono text-xs" style={{ color: 'var(--c-muted)' }}>{op.email}</span></td>
                                    <td><span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--c-dim)', border: '0.5px solid var(--c-border)' }}>{op.zonaAsignada}</span></td>
                                    <td><Badge variant={op.activo ? 'active' : 'closed'} dot>{op.activo ? 'Activo' : 'Sin zona'}</Badge></td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <button className="text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                    style={{ background: 'rgba(69,123,157,0.12)', color: '#457b9d', border: '0.5px solid rgba(69,123,157,0.25)' }}
                                                    onClick={() => setAsignando(asignando === op.id ? null : op.id)}>
                                                <MapPin size={11} /> Zona
                                            </button>
                                            <button className="text-xs px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                                    style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}
                                                    onClick={() => handleEliminar(op.id)}>
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {asignando === op.id && (
                                    <tr key={`assign-${op.id}`}>
                                        <td colSpan={5} style={{ background: 'rgba(69,123,157,0.05)', padding: '12px 16px' }}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs" style={{ color: 'var(--c-muted)' }}>Asignar a zona:</span>
                                                <select className="tp-input tp-select" style={{ maxWidth: 200 }} value={zonaSelec} onChange={e => setZonaSelec(e.target.value)}>
                                                    <option value="">Seleccionar zona…</option>
                                                    {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                                                </select>
                                                <Button variant="success" size="sm" onClick={() => handleAsignar(op.id)}><CheckCircle size={12} /> Asignar</Button>
                                                <Button variant="ghost" size="sm" onClick={() => setAsignando(null)}>Cancelar</Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Gestión de zonas ─────────────────────────────────────────────────────────
function GestionZonas({ zonas, onRefresh }) {
    const [showForm, setShowForm] = useState(false)
    const [form, setForm]         = useState({ id: '', nombre: '', capacidadMaxima: '' })
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')

    async function handleCrear() {
        if (!form.id || !form.nombre || !form.capacidadMaxima) { setError('ID, nombre y capacidad son obligatorios.'); return }
        setError(''); setLoading(true)
        try {
            await zonaService.create({ id: form.id, nombre: form.nombre, capacidadMaxima: parseInt(form.capacidadMaxima, 10) })
            await onRefresh()
            setForm({ id: '', nombre: '', capacidadMaxima: '' })
            setShowForm(false)
        } catch (e) {
            setError(e?.response?.data || 'Error al crear la zona.')
        } finally { setLoading(false) }
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
                <Button variant="primary" size="sm" onClick={() => { setShowForm(!showForm); setError('') }}><Plus size={13} /> Nueva zona</Button>
            </div>

            {showForm && (
                <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)', background: 'rgba(255,255,255,0.02)' }}>
                    {error && <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '0.5px solid rgba(230,57,70,0.2)' }}>{error}</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input label="ID de la zona" placeholder="Ej: ZONA-04" value={form.id} onChange={e => setForm(p => ({ ...p, id: e.target.value }))} />
                        <Input label="Nombre de la zona" placeholder="Ej: Zona Virtual" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
                        <Input label="Capacidad máxima" type="number" placeholder="Ej: 500" value={form.capacidadMaxima} onChange={e => setForm(p => ({ ...p, capacidadMaxima: e.target.value }))} />
                        <div className="flex items-end">
                            <Button variant="success" size="md" loading={loading} onClick={handleCrear} className="w-full justify-center"><CheckCircle size={14} /> Crear zona</Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {zonas.length === 0 && <p className="col-span-3 text-center py-8 text-sm" style={{ color: 'var(--c-muted)' }}>No hay zonas cargadas.</p>}
                {zonas.map((zona) => {
                    const cap      = zona.capacidadMaxima || 1
                    const act      = zona.visitantesActuales || 0
                    const pct      = Math.round((act / cap) * 100)
                    const saturada = zona.estaLlena || pct >= 80
                    return (
                        <div key={zona.id} className="rounded-2xl p-4 relative overflow-hidden group"
                             style={{ background: 'rgba(255,255,255,0.03)', border: `0.5px solid ${zona.color}30`, borderTop: `2px solid ${zona.color}` }}>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl" style={{ background: `${zona.color}08` }} />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{zona.icono}</span>
                                        <div>
                                            <h3 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{zona.nombre}</h3>
                                            <p className="text-xs" style={{ color: 'var(--c-muted)' }}>Cap. {cap.toLocaleString('es-CO')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {saturada && <Badge variant="pending" dot>Saturada</Badge>}
                                        <Badge variant={saturada ? 'closed' : 'active'} dot>{saturada ? 'Llena' : 'Disponible'}</Badge>
                                    </div>
                                </div>
                                <div className="mb-1"><ProgressBar value={act} max={cap} color={saturada ? '#e63946' : zona.color} /></div>
                                <div className="flex justify-between text-xs mb-3" style={{ color: 'var(--c-muted)' }}>
                                    <span>{act} visitantes</span>
                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color: saturada ? '#e63946' : zona.color }}>{pct}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                        <span className="font-semibold" style={{ color: 'var(--c-text)' }}>{zona.cantidadAtracciones}</span>{' '}atracciones
                                    </span>
                                    <span className="text-xs font-mono" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>#{zona.id}</span>
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
function AlertasClimaticas({ alertas, setAlertas, onRefreshAtracciones }) {
    const [loading, setLoading] = useState(null)

    async function activar(tipo) {
        setLoading(tipo)
        try {
            const fn  = tipo === 'tormenta' ? climaService.activarTormenta : climaService.activarLluvia
            const res = await fn()
            const nueva = adaptarAlertaClimatica({ ...res.data, activa: true })
            setAlertas(prev => [...prev, nueva])
            // Refrescar atracciones porque el backend las cierra
            await onRefreshAtracciones()
        } catch (e) { console.error('Error activando alerta:', e) }
        finally { setLoading(null) }
    }

    async function desactivar(id) {
        try {
            await climaService.desactivar(id)
            setAlertas(prev => prev.map(a => a.id === id ? { ...a, activa: false } : a))
            // Refrescar atracciones porque el backend las reactiva
            await onRefreshAtracciones()
        } catch (e) { console.error('Error desactivando alerta:', e) }
    }

    const activas = alertas.filter(a => a.activa).length

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(233,196,106,0.15)', border: '0.5px solid rgba(233,196,106,0.25)' }}>
                        <Cloud size={15} style={{ color: '#e9c46a' }} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Alertas climáticas</h2>
                        <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{activas} activas ahora</p>
                    </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Button variant="danger" size="sm" loading={loading === 'tormenta'} onClick={() => activar('tormenta')}>
                        <CloudLightning size={13} /> Activar tormenta eléctrica
                    </Button>
                    <Button variant="ghost" size="sm" loading={loading === 'lluvia'} onClick={() => activar('lluvia')}>
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
                    <div key={alerta.id} className="flex items-center justify-between rounded-xl px-4 py-3"
                         style={{ background: alerta.activa ? 'rgba(230,57,70,0.07)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${alerta.activa ? 'rgba(230,57,70,0.2)' : 'var(--c-border)'}` }}>
                        <div className="flex items-center gap-3">
                            {alerta.tipo === 'TORMENTA_ELECTRICA'
                                ? <CloudLightning size={16} style={{ color: alerta.activa ? '#e9c46a' : 'var(--c-muted)' }} />
                                : <CloudRain      size={16} style={{ color: alerta.activa ? '#457b9d' : 'var(--c-muted)' }} />}
                            <div>
                                <p className="text-sm font-medium" style={{ color: alerta.activa ? 'var(--c-text)' : 'var(--c-muted)', fontFamily: 'var(--font-body)' }}>
                                    {tipoAlertaLabel(alerta.tipo)}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--c-muted)' }}>
                                    {alerta.atraccionesAfectadas.length > 0 ? `${alerta.atraccionesAfectadas.length} atracciones afectadas` : 'Sin atracciones afectadas'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={alerta.activa ? 'pending' : 'resolved'} dot>{alerta.activa ? 'Activa' : 'Inactiva'}</Badge>
                            {alerta.activa && (
                                <button onClick={() => desactivar(alerta.id)}
                                        className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '0.5px solid rgba(34,197,94,0.2)' }}>
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
function Mantenimiento({ items, setItems, onRefreshAtracciones }) {
    const [loading, setLoading] = useState(null)

    async function resolverAlerta(idAlerta) {
        setLoading(idAlerta)
        try {
            await alertaService.resolverMantenimiento(idAlerta)
            setItems(prev => prev.map(m => m.id === idAlerta ? { ...m, resuelta: true } : m))
            // Refrescar atracciones porque el backend las reactiva
            await onRefreshAtracciones()
        } catch (e) { console.error('Error resolviendo alerta:', e) }
        finally { setLoading(null) }
    }

    const pendientes = items.filter(i => !i.resuelta).length

    return (
        <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--c-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(230,57,70,0.12)', border: '0.5px solid rgba(230,57,70,0.2)' }}>
                    <Wrench size={15} style={{ color: '#e63946' }} />
                </div>
                <div>
                    <h2 className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Mantenimiento preventivo</h2>
                    <p className="text-xs" style={{ color: 'var(--c-muted)' }}>{pendientes} pendientes de revisión</p>
                </div>
            </div>
            <div className="p-4 space-y-3">
                {items.length === 0 && (
                    <div className="text-center py-6" style={{ color: 'var(--c-muted)' }}>
                        <CheckCircle size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Sin alertas de mantenimiento</p>
                    </div>
                )}
                {items.map((item) => {
                    const resuelta = item.resuelta
                    return (
                        <div key={item.id} className="rounded-xl p-4"
                             style={{ background: !resuelta ? 'rgba(230,57,70,0.05)' : 'rgba(255,255,255,0.02)', border: `0.5px solid ${!resuelta ? 'rgba(230,57,70,0.18)' : 'var(--c-border)'}` }}>
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                         style={{ background: !resuelta ? 'rgba(230,57,70,0.12)' : 'rgba(34,197,94,0.1)', border: `0.5px solid ${!resuelta ? 'rgba(230,57,70,0.2)' : 'rgba(34,197,94,0.2)'}` }}>
                                        <Wrench size={15} style={{ color: !resuelta ? '#e63946' : '#22c55e' }} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>{item.nombreAtraccion}</p>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                                            {item.descripcion ? item.descripcion : item.fecha ? `Registrada: ${item.fecha}` : `ID: ${item.id}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge variant={!resuelta ? 'pending' : 'resolved'} dot>{!resuelta ? 'Pendiente' : 'Resuelta'}</Badge>
                                    {!resuelta && (
                                        <Button variant="success" size="sm" loading={loading === item.id} onClick={() => resolverAlerta(item.id)}>
                                            <CheckCircle size={12} /> Resolver
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <ProgressBar value={resuelta ? 100 : 0} max={100} color={!resuelta ? '#e63946' : '#22c55e'} />
                                <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {resuelta ? '100%' : '0%'}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Administracion() {
    const {
        operadores:          opCtx,
        zonas:               zonasCtx,
        alertasClimaticas:   alertasCtx,
        alertasMantenimiento: mantCtx,
        cargandoGlobal,
        setOperadores:       setOpCtx,
        setAlertasClimaticas: setAlertasCtx,
        setAlertasMantenimiento: setMantCtx,
        refrescarTodo,
        refrescarOperadores,
        refrescarAlertas,
        refrescarAtracciones,
    } = useApp()

    // Adaptar datos del contexto a la forma que esperan los sub-componentes
    const operadores    = opCtx.map(adaptarOperador)
    const zonas         = zonasCtx.map((z, i) => adaptarZona(z, i))
    const alertas       = alertasCtx.map(adaptarAlertaClimatica)
    const mantenimiento = mantCtx.map(adaptarAlertaMantenimiento)

    // Setters que actualizan el contexto global (no estado local)
    const setOperadores = useCallback(async () => { await refrescarOperadores() }, [refrescarOperadores])

    const setAlertas = useCallback((updater) => {
        setAlertasCtx(prev => {
            const adapted = prev.map(adaptarAlertaClimatica)
            const updated = typeof updater === 'function' ? updater(adapted) : updater
            return updated
        })
    }, [setAlertasCtx])

    const setMantenimiento = useCallback((updater) => {
        setMantCtx(prev => {
            const adapted = prev.map(adaptarAlertaMantenimiento)
            const updated = typeof updater === 'function' ? updater(adapted) : updater
            return updated
        })
    }, [setMantCtx])

    const alertasActivas = alertas.filter(a => a.activa).length

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" style={{ background: 'var(--c-night)' }}>

            {cargandoGlobal && (
                <div className="flex items-center justify-center py-16 gap-3" style={{ color: 'var(--c-muted)' }}>
                    <RefreshCw size={18} className="animate-spin" />
                    <span className="text-sm">Cargando datos del sistema…</span>
                </div>
            )}

            {!cargandoGlobal && (
                <>
                    <AdminHero operadores={operadores} zonas={zonas} alertasActivas={alertasActivas} />

                    <MetricasRapidas operadores={operadores} zonas={zonas} mantenimiento={mantenimiento} alertas={alertas} />

                    <div className="h-px mb-8" style={{ background: 'var(--c-border)' }} />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        {/* Columna izquierda (2/3) */}
                        <div className="xl:col-span-2 space-y-6">
                            <GestionOperadores
                                operadores={operadores}
                                setOperadores={setOpCtx}
                                zonas={zonas}
                                onRefresh={refrescarOperadores}
                            />
                            <GestionZonas
                                zonas={zonas}
                                onRefresh={refrescarTodo}
                            />
                            <Mantenimiento
                                items={mantenimiento}
                                setItems={setMantenimiento}
                                onRefreshAtracciones={refrescarAtracciones}
                            />
                        </div>

                        {/* Columna derecha (1/3) */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-24">
                                <AlertasClimaticas
                                    alertas={alertas}
                                    setAlertas={setAlertas}
                                    onRefreshAtracciones={refrescarAtracciones}
                                />

                                {/* Panel de resumen */}
                                <div className="glass rounded-2xl p-5">
                                    <h3 className="text-sm font-bold mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--c-text)' }}>Resumen del sistema</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Operadores activos',       value: operadores.filter(o => o.activo).length,   total: operadores.length,    color: '#2a9d8f' },
                                            { label: 'Zonas disponibles',         value: zonas.filter(z => !z.estaLlena).length,   total: zonas.length,         color: '#f4a261' },
                                            { label: 'Mantenimientos resueltos', value: mantenimiento.filter(m => m.resuelta).length, total: mantenimiento.length, color: '#22c55e' },
                                            { label: 'Alertas climáticas',       value: alertas.filter(a => a.activa).length,      total: alertas.length,       color: '#e63946' },
                                        ].map(({ label, value, total, color }) => (
                                            <div key={label}>
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span style={{ color: 'var(--c-muted)' }}>{label}</span>
                                                    <span className="font-mono" style={{ fontFamily: 'var(--font-mono)', color }}>{value}/{total}</span>
                                                </div>
                                                <ProgressBar value={value} max={total || 1} color={color} />
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={refrescarTodo}
                                            className="mt-5 w-full flex items-center justify-center gap-2 text-xs py-2 rounded-xl transition-colors"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '0.5px solid var(--c-border)', color: 'var(--c-muted)' }}>
                                        <RefreshCw size={12} /> Actualizar datos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}