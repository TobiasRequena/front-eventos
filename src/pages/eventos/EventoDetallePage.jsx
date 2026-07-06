import { useParams, useSearchParams } from 'react-router-dom'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useEvento } from '@/hooks/useEvento'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getEstadoEvento } from '@/lib/eventos.helpers'
import { TabResumen } from '@/components/eventos/detalle/TabResumen'
import { TabParticipantes } from '@/components/eventos/detalle/TabParticipantes'
import { TabAcreditacion } from '@/components/eventos/detalle/TabAcreditacion'

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'participantes', label: 'Participantes' },
  { value: 'acreditacion', label: 'Acreditación' },
]

function HeaderEvento({ evento }) {
  const imagenUrl = evento.imagen_url ?? evento.imagenUrl

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-xl bg-muted">
      {imagenUrl && (
        <img
          src={imagenUrl}
          alt={evento.nombre}
          className="h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {evento.codigo}
              </span>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm capitalize">
                {getEstadoEvento(evento)}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-white">{evento.nombre}</h1>
            <p className="mt-0.5 text-sm text-white/70">
              {new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(evento.fecha_inicio))}
              {' — '}
              {new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }).format(new Date(evento.fecha_fin))}
            </p>
          </div>
          <Button variant="outline" className="shrink-0 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white backdrop-blur-sm">
            Editar evento
          </Button>
        </div>
      </div>
    </div>
  )
}

function HeaderSkeleton() {
  return <Skeleton className="h-52 w-full rounded-xl" />
}

export default function EventoDetallePage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabActivo = searchParams.get('tab') ?? 'resumen'

  const { evento, isLoading, isError, reintentar } = useEvento(id)

  useBreadcrumb([
    { label: 'Eventos', to: '/eventos' },
    { label: isLoading ? '...' : (evento?.nombre ?? 'Detalle') },
  ])

  function handleCambiarTab(nuevoTab) {
    setSearchParams({ tab: nuevoTab })
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-foreground">No pudimos cargar el evento</p>
        <Button variant="outline" className="mt-4" onClick={reintentar}>
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {isLoading ? <HeaderSkeleton /> : <HeaderEvento evento={evento} />}

      <Tabs value={tabActivo} onValueChange={handleCambiarTab}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          {evento && <TabResumen evento={evento} />}
        </TabsContent>

        <TabsContent value="participantes" className="mt-6">
          {evento && <TabParticipantes evento={evento} />}
        </TabsContent>

        <TabsContent value="acreditacion" className="mt-6">
          {evento && <TabAcreditacion evento={evento} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}