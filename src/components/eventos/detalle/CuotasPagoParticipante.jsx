import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArchivoButton } from '@/components/ComprobanteButton'
import { getCuotasParticipante, patchEstadoCuota } from '@/api/participantes.api'
import { formatoPesos, formatoVencimiento } from '@/lib/costoEvento'

const ESTADO_CUOTA = {
  aprobado: { label: 'Pagada', variant: 'default' },
  en_revision: { label: 'Comprobante cargado', variant: 'outline' },
  rechazado: { label: 'Rechazada', variant: 'destructive' },
  pendiente: { label: 'Pendiente', variant: 'secondary' },
}

/**
 * Cuotas de un participante, cada una con su comprobante y Aprobar / Rechazar.
 * Quien pagó el total tiene una sola cuota.
 */
// El spinner ocupa el lugar del texto: el botón no cambia de ancho y la fila no se rompe
function TextoConSpinner({ cargando, children }) {
  return (
    <>
      <span className={cn(cargando && 'invisible')}>{children}</span>
      {cargando && <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin" />}
    </>
  )
}

export function CuotasPagoParticipante({ participanteId, onActualizar }) {
  const [cuotas, setCuotas] = useState(null)
  const [revisando, setRevisando] = useState(null) // { id, estado } de la acción en curso

  // El padre monta con key={participanteId}: cambiar de participante arranca de cero
  useEffect(() => {
    getCuotasParticipante(participanteId)
      .then(setCuotas)
      .catch(() => setCuotas([]))
  }, [participanteId])

  async function revisar(cuota, estado) {
    setRevisando({ id: cuota.id, estado })
    try {
      await patchEstadoCuota(cuota.id, estado)
      toast.success(estado === 'aprobado' ? 'Cuota aprobada.' : 'Cuota rechazada.')
      setCuotas(await getCuotasParticipante(participanteId))
      onActualizar?.()
    } catch {
      toast.error('No pudimos actualizar la cuota.')
    } finally {
      setRevisando(null)
    }
  }

  if (cuotas === null) return <Skeleton className="h-16 w-full" />
  if (cuotas.length === 0) {
    return <p className="text-sm text-muted-foreground">Este participante no tiene pagos registrados.</p>
  }

  const saldo = cuotas.filter((c) => c.estado !== 'aprobado').reduce((s, c) => s + Number(c.monto), 0)
  const total = cuotas.length

  return (
    <div className="space-y-2">
      {total > 1 && (
        <p className="text-xs text-muted-foreground">
          {cuotas.filter((c) => c.estado === 'aprobado').length} de {total} cuotas pagadas
          {saldo > 0 && <> · Saldo pendiente <span className="font-medium text-foreground">{formatoPesos(saldo)}</span></>}
        </p>
      )}
      {cuotas.map((cuota) => {
        const estado = ESTADO_CUOTA[cuota.estado] ?? ESTADO_CUOTA.pendiente
        const vencida = cuota.estado !== 'aprobado' && cuota.vencimiento && new Date(cuota.vencimiento) < new Date()
        const enCurso = revisando?.id === cuota.id
        return (
          <div key={cuota.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {total > 1 ? `Cuota ${cuota.numero}/${total}` : 'Pago total'} — {formatoPesos(cuota.monto)}
                </p>
                {cuota.vencimiento && (
                  <p className={cn('text-xs', vencida ? 'text-destructive' : 'text-muted-foreground')}>
                    {vencida ? 'Venció' : 'Vence'} el {formatoVencimiento(cuota.vencimiento)}
                  </p>
                )}
              </div>
              <Badge variant={estado.variant} className="shrink-0">{estado.label}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate">
                {cuota.comprobante?.url ? (
                  <ArchivoButton url={cuota.comprobante.url} label="Ver comprobante" titulo="Comprobante de pago" />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin comprobante</span>
                )}
              </div>
              {cuota.estado !== 'aprobado' && (
                <div className="flex shrink-0 gap-2">
                  {cuota.estado === 'en_revision' && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="relative text-destructive hover:text-destructive"
                      disabled={enCurso}
                      onClick={() => revisar(cuota, 'rechazado')}
                    >
                      <TextoConSpinner cargando={enCurso && revisando.estado === 'rechazado'}>Rechazar</TextoConSpinner>
                    </Button>
                  )}
                  <Button type="button" size="sm" className="relative" disabled={enCurso} onClick={() => revisar(cuota, 'aprobado')}>
                    <TextoConSpinner cargando={enCurso && revisando.estado === 'aprobado'}>Aprobar</TextoConSpinner>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
