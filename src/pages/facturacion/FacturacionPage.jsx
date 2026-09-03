import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, ArrowRight, ChevronDown } from 'lucide-react'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { getTramos, getEventosActivos, getHistorialOrganizacion } from '@/api/pagos.api'
import { TramoStepper } from '@/components/facturacion/TramoStepper'
import { cn } from '@/lib/utils'
import { HelpTooltip } from '@/components/ui/help-tooltip'

const ESTADO_PAGO_CONFIG = {
  aprobado: { label: 'Aprobado', variant: 'default' },
  pendiente: { label: 'Pendiente', variant: 'outline' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
  sin_cargo: { label: 'Sin cargo', variant: 'secondary' },
}

function EventoActivoCard({ evento, tramos }) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const estadoPago = ESTADO_PAGO_CONFIG[evento.estado_pago] ?? ESTADO_PAGO_CONFIG.sin_cargo

  return (
    <Card>
      <Collapsible open={abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-start justify-between gap-3 p-5 text-left">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{evento.nombre}</p>
                <Badge variant={estadoPago.variant} className="shrink-0">{estadoPago.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(evento.fecha_inicio))}
                {' — '}
                {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(evento.fecha_fin))}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {evento.participantes_inscriptos.toLocaleString('es-AR')} inscriptos
                {' · '}
                {evento.participantes_facturados.toLocaleString('es-AR')} facturados
                {evento.monto_ultimo_pago && ` · $${parseFloat(evento.monto_ultimo_pago).toLocaleString('es-AR')} último pago`}
              </p>
            </div>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform mt-0.5', abierto && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t border-border px-5 pb-5 pt-4">
            <TramoStepper
              tramos={tramos}
              participantesFacturados={evento.participantes_facturados}
              eventoId={evento.id}
              tramoPendienteId={evento.tramo_pendiente_id}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => navigate(`/eventos/${evento.id}/detalle`)}
            >
              Ir al evento
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function HistorialEventoCard({ evento }) {
  const estadoPago = ESTADO_PAGO_CONFIG[evento.estado_final] ?? ESTADO_PAGO_CONFIG.sin_cargo

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{evento.nombre}</p>
            <p className="text-xs text-muted-foreground">
              Finalizado el{' '}
              {new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(evento.fecha_fin))}
            </p>
          </div>
          <Badge variant={estadoPago.variant} className="shrink-0">{estadoPago.label}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Participantes facturados</span>
          <span className="font-medium text-foreground">{evento.participantes_facturados.toLocaleString('es-AR')}</span>
        </div>
        {evento.tramo_alcanzado && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tramo alcanzado</span>
            <span className="font-medium text-foreground">
              {evento.tramo_alcanzado.participantes_desde?.toLocaleString('es-AR') ?? '—'}
              {evento.tramo_alcanzado.participantes_hasta
                ? ` — ${evento.tramo_alcanzado.participantes_hasta.toLocaleString('es-AR')} participantes`
                : '+ participantes'
              }
              {evento.tramo_alcanzado.monto_fijo
                ? ` · ${parseFloat(evento.tramo_alcanzado.monto_fijo) === 0 ? 'Gratis' : `$${parseFloat(evento.tramo_alcanzado.monto_fijo).toLocaleString('es-AR')}`}`
                : ''
              }
            </span>
          </div>
        )}
        {evento.monto_total && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total pagado</span>
            <span className="font-semibold text-foreground">
              ${parseFloat(evento.monto_total).toLocaleString('es-AR')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function FacturacionPage() {
  useBreadcrumb([{ label: 'Facturación' }])

  const [tramos, setTramos] = useState([])
  const [eventosActivos, setEventosActivos] = useState([])
  const [historial, setHistorial] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTramos(),
      getEventosActivos(),
      getHistorialOrganizacion(),
    ])
      .then(([tramosData, activosData, historialData]) => {
        setTramos(tramosData)
        setEventosActivos(activosData)
        setHistorial(historialData)
      })
      .catch(() => toast.error('No pudimos cargar la información de facturación.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Facturación
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          La plataforma cobra un monto fijo por tramo de inscriptos. En la tercer columna podrás visualizar cuanto puede costar por participante. La suma se genera de forma automática y en el caso de no abonar se bloquearán determinadas funciones. Si tenés un estimativo de participantes, podés pagar por adelantado pero no se realizan devoluciones en el caso de no llegar a la cantidad de inscriptos esperada.
          Ejemplo: con el tramo 501-2000, abonas $440.000. Si se inscriben 550 personas, el costo por participante será de $800 y si de inscriben 1200 $366 por cada uno de ellos.
        </p>
      </div>

      <Tabs defaultValue="activos">
        <TabsList>
          <TabsTrigger value="activos">
            Eventos activos
            {eventosActivos.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                {eventosActivos.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-4 space-y-4">
          {eventosActivos.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin eventos activos</p>
                  <p className="text-xs text-muted-foreground">
                    No tenés eventos en curso con facturación pendiente.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            eventosActivos.map((evento) => (
              <EventoActivoCard key={evento.id} evento={evento} tramos={tramos} />
            ))
          )}
        </TabsContent>

        <TabsContent value="historial" className="mt-4 space-y-4">
          {historial.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay eventos finalizados aún.
            </p>
          ) : (
            historial.map((evento) => (
              <HistorialEventoCard key={evento.id} evento={evento} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}