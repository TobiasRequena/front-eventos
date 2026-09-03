import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Paperclip, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getComunicaciones } from '@/api/comunicaciones.api'
import { NuevaComunicacionDrawer } from '@/components/eventos/detalle/NuevaComunicacionDrawer'
import { RefreshCw, Loader2 } from 'lucide-react'

const ESTADO_CONFIG = {
  enviado: { label: 'Enviado', variant: 'default', icon: CheckCircle2 },
  enviando: { label: 'Enviando...', variant: 'outline', icon: Clock },
  error: { label: 'Error', variant: 'destructive', icon: AlertCircle },
}

function ComunicacionCard({ comunicacion }) {
  const estado = ESTADO_CONFIG[comunicacion.estado] ?? ESTADO_CONFIG.enviado
  const Icon = estado.icon

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{comunicacion.asunto}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Intl.DateTimeFormat('es-AR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              }).format(new Date(comunicacion.creado_en))}
            </p>
          </div>
          <Badge variant={estado.variant} className="shrink-0 gap-1">
            <Icon className="h-3 w-3" />
            {estado.label}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">{comunicacion.mensaje}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {comunicacion.total_enviados.toLocaleString('es-AR')} {comunicacion.destinatarios === 'inscriptos' ? 'inscriptos' : 'acreditados'}
          </span>
          {comunicacion.adjuntos?.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5" />
              {comunicacion.adjuntos.length} adjunto{comunicacion.adjuntos.length !== 1 ? 's' : ''}
            </span>
          )}
          {comunicacion.filtros?.length > 0 && (
            <span className="flex items-center gap-1">
              Filtrado ({comunicacion.filtros.length} campo{comunicacion.filtros.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ComunicacionesTab({ evento }) {
  const [comunicaciones, setComunicaciones] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  async function cargar() {
    setIsLoading(true)
    try {
      const data = await getComunicaciones(evento.id)
      setComunicaciones(data)
    } catch {
      toast.error('No pudimos cargar los mensajes.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [evento.id])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {comunicaciones.length} mensaje{comunicaciones.length !== 1 ? 's' : ''} enviado{comunicaciones.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={cargar}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="sm"
            className="h-8 gap-2"
            onClick={() => setDrawerAbierto(true)}
          >
            <Plus className="h-4 w-4" />
            Nuevo mensaje
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : comunicaciones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">Sin mensajes</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Todavía no se enviaron mensajes para este evento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comunicaciones.map((c) => (
            <ComunicacionCard key={c.id} comunicacion={c} />
          ))}
        </div>
      )}

      <NuevaComunicacionDrawer
        open={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        evento={evento}
        onEnviado={cargar}
      />
    </div>
  )
}