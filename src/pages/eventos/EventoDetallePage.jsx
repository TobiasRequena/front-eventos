import { useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useEvento } from '@/hooks/useEvento'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getEstadoEvento } from '@/lib/eventos.helpers'
import { TabResumen } from '@/components/eventos/detalle/TabResumen'
import { TabParticipantes } from '@/components/eventos/detalle/TabParticipantes'
import { TabAcreditacion } from '@/components/eventos/detalle/TabAcreditacion'
import { EditarEventoPanel } from '@/components/eventos/detalle/EditarEventoPanel'
import { toast } from 'sonner'
import { eliminarEvento } from '@/api/eventos.api'
import { getApiErrorMessage } from '@/api/httpClient'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'participantes', label: 'Participantes' },
  { value: 'acreditacion', label: 'Acreditación' },
]

function HeaderEvento({ evento, onEditar, onEliminar }) {
  const imagenUrl = evento.imagen_url ?? evento.imagenUrl

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-xl bg-muted">
      {imagenUrl && (
        <img
          src={imagenUrl}
          alt={evento.nombre}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {evento.codigo}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm capitalize">
                {getEstadoEvento(evento)}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{evento.nombre}</h1>
            <p className="mt-0.5 text-sm text-white/70">
              {new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(evento.fecha_inicio))}
              {' — '}
              {new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(evento.fecha_fin))}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onEditar}
              className="shrink-0 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm"
            >
              Editar evento
            </Button>
            <Button
              variant="outline"
              onClick={onEliminar}
              className="shrink-0 bg-destructive/20 text-white border-white/20 hover:bg-destructive/40 hover:text-white backdrop-blur-sm"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return <Skeleton className="h-52 w-full rounded-xl" />
}

export default function EventoDetallePage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabActivo = searchParams.get('tab') ?? 'resumen'
  const { evento, setEvento, isLoading, isError, reintentar } = useEvento(id)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  useBreadcrumb([
    { label: 'Eventos', to: '/eventos' },
    { label: isLoading ? '...' : (evento?.nombre ?? 'Detalle') },
  ])

  async function handleEliminar() {
    setEliminando(true)
    try {
      await eliminarEvento(id)
      toast.success('Evento eliminado correctamente.')
      navigate('/eventos', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No pudimos eliminar el evento.'))
      setEliminando(false)
    }
  }

  function handleCambiarTab(nuevoTab) {
    setSearchParams({ tab: nuevoTab })
  }

  function handleGuardado(eventoActualizado) {
    setEvento((prev) => ({ ...prev, ...eventoActualizado }))
    setModoEdicion(false)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No pudimos cargar el evento</p>
        <Button variant="outline" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (modoEdicion && evento) {
    return (
      <EditarEventoPanel
        evento={evento}
        onVolver={() => setModoEdicion(false)}
        onGuardado={handleGuardado}
      />
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {isLoading ? <HeaderSkeleton /> : <HeaderEvento
        evento={evento}
        onEditar={() => setModoEdicion(true)}
        onEliminar={() => setConfirmandoEliminar(true)}
      />}

      <Tabs value={tabActivo} onValueChange={handleCambiarTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          {evento && <TabResumen evento={evento} />}
        </TabsContent>

        <TabsContent value="participantes" className="mt-6">
          {evento && <TabParticipantes evento={evento} />}
        </TabsContent>

        <TabsContent value="acreditacion" className="mt-6">
          {evento && <TabAcreditacion evento={evento} />}
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmandoEliminar} onOpenChange={setConfirmandoEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán el evento y todos sus
              datos asociados (inscriptos, grupos, talleres y pagos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}