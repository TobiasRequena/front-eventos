import { CalendarDays, Users, ImageOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { getEstadoEvento } from '@/lib/eventos.helpers'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

const ESTADO_LABELS = {
  activo: { label: 'Activo', className: 'bg-success/15 text-success' },
  finalizado: { label: 'Finalizado', className: 'bg-secondary text-secondary-foreground' },
}

function formatearRangoFechas(inicio, fin) {
  const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' })
  const fechaInicio = formatter.format(new Date(inicio))
  const fechaFin = formatter.format(new Date(fin))
  return fechaInicio === fechaFin ? fechaInicio : `${fechaInicio} – ${fechaFin}`
}

export function EventoCard({ evento }) {
  const estado = ESTADO_LABELS[getEstadoEvento(evento)]
  const imagenUrl = evento.imagenUrl ?? evento.imagen_url

  return (
    <Link to={`/eventos/${evento.id}/detalle`} className="block">
      <Card className="gap-0 overflow-hidden p-0 transition-shadow hover:shadow-md">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {imagenUrl ? (
            <img src={imagenUrl} alt={evento.nombre} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </AspectRatio>

        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-snug">{evento.nombre}</CardTitle>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                estado.className
              )}
            >
              {estado.label}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatearRangoFechas(evento.fecha_inicio, evento.fecha_fin)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {evento.cantidadInscriptos} inscriptos
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {evento.codigo}
            </span>
            {evento.tiene_grupos && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Grupos
              </span>
            )}
            {evento.tiene_talleres && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Talleres
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link >
  )
}