// src/App.jsx  ─── REEMPLAZO COMPLETO
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import { AppProvider } from './context/AppContext'

export default function App() {
    return (
        <AppProvider>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </AppProvider>
    )
}