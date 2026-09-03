import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle2, ArrowRight, Circle, Mail, Clock, Send } from 'lucide-react'
import { pagarTramoAdelantado } from '@/api/pagos.api'
import { getApiErrorMessage } from '@/api/httpClient'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { reenviarMailPago } from '@/api/pagos.api'

function formatearMonto(monto) {
  const num = parseFloat(monto)
  if (num === 0) return 'Gratis'
  return `$${num.toLocaleString('es-AR')}`
}

function TramoStepper({ tramos, participantesFacturados, eventoId, tramoPendienteId }) {
  const [tramoSeleccionado, setTramoSeleccionado] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [reenviando, setReenviando] = useState(false)

  const tramoActualIndex = tramos.reduce((acc, t, i) =>
    participantesFacturados >= t.participantes_desde ? i : acc, -1)

  async function handleReenviar() {
    setReenviando(true)
    try {
      await reenviarMailPago(eventoId)
      toast.success('Mail reenviado correctamente.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos reenviar el mail.'))
    } finally {
      setReenviando(false)
    }
  }

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
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="font-medium text-foreground">Tramo</TableHead>
              <TableHead className="font-medium text-foreground">Monto fijo</TableHead>
              <TableHead className="font-medium text-foreground">Por participante</TableHead>
              <TableHead className="font-medium text-foreground">Estado</TableHead>
              <TableHead className="font-medium text-foreground text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tramos.map((tramo, index) => {
              const esPasado = index < tramoActualIndex
              const esActual = index === tramoActualIndex
              const esPendiente = tramo.id === tramoPendienteId
              const esFuturo = index > tramoActualIndex && !esPendiente
              const esGratis = parseFloat(tramo.monto_fijo) === 0

              return (
                <TableRow
                  key={tramo.id}
                  className={esActual ? 'bg-accent hover:bg-accent' : 'hover:bg-muted/50'}
                >
                  <TableCell className="text-sm text-foreground">
                    {tramo.participantes_desde.toLocaleString('es-AR')} — {tramo.participantes_hasta?.toLocaleString('es-AR') ?? '∞'}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground">
                    {formatearMonto(tramo.monto_fijo)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {parseFloat(tramo.precio_por_participante_desde) === 0
                      ? '—'
                      : `$${Math.round(parseFloat(tramo.precio_por_participante_desde)).toLocaleString('es-AR')} — $${Math.round(parseFloat(tramo.precio_por_participante_hasta)).toLocaleString('es-AR')}`
                    }
                  </TableCell>
                  <TableCell>
                    {esPasado && (
                      <Badge variant="default" className="gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Pagado
                      </Badge>
                    )}
                    {esActual && (
                      <Badge variant="outline" className="gap-1 text-xs border-primary text-primary">
                        <ArrowRight className="h-3 w-3" /> Actual
                      </Badge>
                    )}
                    {esPendiente && (
                      <Badge variant="outline" className="gap-1 text-xs border-orange-500 text-orange-500">
                        <Clock className="h-3 w-3" /> Pendiente
                      </Badge>
                    )}
                    {esFuturo && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Circle className="h-3 w-3" /> Próximo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {esPendiente && (
                      <button
                        type="button"
                        onClick={handleReenviar}
                        disabled={reenviando}
                        className="flex items-center gap-1.5 text-xs text-orange-500 underline-offset-4 hover:underline cursor-pointer ml-auto"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {reenviando ? 'Reenviando...' : 'Reenviar link'}
                      </button>
                    )}
                    {esFuturo && !esGratis && (
                      <button
                        type="button"
                        onClick={() => setTramoSeleccionado(tramo)}
                        className="flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline cursor-pointer ml-auto"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Pagar adelantado
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
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
                {tramoSeleccionado?.participantes_desde.toLocaleString('es-AR')}
                {' — '}
                {tramoSeleccionado?.participantes_hasta?.toLocaleString('es-AR') ?? '∞'}
                {' participantes'}
              </span>{' '}
              por un total de{' '}
              <span className="font-medium text-foreground">
                {tramoSeleccionado && formatearMonto(tramoSeleccionado.monto_fijo)}
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

export { TramoStepper }