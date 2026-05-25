import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'

// Pages — lazy-loaded for performance
import { lazy, Suspense } from 'react'
import PageLoader from '@/components/ui/PageLoader'

const Inicio        = lazy(() => import('@/pages/Inicio'))
const Administracion = lazy(() => import('@/pages/Administracion'))
const Visitante     = lazy(() => import('@/pages/Visitante'))
const Rutas         = lazy(() => import('@/pages/Rutas'))
const Estadisticas  = lazy(() => import('@/pages/Estadisticas'))
const Mapa          = lazy(() => import('@/pages/Mapa'))
const Carga         = lazy(() => import('@/pages/Carga'))

export default function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/"            element={<Inicio />} />
                    <Route path="/admin"       element={<Administracion />} />
                    <Route path="/visitante"   element={<Visitante />} />
                    <Route path="/rutas"       element={<Rutas />} />
                    <Route path="/estadisticas" element={<Estadisticas />} />
                    <Route path="/mapa"        element={<Mapa />} />
                    <Route path="/carga"       element={<Carga />} />
                </Route>
            </Routes>
        </Suspense>
    )
}