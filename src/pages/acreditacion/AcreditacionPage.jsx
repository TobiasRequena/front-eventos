import { useParams } from 'react-router-dom'
import { useAcreditacion } from '@/hooks/useAcreditacion'
import { AcreditacionLogin } from '@/pages/acreditacion/AcreditacionLogin'
import { AcreditacionEscaner } from '@/pages/acreditacion/AcreditacionEscaner'
import { getEventoPorCodigo } from '@/api/inscripcion.api'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AcreditacionPage() {
  const { codigoEvento } = useParams()
  const acreditacion = useAcreditacion()
  const [evento, setEvento] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!codigoEvento) return
    getEventoPorCodigo(codigoEvento)
      .then((data) => {
        setEvento(data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [codigoEvento])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-8">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-2/3 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (status === 'error' || !evento) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/40 p-8 text-center">
        <p className="text-sm text-muted-foreground">Evento no encontrado.</p>
      </div>
    )
  }

  // Si la sesión guardada es de otro evento, la limpiamos
  if (acreditacion.isAuthenticated && acreditacion.sesion.eventoId !== evento.id) {
    acreditacion.cerrarSesion()
  }

  if (!acreditacion.isAuthenticated) {
    return (
      <AcreditacionLogin
        evento={evento}
        onLogin={({ nombre, apellido }) =>
          acreditacion.iniciarSesion({ nombre, apellido, eventoId: evento.id })
        }
        isLoading={acreditacion.isLoading}
        error={acreditacion.error}
      />
    )
  }

  return (
    <AcreditacionEscaner
      evento={evento}
      sesion={acreditacion.sesion}
      onCerrarSesion={acreditacion.cerrarSesion}
    />
  )
}