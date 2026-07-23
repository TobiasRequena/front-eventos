import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { ParticipantesDataTable } from '@/components/eventos/detalle/ParticipantesDataTable'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { buildColumns } from '@/components/eventos/detalle/participantes.columns'
import { useParticipantes } from '@/hooks/useParticipantes'
import { eliminarParticipante, getParticipantesEliminados } from '@/api/participantes.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { Download, Loader2, Trash2 } from 'lucide-react'
import { descargarInscriptosExcel } from '@/api/eventos.api'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

function TablaSkeletonRows() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function TabParticipantes({ evento }) {
  const { participantes, setParticipantes, isLoading, isRefreshing, isError, reintentar } = useParticipantes(evento.id)
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [participanteAEliminar, setParticipanteAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [mostrarEliminados, setMostrarEliminados] = useState(false)
  const [eliminados, setEliminados] = useState([])
  const [cargandoEliminados, setCargandoEliminados] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const camposForm = evento.camposForm ?? []

  async function handleToggleEliminados(valor) {
    setMostrarEliminados(valor)
    if (valor && eliminados.length === 0) {
      setCargandoEliminados(true)
      try {
        const data = await getParticipantesEliminados(evento.id)
        setEliminados(data.map((p) => ({ ...p, fecha_nacimiento: p.nacimiento })))
      } catch {
        toast.error('No pudimos cargar los participantes eliminados.')
        setMostrarEliminados(false)
      } finally {
        setCargandoEliminados(false)
      }
    }
  }

  async function handleEliminar() {
    if (!participanteAEliminar) return
    setEliminando(true)
    try {
      await eliminarParticipante(participanteAEliminar.id)
      toast.success('Participante eliminado.')
      reintentar()
      setParticipanteAEliminar(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar al participante.'))
    } finally {
      setEliminando(false)
    }
  }

  async function handleDescargar() {
    setDescargando(true)
    try {
      await descargarInscriptosExcel(evento.id, evento.nombre)
    } catch {
      toast.error('No pudimos generar el Excel.')
    } finally {
      setDescargando(false)
    }
  }

  const columnasEliminados = useMemo(() => [
    {
      id: 'nombre',
      header: 'Nombre',
      accessorFn: (row) => `${row.nombre} ${row.apellido}`,
      enableHiding: false,
      cell: ({ getValue }) => (
        <span className="font-medium text-muted-foreground line-through">
          {getValue()}
        </span>
      ),
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: () => <Badge variant="destructive">Eliminado</Badge>,
    },
    {
      id: 'eliminado_en',
      header: 'Eliminado el',
      accessorKey: 'eliminado_en',
      cell: ({ getValue }) =>
        getValue()
          ? new Intl.DateTimeFormat('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          }).format(new Date(getValue()))
          : '—',
    },
  ], [])

  const columns = useMemo(
    () =>
      buildColumns({
        camposForm,
        tieneCosto: parseFloat(evento?.costo ?? 0) > 0,
        tieneGrupos: evento?.tiene_grupos ?? false,
        onVerDetalle: (participante) => {
          setParticipanteSeleccionado(participante)
          setDrawerAbierto(true)
        },
        onEliminar: (participante) => setParticipanteAEliminar(participante),
      }),
    [camposForm, evento]
  )

  if (isLoading) return <TablaSkeletonRows />

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No pudimos cargar los participantes</p>
        <Button variant="outline" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <ParticipantesDataTable
        columns={mostrarEliminados ? columnasEliminados : columns}
        data={mostrarEliminados ? eliminados : participantes}
        evento={evento}
        camposForm={mostrarEliminados ? [] : camposForm}
        onDescargar={!mostrarEliminados ? handleDescargar : undefined}
        descargando={descargando}
        onRefresh={!mostrarEliminados ? reintentar : undefined}
        refreshing={isRefreshing}
        extraAcciones={
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleToggleEliminados(!mostrarEliminados)}
                  disabled={cargandoEliminados}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    mostrarEliminados
                      ? 'text-destructive bg-destructive/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-destructive'
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {mostrarEliminados ? 'Ocultar eliminados' : 'Ver eliminados'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
      />

      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={camposForm}
        evento={evento}
        open={drawerAbierto}
        onClose={() => {
          setDrawerAbierto(false)
          setParticipanteSeleccionado(null)
        }}
      />

      <AlertDialog
        open={!!participanteAEliminar}
        onOpenChange={(v) => !v && setParticipanteAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
            <AlertDialogDescription>
              {participanteAEliminar?.nombre} {participanteAEliminar?.apellido} será eliminado
              de este evento. Esta acción es reversible durante 90 días.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}