import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'

const NAV_LINKS = [
    { to: '/',            label: 'Inicio' },
    { to: '/admin',       label: 'Administración' },
    { to: '/visitante',   label: 'Visitante' },
    { to: '/rutas',       label: 'Rutas' },
    { to: '/estadisticas', label: 'Estadísticas' },
    { to: '/mapa',        label: 'Mapa' },
    { to: '/carga',       label: 'Carga' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [open, setOpen] = useState(false)
    const location = useLocation()

    const isHome = location.pathname === '/'

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => { setOpen(false) }, [location])

    const navBg = scrolled
        ? 'glass-dark'
        : 'glass-dark'

    return (
        <>
            {/* Rainbow accent bar */}
            <div className="rainbow-bar fixed top-0 left-0 right-0 z-50" />

            <header
                className={clsx(
                    'fixed top-0.5 left-0 right-0 z-40 transition-all duration-500',
                    navBg
                )}
            >
                <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg overflow-hidden ring-1 ring-white/10">
                            <img
                                src="/logo.png"
                                alt="Tech-Park UQ"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentElement.innerHTML =
                                        '<div style="width:100%;height:100%;background:linear-gradient(135deg,#e63946,#6a4c93);display:flex;align-items:center;justify-content:center;font-family:Syne,sans-serif;font-weight:800;color:white;font-size:12px;">TP</div>'
                                }}
                            />
                        </div>
                        <span
                            className="font-display font-700 text-base tracking-tight hidden sm:block"
                            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                        >
              <span className="text-rainbow">Tech-Park</span>
              <span style={{ color: 'var(--c-text)' }}> UQ</span>
            </span>
                    </NavLink>

                    {/* Desktop links */}
                    <ul className="hidden lg:flex items-center gap-6">
                        {NAV_LINKS.map(({ to, label }) => (
                            <li key={to}>
                                <NavLink
                                    to={to}
                                    end={to === '/'}
                                    className={({ isActive }) =>
                                        clsx(
                                            'relative px-3 py-2 rounded-lg text-sm transition-all duration-200 font-body',
                                            isActive
                                                ? 'text-white'
                                                : 'hover:text-white',
                                        )
                                    }
                                    style={({ isActive }) => ({
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '13px',
                                        color: isActive ? 'white' : 'var(--c-dim)',
                                    })}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span
                                                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                                                    style={{ background: 'var(--rainbow)', backgroundSize: '200% 100%' }}
                                                />
                                            )}
                                            <span className="relative z-10 flex items-center gap-1.5">
                        {isActive && <span className="status-dot active" style={{ width: 6, height: 6 }} />}
                                                {label}
                      </span>
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Mobile toggle */}
                    <button
                        className="lg:hidden btn-ghost btn p-2"
                        onClick={() => setOpen(!open)}
                        aria-label="Menú"
                    >
                        {open ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </nav>
            </header>

            {/* Mobile drawer */}
            {open && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ background: 'rgba(13,15,20,0.8)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setOpen(false)}
                >
                    <div
                        className="absolute top-16 left-0 right-0 glass-dark border-b"
                        style={{ borderColor: 'var(--c-border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <ul className="py-2">
                            {NAV_LINKS.map(({ to, label }) => (
                                <li key={to}>
                                    <NavLink
                                        to={to}
                                        end={to === '/'}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                                                isActive
                                                    ? 'text-white'
                                                    : 'text-park-muted hover:text-white'
                                            )
                                        }
                                        style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--c-dim)' }}
                                    >
                                        {({ isActive }) => (
                                            <>
                                                {isActive && <span className="status-dot active" />}
                                                {label}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </>
    )
}