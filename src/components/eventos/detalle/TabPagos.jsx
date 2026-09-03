import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Clock, Mail, ExternalLink, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  getTramos,
  reenviarMailPago,
  pagarTramoAdelantado,
  getHistorialEvento
} from '@/api/pagos.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { io } from 'socket.io-client'

function EstadoPagoCard({ pagoPlataforma, eventoId }) {
  const [reenviando, setReenviando] = useState(false)

  async function handleReenviar() {
    setReenviando(true)
    try {
      const data = await reenviarMailPago(eventoId)
      toast.success(`Mail reenviado. Monto: $${parseFloat(data.monto).toLocaleString('es-AR')}`)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) toast.error('No hay pagos pendientes para este evento.')
      else toast.error(getApiErrorMessage(err, 'No pudimos reenviar el mail.'))
    } finally {
      setReenviando(false)
    }
  }

  if (!pagoPlataforma) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Todo al día</p>
            <p className="text-xs text-muted-foreground">
              No hay pagos pendientes con la plataforma.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-destructive/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <Clock className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Pago pendiente</p>
            <p className="text-xs text-muted-foreground">
              Regularizá el pago para evitar interrupciones en la acreditación.
            </p>
          </div>
          <Badge variant="destructive">
            ${parseFloat(pagoPlataforma.monto).toLocaleString('es-AR')}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleReenviar}
          disabled={reenviando}
        >
          <Mail className="h-4 w-4" />
          {reenviando ? 'Enviando...' : 'Reenviar link de pago'}
        </Button>
      </CardContent>
    </Card>
  )
}

function TramoStepper({ tramos, participantesFacturados, eventoId }) {
  const [tramoSeleccionado, setTramoSeleccionado] = useState(null)
  const [generando, setGenerando] = useState(false)

  const tramoActualIndex = tramos.reduce((acc, t, i) =>
    participantesFacturados >= t.participantes_desde ? i : acc, -1)

  const tramoActual = tramos[tramoActualIndex]
  const tramosFuturos = tramos.slice(tramoActualIndex + 1)

  async function handlePagar() {
    if (!tramoSeleccionado) return
    setGenerando(true)
    try {
      const data = await pagarTramoAdelantado(eventoId, tramoSeleccionado.participantes_desde)
      toast.success(`Link generado. Monto: $${parseFloat(data.monto).toLocaleString('es-AR')}`)
      window.open(data.linkPago, '_blank')
      setTramoSeleccionado(null)
    } catch (err) {
      const status = err?.response?.status
      if (status === 400) toast.error(err?.response?.data?.error?.message ?? 'Tramo inválido.')
      else toast.error(getApiErrorMessage(err, 'No pudimos generar el link de pago.'))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      {/* Desktop — stepper horizontal */}
      <div className="hidden md:block">
        <div className="flex items-start">
          {tramos.map((tramo, index) => {
            const esPasado = index < tramoActualIndex
            const esActual = index === tramoActualIndex
            const esFuturo = index > tramoActualIndex
            const esClickeable = esFuturo

            return (
              <div key={tramo.id} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 gap-2">
                  <button
                    type="button"
                    disabled={!esClickeable}
                    onClick={() => esClickeable && setTramoSeleccionado(tramo)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors shrink-0',
                      esPasado && 'border-green-600 bg-green-600 text-white cursor-default',
                      esActual && 'border-primary bg-primary text-primary-foreground cursor-default ring-2 ring-primary/30',
                      esFuturo && 'border-border bg-background text-muted-foreground hover:border-primary hover:text-primary cursor-pointer',
                    )}
                  >
                    {tramo.participantes_desde >= 1000
                      ? `${tramo.participantes_desde / 1000}k`
                      : tramo.participantes_desde}
                  </button>
                  <div className="text-center">
                    <p className={cn(
                      'text-xs font-medium',
                      esActual ? 'text-primary' : esPasado ? 'text-success' : 'text-muted-foreground'
                    )}>
                      ${parseFloat(tramo.precio_por_participante).toLocaleString('es-AR')}
                    </p>
                    {esActual && (
                      <p className="text-xs text-muted-foreground">Actual</p>
                    )}
                  </div>
                </div>
                {index < tramos.length - 1 && (
                  <div className="flex items-center mt-4 flex-1 min-w-2 max-w-8">
                    <div className={cn(
                      'h-0.5 w-full',
                      index < tramoActualIndex ? 'bg-success' :
                        index === tramoActualIndex ? 'bg-primary/40' : 'bg-border'
                    )} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {tramosFuturos.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Hacé click en un tramo futuro para pagarlo de forma adelantada.
          </p>
        )}
      </div>

      {/* Mobile — tramo actual + lista de futuros */}
      <div className="md:hidden space-y-3">
        {tramoActual ? (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">Tramo actual</p>
            <p className="text-sm font-semibold text-foreground">
              {tramoActual.participantes_desde.toLocaleString('es-AR')}+ participantes
            </p>
            <p className="text-sm text-primary font-medium">
              ${parseFloat(tramoActual.precio_por_participante).toLocaleString('es-AR')} / participante
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Todavía no alcanzaste ningún tramo.
          </p>
        )}

        {tramosFuturos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Tramos siguientes:</p>
            {tramosFuturos.map((tramo) => (
              <button
                key={tramo.id}
                type="button"
                onClick={() => setTramoSeleccionado(tramo)}
                className="flex w-full items-center justify-between rounded-md border border-border p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {tramo.participantes_desde.toLocaleString('es-AR')}+ participantes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${parseFloat(tramo.precio_por_participante).toLocaleString('es-AR')} / participante
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!tramoSeleccionado} onOpenChange={(v) => !v && setTramoSeleccionado(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Pagar tramo adelantado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-sm text-muted-foreground">
            <p>
              Vas a pagar el tramo de{' '}
              <span className="font-medium text-foreground">
                {tramoSeleccionado?.participantes_desde.toLocaleString('es-AR')}+ participantes
              </span>{' '}
              a{' '}
              <span className="font-medium text-foreground">
                ${parseFloat(tramoSeleccionado?.precio_por_participante ?? 0).toLocaleString('es-AR')} por participante
              </span>.
            </p>
            <p>Se abrirá el link de pago de GalioPay en una nueva pestaña.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTramoSeleccionado(null)} disabled={generando}>
              Cancelar
            </Button>
            <Button onClick={handlePagar} disabled={generando} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              {generando ? 'Generando...' : 'Ir al pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function HistorialCard({ pagos }) {
  if (!pagos?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de pagos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="font-medium text-foreground">Fecha</TableHead>
              <TableHead className="font-medium text-foreground">Monto</TableHead>
              <TableHead className="font-medium text-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((pago) => (
              <TableRow key={pago.id} className="hover:bg-muted/50">
                <TableCell className="text-sm">
                  {new Intl.DateTimeFormat('es-AR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }).format(new Date(pago.creadoEn))}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  ${parseFloat(pago.monto).toLocaleString('es-AR')}
                </TableCell>
                <TableCell>
                  <Badge variant={
                    pago.estado === 'aprobado' ? 'default' :
                      pago.estado === 'cancelado' ? 'destructive' : 'outline'
                  }>
                    {pago.estado.charAt(0).toUpperCase() + pago.estado.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export function TabPagos({ evento, onPagoConfirmado }) {
  const [historial, setHistorial] = useState(null)
  const [tramos, setTramos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'

  useEffect(() => {
    if (!evento?.id) return
    Promise.all([
      getTramos(),
      getHistorialEvento(evento.id),
    ])
      .then(([tramosData, historialData]) => {
        setTramos(tramosData)
        setHistorial(historialData)
      })
      .finally(() => setIsLoading(false))
  }, [evento?.id])

  useEffect(() => {
    if (!evento?.id) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.emit('unirse_evento', evento.id)

    socket.on('pago:actualizado', (data) => {
      if (data.estado === 'aprobado') {
        getHistorialEvento(evento.id).then(setHistorial)
        onPagoConfirmado?.()
        toast.success(`Pago confirmado. $${parseFloat(data.monto).toLocaleString('es-AR')} acreditado.`)
      }
    })

    return () => socket.disconnect()
  }, [evento?.id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <EstadoPagoCard
        pagoPlataforma={evento?.pagoPlataforma}
        eventoId={evento?.id}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tramos de precio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            La plataforma cobra por participante según el tramo alcanzado. Al cruzar un nuevo tramo,
            se genera automáticamente un cargo por los participantes adicionales.
            Podés pagar un tramo superior de forma adelantada haciendo click en él.
          </p>
          <TramoStepper
            tramos={tramos}
            participantesFacturados={historial?.participantesFacturados ?? 0}
            eventoId={evento?.id}
          />
        </CardContent>
      </Card>

      <HistorialCard pagos={historial?.pagos} />
    </div>
  )
} 