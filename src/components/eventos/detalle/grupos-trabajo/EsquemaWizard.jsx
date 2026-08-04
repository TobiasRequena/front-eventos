import { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Settings, List, UserX, Eye, Zap, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { getEsquema } from '@/api/gruposTrabajo.api'
import { PasoConfiguracion } from './wizard/PasoConfiguracion'
import { PasoTandas } from './wizard/PasoTandas'
import { PasoExcluidos } from './wizard/PasoExcluidos'
import { PasoPreview } from './wizard/PasoPreview'
import { PasoGenerar } from './wizard/PasoGenerar'
import { GruposResultado } from './resultado/GruposResultado'
import { AlertTriangle } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const PASOS = [
  { id: 'configuracion', label: 'Configuración', icon: Settings },
  { id: 'tandas', label: 'Tandas', icon: List },
  { id: 'excluidos', label: 'Excluidos', icon: UserX },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'generar', label: 'Generar', icon: Zap },
]

function PasoHeader({ paso, activo, completado, habilitado, onClick }) {
  const Icon = paso.icon
  return (
    <button
      type="button"
      disabled={!habilitado}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full rounded-lg p-3 text-left transition-colors',
        activo && 'bg-primary/5 border border-primary/20',
        !activo && habilitado && 'hover:bg-accent/50',
        !habilitado && 'opacity-40 cursor-not-allowed',
      )}
    >
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
        completado && 'border-success bg-success text-white',
        activo && !completado && 'border-primary bg-primary/10 text-primary',
        !activo && !completado && 'border-border bg-background text-muted-foreground',
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={cn(
        'text-sm font-medium',
        activo ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {paso.label}
      </span>
    </button>
  )
}

export function EsquemaWizard({
  evento,
  esquemaId,
  participantes,
  participantesCargando,
  onVolver,
  gruposCache = {},
  setGruposCache = () => {},
}) {
  const [esquema, setEsquema] = useState(null)
  const [isLoading, setIsLoading] = useState(!!esquemaId)
  const [pasoActivo, setPasoActivo] = useState('configuracion')
  const [mostrarResultado, setMostrarResultado] = useState(false)
  const [huboCambios, setHuboCambios] = useState(false)

  useEffect(() => {
    if (!esquemaId) return
    setIsLoading(true)
    getEsquema(evento.id, esquemaId)
      .then((data) => {
        setEsquema(data)
        // Si ya está generado, mostrar resultado directamente
        if (data.estado === 'generado') {
          setMostrarResultado(true)
        }
      })
      .catch(() => toast.error('No pudimos cargar el esquema.'))
      .finally(() => setIsLoading(false))
  }, [esquemaId, evento.id])

  function pasoHabilitado(pasoId) {
    if (!esquema) return pasoId === 'configuracion'
    if (pasoId === 'configuracion') return true
    if (pasoId === 'tandas') return true
    if (pasoId === 'excluidos') return true
    if (pasoId === 'preview') return true
    if (pasoId === 'generar') return true
    return false
  }

  function handleEsquemaCreado(nuevoEsquema) {
    setEsquema(nuevoEsquema)
    setHuboCambios(true)
    setPasoActivo('tandas')
  }

  function handleEsquemaActualizado(esquemaActualizado) {
    setEsquema(esquemaActualizado)
    setHuboCambios(true)
  }

  function handleGenerado() {
    setHuboCambios(true)
    setGruposCache((prev) => {
      const next = { ...prev }
      delete next[esquema.id]
      return next
    })
    getEsquema(evento.id, esquema.id).then((data) => {
      setEsquema(data)
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

  // Vista de resultado
  if (mostrarResultado && esquema) {
    return (
      <GruposResultado
        evento={evento}
        esquema={esquema}
        onVolver={() => setMostrarResultado(false)}
        onRegenerar={() => {
          setGruposCache((prev) => {
            const next = { ...prev }
            delete next[esquema.id]
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => onVolver(huboCambios)} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {esquema ? esquema.nombre : 'Nuevo esquema'}
          </h3>
          {esquema && (
            <div className="flex items-center gap-2">
              <Badge variant={esquema.estado === 'generado' ? 'default' : 'outline'}>
                {esquema.estado === 'generado' ? 'Generado' : 'Borrador'}
              </Badge>

              {esquema.estado === 'generado' && esquema.nuevosNoContemplados > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 transition-colors"
                    >
                      <AlertTriangle className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 text-sm" side="right">
                    <p className="font-medium text-foreground">Participantes no contemplados</p>
                    <p className="mt-1 text-muted-foreground">
                      {esquema.nuevosNoContemplados} participante{esquema.nuevosNoContemplados !== 1 ? 's' : ''} nuevo{esquema.nuevosNoContemplados !== 1 ? 's' : ''} no {esquema.nuevosNoContemplados !== 1 ? 'están contemplados' : 'está contemplado'} en este esquema. Regenerá para incluirlos.
                    </p>
                  </PopoverContent>
                </Popover>
              )}

              {esquema.estado === 'generado' && (
                <button
                  type="button"
                  onClick={() => setMostrarResultado(true)}
                  className="text-xs text-primary underline-offset-4 hover:underline flex items-center gap-1"
                >
                  <LayoutGrid className="h-3 w-3" />
                  Ver grupos generados
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Sidebar de pasos */}
        <div className="space-y-1">
          {PASOS.map((paso) => (
            <PasoHeader
              key={paso.id}
              paso={paso}
              activo={pasoActivo === paso.id}
              completado={false}
              habilitado={pasoHabilitado(paso.id)}
              onClick={() => setPasoActivo(paso.id)}
            />
          ))}
        </div>

        {/* Contenido del paso */}
        <div>
          {pasoActivo === 'configuracion' && (
            <PasoConfiguracion
              evento={evento}
              esquema={esquema}
              onCreado={handleEsquemaCreado}
              onActualizado={handleEsquemaActualizado}
              onSiguiente={() => setPasoActivo('tandas')}
            />
          )}
          {pasoActivo === 'tandas' && esquema && (
            <PasoTandas
              evento={evento}
              esquema={esquema}
              onActualizado={handleEsquemaActualizado}
              onSiguiente={() => setPasoActivo('excluidos')}
              onAnterior={() => setPasoActivo('configuracion')}
            />
          )}
          {pasoActivo === 'excluidos' && esquema && (
            <PasoExcluidos
              evento={evento}
              esquema={esquema}
              participantes={participantes}
              participantesCargando={participantesCargando}
              onSiguiente={() => setPasoActivo('preview')}
              onAnterior={() => setPasoActivo('tandas')}
            />
          )}
          {pasoActivo === 'preview' && esquema && (
            <PasoPreview
              evento={evento}
              esquema={esquema}
              onSiguiente={() => setPasoActivo('generar')}
              onAnterior={() => setPasoActivo('excluidos')}
            />
          )}
          {pasoActivo === 'generar' && esquema && (
            <PasoGenerar
              evento={evento}
              esquema={esquema}
              onGenerado={handleGenerado}
              onAnterior={() => setPasoActivo('preview')}
            />
          )}
          {!esquema && pasoActivo !== 'configuracion' && (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Primero completá la configuración del esquema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}