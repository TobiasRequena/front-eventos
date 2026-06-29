import { Link } from 'react-router-dom'
import { CalendarRange, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { esEventoActivo } from '@/lib/eventos.helpers'

function formatearFechaCorta(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(
    new Date(fechaIso)
  )
}

function EventoListItem({ evento }) {
  return (
    <Link
      to={`/eventos/${evento.id}`}
      className="flex items-center gap-3 rounded-md px-2 py-2 -mx-2 transition-colors hover:bg-accent"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
        <CalendarRange className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{evento.nombre}</p>
        <p className="text-xs text-muted-foreground">{formatearFechaCorta(evento.fecha_inicio)}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </Link>
  )
}

export function EventosActivosList({ eventos, className }) {
  const activos = eventos
    .filter(esEventoActivo)
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Eventos activos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {activos.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No tenés eventos activos.
          </p>
        )}
        {activos.slice(0, 5).map((evento) => (
          <EventoListItem key={evento.id} evento={evento} />
        ))}
        {activos.length > 0 && (
          <Button asChild variant="ghost" className="w-full justify-center text-sm">
            <Link to="/eventos">Ver todos</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}