import { Plus, CalendarRange, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEventos } from '@/hooks/useEventos'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { getProximoEvento, getTotalInscriptosActivos, esEventoActivo } from '@/lib/eventos.helpers'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ProximoEventoCard } from '@/components/dashboard/ProximoEventoCard'
import { TendenciaInscripcionesChart } from '@/components/dashboard/TendenciaInscripcionesChart'
import { EventosActivosList } from '@/components/dashboard/EventosActivosList'

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
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

export default function DashboardPage() {
  const { usuario } = useAuth()
  const { eventos, isLoading, isError, reintentar } = useEventos()
  useBreadcrumb([{ label: 'Dashboard' }])

  if (isLoading) return <DashboardSkeleton />
  if (isError) return <EstadoError onRetry={reintentar} />

  const proximoEvento = getProximoEvento(eventos)
  const totalEventosActivos = eventos.filter(esEventoActivo).length
  const totalInscriptos = getTotalInscriptosActivos(eventos)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hola, {usuario?.nombre}
        </h1>
        <Button asChild>
          <a href="/eventos/nuevo">
            <Plus className="h-4 w-4" />
            Crear evento
          </a>
        </Button>
      </div>

      <ProximoEventoCard evento={proximoEvento} />

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icon={CalendarRange} label="Eventos activos" value={totalEventosActivos} />
        <KpiCard icon={Users} label="Inscriptos (eventos activos)" value={totalInscriptos} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TendenciaInscripcionesChart className="lg:col-span-2" />
        <EventosActivosList eventos={eventos} />
      </div>
    </div>
  )
}