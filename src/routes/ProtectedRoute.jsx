import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, cerroSesion } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Si cerró sesión a propósito va a la landing; si no hay sesión (o venció), a iniciar sesión
    if (cerroSesion) return <Navigate to="/" replace />
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}