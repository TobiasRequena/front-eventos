import { useParams } from 'react-router-dom'
import { useAcreditacion } from '@/hooks/useAcreditacion'
import { AcreditacionLogin } from '@/pages/acreditacion/AcreditacionLogin'
import { AcreditacionEscaner } from '@/pages/acreditacion/AcreditacionEscaner'
import { getEventoPorCodigo } from '@/api/inscripcion.api'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarX2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

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

  const DOS_HORAS_MS = 2 * 60 * 60 * 1000
  const acreditacionCerrada = evento && new Date() > new Date(new Date(evento.fecha_fin).getTime() + DOS_HORAS_MS)

  // Primero verificar sesión de otro evento
  if (acreditacion.isAuthenticated && acreditacion.sesion.eventoId !== evento.id) {
    acreditacion.cerrarSesion()
  }

  // Luego verificar si está autenticado — si no, mostrar login SIEMPRE
  // (incluso si la acreditación está cerrada, para poder cerrar sesión)
  if (!acreditacion.isAuthenticated) {
    return (
      <AcreditacionLogin
        evento={evento}
        cerrada={acreditacionCerrada}
        onLogin={({ nombre, apellido }) =>
          acreditacion.iniciarSesion({ nombre, apellido, eventoId: evento.id })
        }
        isLoading={acreditacion.isLoading}
        error={acreditacion.error}
      />
    )
  }

  // Autenticado — verificar si cerrada
  if (acreditacionCerrada) {
    return (
      <div className="min-h-svh bg-muted/40 flex items-center justify-center p-8">
        <div className="mx-auto max-w-sm text-center space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-muted">
            <CalendarX2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Acreditación cerrada</h2>
          <p className="text-sm text-muted-foreground">
            Este evento ya finalizó. La acreditación no está disponible.
          </p>
          <Button variant="outline" onClick={acreditacion.cerrarSesion} className="gap-2">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    )
  }

  // Autenticado y acreditación abierta
  return (
    <AcreditacionEscaner
      evento={evento}
      sesion={acreditacion.sesion}
      onCerrarSesion={acreditacion.cerrarSesion}
    />
  )
}  