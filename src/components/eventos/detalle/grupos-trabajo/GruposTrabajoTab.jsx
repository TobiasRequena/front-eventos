import { useState } from 'react'
import { Plus, Trash2, ChevronRight, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertTriangle } from 'lucide-react'
import { eliminarAgrupacion } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { AgrupacionEditor } from '@/components/eventos/detalle/grupos-trabajo/AgrupacionEditor'
import { cn } from '@/lib/utils'

const ESTADO_CONFIG = {
  borrador: { label: 'Borrador', variant: 'outline' },
  generado: { label: 'Generada', variant: 'default' },
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(fechaIso))
}

export function GruposTrabajoTab({
  evento,
  participantes,
  participantesCargando,
  esquemas,
  setEsquemas,
  esquemasCargando,
  onRecargarEsquemas,
  gruposCache,
  setGruposCache,
  onRefresh,
  refreshing,
}) {
  const [agrupacionActiva, setAgrupacionActiva] = useState(null)
  const [agrupacionAEliminar, setAgrupacionAEliminar] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)

  async function handleEliminar() {
    if (!agrupacionAEliminar) return
    setEliminandoId(agrupacionAEliminar.id)
    try {
      await eliminarAgrupacion(evento.id, agrupacionAEliminar.id)
      setEsquemas((prev) => prev.filter((e) => e.id !== agrupacionAEliminar.id))
      setGruposCache?.((prev) => {
        const next = { ...prev }
        delete next[agrupacionAEliminar.id]
        return next
      })
      toast.success('Agrupación eliminada.')
      setAgrupacionAEliminar(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar la agrupación.'))
    } finally {
      setEliminandoId(null)
    }
  }

  if (agrupacionActiva !== null) {
    return (
      <AgrupacionEditor
        evento={evento}
        agrupacionId={agrupacionActiva === 'nueva' ? null : agrupacionActiva}
        participantes={participantes}
        participantesCargando={participantesCargando}
        gruposCache={gruposCache}
        setGruposCache={setGruposCache}
        onVolver={(huboCambios) => {
          setAgrupacionActiva(null)
          if (huboCambios) onRecargarEsquemas()
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Grupos de trabajo</h3>
          <p className="text-xs text-muted-foreground">
            Organizá los participantes en grupos según criterios personalizados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refrescar</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={() => setAgrupacionActiva('nueva')}
            className="gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Nueva agrupación
          </Button>
        </div>
      </div>

      {esquemasCargando ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : esquemas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-foreground">Sin agrupaciones todavía</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá una agrupación para organizar los participantes en grupos.
          </p>
          <Button
            onClick={() => setAgrupacionActiva('nueva')}
            variant="outline"
            className="mt-4 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Crear primera agrupación
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {esquemas.map((agrupacion) => {
            const estadoConfig = ESTADO_CONFIG[agrupacion.estado] ?? ESTADO_CONFIG.borrador
            return (
              <Card
                key={agrupacion.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setAgrupacionActiva(agrupacion.id)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {agrupacion.nombre}
                      </p>
                      <Badge variant={estadoConfig.variant} className="shrink-0">
                        {estadoConfig.label}
                      </Badge>
                      {agrupacion.estado === 'generado' && agrupacion.nuevos_no_contemplados > 0 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90"
                            >
                              <AlertTriangle className="h-2.5 w-2.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 text-sm" side="right">
                            <p className="font-medium text-foreground">Participantes nuevos</p>
                            <p className="mt-1 text-muted-foreground">
                              {agrupacion.nuevos_no_contemplados} no contemplado{agrupacion.nuevos_no_contemplados !== 1 ? 's' : ''}. Abrí la agrupación y regenerá.
                            </p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {agrupacion.modo_tamano === 'por_cantidad'
                        ? `${agrupacion.valor_tamano} grupos`
                        : `Grupos de ${agrupacion.valor_tamano} personas`}
                      {' · '}
                      {agrupacion.estado === 'generado' && agrupacion.generado_en
                        ? `Generada el ${formatearFecha(agrupacion.generado_en)}`
                        : `Creada el ${formatearFecha(agrupacion.creado_en)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAgrupacionAEliminar(agrupacion)
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      {eliminandoId === agrupacion.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                      }
                    </button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog
        open={!!agrupacionAEliminar}
        onOpenChange={(v) => !v && setAgrupacionAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agrupación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán la agrupación "{agrupacionAEliminar?.nombre}", todos sus grupos generados y los registros de pendientes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!eliminandoId}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={!!eliminandoId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminandoId ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}