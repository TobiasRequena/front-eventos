import { useState } from 'react'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { pagarTramoAdelantado } from '@/api/pagos.api'
import { getApiErrorMessage } from '@/api/httpClient'

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

export { TramoStepper }