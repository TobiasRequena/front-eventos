import { Link } from 'react-router-dom'
import { CalendarRange, ArrowRight, ImageOff } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatearFecha(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fechaIso))
}

export function ProximoEventoCard({ evento, className }) {
  if (!evento) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <CalendarRange className="h-8 w-8 text-muted-foreground/50" />
          <CardTitle className="text-base">No tenés eventos activos</CardTitle>
          <p className="text-sm text-muted-foreground">
            Creá tu primer evento para empezar a recibir inscripciones.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('gap-0 overflow-hidden p-0 sm:grid sm:grid-cols-[280px_1fr]', className)}>
      <AspectRatio ratio={16 / 9} className="bg-muted sm:h-full sm:[aspect-ratio:auto]">
        {evento.imagenUrl ? (
          <img
            src={evento.imagenUrl}
            alt={evento.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
      </AspectRatio>

      <div className="flex flex-col justify-between">
        <CardHeader className="pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Próximo evento
          </p>
          <CardTitle className="text-xl">{evento.nombre}</CardTitle>
          <CardContent className="flex items-center gap-2 px-0 pt-2 pb-4 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            {formatearFecha(evento.fecha_inicio)}
          </CardContent>
        </CardHeader>

        <CardFooter>
          <Button asChild className="w-fit">
            <Link to={`/eventos/${evento.id}`}>
              Ver detalle
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  )
}