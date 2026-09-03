import { useEffect, useState } from 'react'
import { ArrowLeft, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertTriangle } from 'lucide-react'
import { getAgrupacion } from '@/api/gruposTrabajo.api'
import { PasoConfiguracion } from './wizard/PasoConfiguracion'
import { PasoExcluidos } from './wizard/PasoExcluidos'
import { PasoPreview } from './wizard/PasoPreview'
import { PasoGenerar } from './wizard/PasoGenerar'
import { GruposResultado } from './resultado/GruposResultado'
import { cn } from "@/lib/utils"

const PASOS = ['configuracion', 'excluidos', 'preview', 'generar']

export function AgrupacionEditor({
  evento,
  agrupacionId,
  participantes,
  participantesCargando,
  onVolver,
  gruposCache = {},
  setGruposCache = () => { },
}) {
  const [agrupacion, setAgrupacion] = useState(null)
  const [isLoading, setIsLoading] = useState(!!agrupacionId)
  const [pasoActivo, setPasoActivo] = useState('configuracion')
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [huboCambios, setHuboCambios] = useState(false)

  useEffect(() => {
    if (!agrupacionId) return
    setIsLoading(true)
    getAgrupacion(evento.id, agrupacionId)
      .then((data) => {
        setAgrupacion(data)
        if (data.estado === 'generado') setMostrarResultado(true)
      })
      .catch(() => toast.error('No pudimos cargar la agrupación.'))
      .finally(() => setIsLoading(false))
  }, [agrupacionId, evento.id])

  function handleCreada(nueva) {
    setAgrupacion(nueva)
    setHuboCambios(true)
  }

  function handleActualizada(actualizada) {
    setAgrupacion(actualizada)
    setHuboCambios(true)
  }

  function handleGenerado() {
    setHuboCambios(true)
    setGruposCache((prev) => {
      const next = { ...prev }
      delete next[agrupacion.id]
      return next
    })
    getAgrupacion(evento.id, agrupacion.id).then((data) => {
      setAgrupacion(data)
      setMostrarResultado(true)
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (mostrarResultado && agrupacion) {
    return (
      <GruposResultado
        evento={evento}
        esquema={agrupacion}
        onVolverConfiguracion={() => setMostrarResultado(false)}
        onVolver={() => onVolver()}
        onRegenerar={() => {
          setGruposCache((prev) => {
            const next = { ...prev }
            delete next[agrupacion.id]
            return next
          })
          setMostrarResultado(false)
          setPasoActivo('configuracion')
        }}
        cache={gruposCache}
        setCache={setGruposCache}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVolver(huboCambios)}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="h-5 w-px bg-border" />

          <div>
            <h3 className="text-base font-semibold text-foreground">
              {agrupacion ? agrupacion.nombre : 'Nueva agrupación'}
            </h3>
          </div>
        </div>

        {agrupacion && (
          <div className="flex items-center gap-3">
            <Badge
              variant={agrupacion.estado === 'generado' ? 'default' : 'outline'}
            >
              {agrupacion.estado === 'generado' ? 'Generada' : 'Borrador'}
            </Badge>

            {agrupacion.estado === 'generado' &&
              agrupacion.nuevosNoContemplados > 0 && (
                <Popover>
                  {/* ... */}
                </Popover>
              )}

            {agrupacion.estado === 'generado' && (
              <button
                type="button"
                onClick={() => setMostrarResultado(true)}
                className="flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline cursor-pointer"
              >
                <LayoutGrid className="h-3 w-3" />
                Ver grupos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Indicador de pasos */}
      <div className="flex w-full items-center">
        {PASOS.map((paso, index) => {
          const labels = {
            configuracion: 'Configuración',
            excluidos: 'Excluidos',
            preview: 'Vista previa',
            generar: 'Generar',
          }

          const esActivo = pasoActivo === paso
          const esPasado = PASOS.indexOf(pasoActivo) > index

          return (
            <div
              key={paso}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                    esActivo && 'bg-primary text-primary-foreground',
                    esPasado && 'bg-primary/15 text-primary',
                    !esActivo && !esPasado &&
                    'bg-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>

                <span
                  className={cn(
                    'hidden text-sm font-medium sm:inline',
                    esActivo && 'text-foreground',
                    esPasado && 'text-primary',
                    !esActivo && !esPasado && 'text-muted-foreground'
                  )}
                >
                  {labels[paso]}
                </span>
              </div>

              {index < PASOS.length - 1 && (
                <div
                  className={cn(
                    'mx-3 h-px flex-1',
                    index < PASOS.indexOf(pasoActivo)
                      ? 'bg-primary'
                      : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Título del paso - solo mobile */}
      <div className="flex justify-center py-3 sm:hidden mb-1">
        <h3 className="text-base font-semibold text-foreground">
          {{
            configuracion: 'Configuración',
            excluidos: 'Excluidos',
            preview: 'Vista previa',
            generar: 'Generar',
          }[pasoActivo]}
        </h3>
      </div>

      {/* Contenido del paso */}
      <div>
        {pasoActivo === 'configuracion' && (
          <PasoConfiguracion
            evento={evento}
            agrupacion={agrupacion}
            onCreada={handleCreada}
            onActualizada={handleActualizada}
            onSiguiente={() => setPasoActivo('excluidos')}
          />
        )}

        {pasoActivo === 'excluidos' && agrupacion && (
          <PasoExcluidos
            evento={evento}
            esquema={agrupacion}
            participantes={participantes}
            participantesCargando={participantesCargando}
            onSiguiente={() => setPasoActivo('preview')}
            onAnterior={() => setPasoActivo('configuracion')}
          />
        )}

        {pasoActivo === 'preview' && agrupacion && (
          <PasoPreview
            evento={evento}
            agrupacion={agrupacion}
            onSiguiente={() => setPasoActivo('generar')}
            onAnterior={() => setPasoActivo('excluidos')}
          />
        )}

        {pasoActivo === 'generar' && agrupacion && (
          <PasoGenerar
            evento={evento}
            esquema={agrupacion}
            onGenerado={handleGenerado}
            onAnterior={() => setPasoActivo('preview')}
          />
        )}

        {!agrupacion && pasoActivo !== 'configuracion' && (
          <div className="flex items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Primero completá la configuración de la agrupación.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}