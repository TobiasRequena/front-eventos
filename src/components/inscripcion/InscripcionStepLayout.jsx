import { CalendarRange, ImageOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Separator } from '@/components/ui/separator'

export function InscripcionStepLayout({ evento, titulo, children }) {
  const imagenUrl = evento?.imagen_url ?? evento?.imagenUrl

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={evento.nombre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
      </AspectRatio>

      <CardContent className="space-y-5 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {evento?.nombre}
          </h3>
          {evento?.fecha_inicio && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              {new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(evento.fecha_inicio))}
            </div>
          )}
          {evento?.descripcion && (
            <p className="mt-2 text-sm text-muted-foreground">{evento.descripcion}</p>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {titulo}
          </p>
          {children}
        </div>
      </CardContent>
    </Card>
  )
}