import { useState } from 'react'
import { Zap, CheckCircle2, AlertCircle, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { generarEsquema } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

export function PasoGenerar({ evento, esquema, onGenerado, onAnterior }) {
  const [generando, setGenerando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState(null)
  const yaGenerado = esquema.estado === 'generado'

  async function handleGenerar() {
    setGenerando(true)
    setError(null)
    try {
      const data = await generarEsquema(evento.id, esquema.id)
      setResultado(data)
      toast.success(`¡Grupos generados! ${data.gruposGenerados} grupos creados.`)
    } catch (err) {
      const status = err?.response?.status
      if (status === 422) {
        setError(err?.response?.data?.error?.message ?? 'No se pueden generar los grupos.')
      } else if (status === 402) {
        setError(`Pago pendiente: $${parseFloat(err?.response?.data?.error?.monto ?? 0).toLocaleString('es-AR')}. Regularizá el pago antes de generar.`)
      } else {
        setError(getApiErrorMessage(err, 'No pudimos generar los grupos.'))
      }
      toast.error('No pudimos generar los grupos.')
    } finally {
      setGenerando(false)
    }
  }

  const mostrarExito = (resultado || yaGenerado) && !generando

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="space-y-5 pt-6">
          {generando ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted animate-pulse">
                <Zap className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Generando grupos...</p>
                <p className="mt-1 text-xs text-muted-foreground">Esto puede tardar unos segundos.</p>
              </div>
            </div>
          ) : mostrarExito ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {resultado ? '¡Grupos generados exitosamente!' : 'Este esquema ya fue generado.'}
                </p>
                {resultado && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{resultado.gruposGenerados}</span> grupos creados
                    {resultado.pendientes > 0 && (
                      <> · <span className="font-medium text-foreground">{resultado.pendientes}</span> participantes pendientes</>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerar} disabled={generando} className="gap-2">
                  <Zap className="h-4 w-4" />
                  Regenerar
                </Button>
                <Button onClick={onGenerado} className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Ver grupos
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Zap className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Listo para generar</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Se van a crear los grupos según la configuración definida.
                </p>
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-left w-full">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              <Button onClick={handleGenerar} disabled={generando} className="gap-2">
                <Zap className="h-4 w-4" />
                Generar grupos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onAnterior}>
          Atrás
        </Button>
      </div>
    </div>
  )
}