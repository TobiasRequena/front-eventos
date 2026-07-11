import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { GuestRoute } from '@/routes/GuestRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import EventosPage from '@/pages/eventos/EventosPage'
import CrearEventoPage from '@/pages/eventos/CrearEventoPage'
import EventoDetallePage from '@/pages/eventos/EventoDetallePage'
import InscripcionPage from '@/pages/inscripcion/InscripcionPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/inscribirse/:codigoEvento" element={<InscripcionPage />} />

      <Route
        path="*"
        element={
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/eventos" element={<Navigate to="/eventos/activos" replace />} />
                  <Route path="/eventos/nuevo" element={<CrearEventoPage />} />
                  <Route path="/eventos/:id/detalle" element={<EventoDetallePage />} />
                  <Route path="/eventos/:estado" element={<EventosPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        }
      />
    </Routes>
  )
}