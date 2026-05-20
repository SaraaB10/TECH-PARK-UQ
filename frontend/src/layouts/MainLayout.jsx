import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@/components/Navbar'

// Pages that use the full-width hero layout (no inner padding)
const FULL_PAGES = ['/']

export default function MainLayout() {
    const { pathname } = useLocation()
    const isFull = FULL_PAGES.includes(pathname)

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-night)' }}>
            <Navbar />

            <main className={`flex-1 ${isFull ? '' : 'pt-20'}`}>
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}

function Footer() {
    return (
        <footer className="border-t mt-16" style={{ borderColor: 'var(--c-border)' }}>
            <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--c-muted)' }}>
          © 2025 Tech-Park UQ — Sistema de Gestión Inteligente de Atracciones
        </span>
                <span className="text-xs font-mono" style={{ color: 'var(--c-muted)' }}>
          v1.0.0
        </span>
            </div>
        </footer>
    )
}