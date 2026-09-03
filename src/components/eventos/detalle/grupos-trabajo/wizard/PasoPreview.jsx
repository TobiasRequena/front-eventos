import { useState, useEffect } from 'react'
import { Users, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPreview } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

export function PasoPreview({ evento, agrupacion, onSiguiente, onAnterior }) {
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cargado, setCargado] = useState(false)

  async function cargarPreview() {
    setIsLoading(true)
    try {
      const data = await getPreview(evento.id, agrupacion.id)
      setPreview(data)
      setCargado(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos calcular el preview.'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarPreview()
  }, [])

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Vista previa de generación</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarPreview}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {cargado ? 'Recalcular' : 'Calcular'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!cargado && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Calculá la vista previa para ver cuántos grupos se generarían.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-2 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          )}

          {cargado && preview && !isLoading && (
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{preview.totalElegibles}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Elegibles</p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{preview.grupos.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Grupos</p>
                </div>
                <div className="rounded-lg border border-border p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{preview.pendientesEstimados}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>

              {/* Aviso nombres insuficientes */}
              {!preview.nombresAlcanzan && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Tu lista tiene <span className="font-medium">{preview.nombresDisponibles}</span> nombres pero se generarían <span className="font-medium">{preview.gruposNecesarios}</span> grupos. Agregá más nombres o cambiá la acción cuando se agotan.
                  </p>
                </div>
              )}

              {/* Lista de grupos */}
              {preview.grupos.length > 0 && (
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-3 py-2 text-left font-medium text-foreground">Grupo</th>
                        <th className="px-3 py-2 text-center font-medium text-foreground">Integrantes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.grupos.map((grupo, i) => (
                        <tr key={i} className="hover:bg-muted/50">
                          <td className="px-3 py-2.5 font-medium text-foreground">{grupo.nombre}</td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground">{grupo.cantidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onAnterior}>
          Atrás
        </Button>
        <Button
          type="button"
          onClick={onSiguiente}
          disabled={cargado && !preview?.nombresAlcanzan && agrupacion?.accion_sin_nombres === 'bloquear_generacion'}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}