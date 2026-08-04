import { useEffect, useState } from 'react'
import { Plus, Trash2, ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react'
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
import { eliminarEsquema } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { EsquemaWizard } from '@/components/eventos/detalle/grupos-trabajo/EsquemaWizard'
import { AlertTriangle } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const ESTADO_CONFIG = {
  borrador: { label: 'Borrador', variant: 'outline' },
  generado: { label: 'Generado', variant: 'default' },
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
}) {
  const [esquemaActivo, setEsquemaActivo] = useState(null)
  const [esquemaAEliminar, setEsquemaAEliminar] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)

  async function handleEliminar() {
    if (!esquemaAEliminar) return
    setEliminandoId(esquemaAEliminar.id)
    try {
      await eliminarEsquema(evento.id, esquemaAEliminar.id)
      setEsquemas((prev) => prev.filter((e) => e.id !== esquemaAEliminar.id))
      setGruposCache?.((prev) => {
        const next = { ...prev }
        delete next[esquemaAEliminar.id]
        return next
      })
      toast.success('Esquema eliminado.')
      setEsquemaAEliminar(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar el esquema.'))
    } finally {
      setEliminandoId(null)
    }
  }

  // Mostrar wizard si hay esquema activo
  if (esquemaActivo !== null) {
    return (
      <EsquemaWizard
        evento={evento}
        esquemaId={esquemaActivo === 'nuevo' ? null : esquemaActivo}
        participantes={participantes}
        participantesCargando={participantesCargando}
        gruposCache={gruposCache}
        setGruposCache={setGruposCache}
        onVolver={(huboCambios) => {
          setEsquemaActivo(null)
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
        <Button onClick={() => setEsquemaActivo('nuevo')} className="gap-2" size="sm">
          <Plus className="h-4 w-4" />
          Nuevo esquema
        </Button>
      </div>

      {esquemasCargando ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : esquemas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm font-medium text-foreground">Sin esquemas todavía</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Creá un esquema para organizar los participantes en grupos.
          </p>
          <Button
            onClick={() => setEsquemaActivo('nuevo')}
            variant="outline"
            className="mt-4 gap-2"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Crear primer esquema
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {esquemas.map((esquema) => {
            const estadoConfig = ESTADO_CONFIG[esquema.estado] ?? ESTADO_CONFIG.borrador
            return (
              <Card
                key={esquema.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setEsquemaActivo(esquema.id)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {esquema.nombre}
                      </p>
                      <Badge variant={estadoConfig.variant} className="shrink-0">
                        {estadoConfig.label}
                      </Badge>
                      {esquema.estado === 'generado' && esquema.nuevos_no_contemplados > 0 && (
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
                              {esquema.nuevos_no_contemplados} no contemplado{esquema.nuevos_no_contemplados !== 1 ? 's' : ''}. Abrí el esquema y regenerá.
                            </p>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {esquema.modo_tamano === 'por_cantidad'
                        ? `${esquema.valor_tamano} grupos`
                        : `Grupos de ${esquema.valor_tamano} personas`}
                      {' · '}
                      {esquema.estado === 'generado' && esquema.generado_en
                        ? `Generado el ${formatearFecha(esquema.generado_en)}`
                        : `Creado el ${formatearFecha(esquema.creado_en)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEsquemaAEliminar(esquema)
                      }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                    >
                      {eliminandoId === esquema.id
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
        open={!!esquemaAEliminar}
        onOpenChange={(v) => !v && setEsquemaAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esquema?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán el esquema "{esquemaAEliminar?.nombre}", todos sus grupos generados y los registros de pendientes.
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