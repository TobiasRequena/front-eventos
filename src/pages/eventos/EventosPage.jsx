import { useParams } from 'react-router-dom'
import { CalendarX2, Plus } from 'lucide-react'
import { useEventos } from '@/hooks/useEventos'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { FILTROS_EVENTO, filtrarEventosPorEstado } from '@/lib/eventos.helpers'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EventoCard } from '@/components/eventos/EventoCard'
import { EventosFilterToggle } from '@/components/eventos/EventosFilterToggle'

function EventosSkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border p-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

function EstadoVacio({ filtro }) {
  const mensajes = {
    borradores: 'Todavía no existe el concepto de borradores en esta versión.',
    activos: 'No tenés eventos activos en este momento.',
    finalizados: 'Todavía no tenés eventos finalizados.',
    todos: 'Todavía no creaste ningún evento.',
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
      <CalendarX2 className="mb-3 h-9 w-9 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">{mensajes[filtro]}</p>
    </div>
  )
}

function EstadoError({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-16 text-center">
      <p className="text-sm font-medium text-foreground">No pudimos cargar tus eventos</p>
      <p className="mt-1 text-sm text-muted-foreground">Revisá tu conexión e intentá de nuevo.</p>
      <Button variant="outline" className="mt-4" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  )
}

export default function EventosPage() {
  const { estado } = useParams()
  const filtro = FILTROS_EVENTO[estado] ? estado : 'todos'

  const { eventos, isLoading, isError, reintentar } = useEventos()

  useBreadcrumb([{ label: 'Eventos', to: '/eventos' }, { label: FILTROS_EVENTO[filtro].label }])

  const eventosFiltrados = filtrarEventosPorEstado(eventos, filtro)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Eventos</h1>
        <Button asChild>
          <a href="/eventos/nuevo">
            <Plus className="h-4 w-4" />
            Crear evento
          </a>
        </Button>
      </div>

      <EventosFilterToggle filtroActivo={filtro} />

      {isLoading && <EventosSkeletonGrid />}
      {isError && <EstadoError onRetry={reintentar} />}
      {!isLoading && !isError && eventosFiltrados.length === 0 && (
        <EstadoVacio filtro={filtro} />
      )}
      {!isLoading && !isError && eventosFiltrados.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventosFiltrados.map((evento) => (
            <EventoCard key={evento.id} evento={evento} />
          ))}
        </div>
      )}
    </div>
  )
}