import { useState } from 'react'
import { Users, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getPreview } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

function PreviewSinTandas({ preview }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg border border-border p-4 text-center">
        <p className="text-2xl font-semibold text-foreground">{preview.totalElegibles}</p>
        <p className="mt-1 text-xs text-muted-foreground">Elegibles</p>
      </div>
      <div className="rounded-lg border border-border p-4 text-center">
        <p className="text-2xl font-semibold text-foreground">{preview.cantidadGrupos}</p>
        <p className="mt-1 text-xs text-muted-foreground">Grupos a generar</p>
      </div>
      <div className="rounded-lg border border-border p-4 text-center">
        <p className="text-2xl font-semibold text-foreground">{preview.pendientesEstimados}</p>
        <p className="mt-1 text-xs text-muted-foreground">Pendientes</p>
      </div>
    </div>
  )
}

function PreviewConTandas({ preview }) {
  return (
    <div className="space-y-3">
      {preview.sinClasificar > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{preview.sinClasificar}</span> participante{preview.sinClasificar !== 1 ? 's' : ''} no encajan en ninguna tanda y quedarán pendientes.
          </p>
        </div>
      )}

      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted">
              <th className="px-3 py-2 text-left font-medium text-foreground">Tanda</th>
              <th className="px-3 py-2 text-center font-medium text-foreground">Participantes</th>
              <th className="px-3 py-2 text-center font-medium text-foreground">Grupos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {preview.tandas.map((tanda) => (
              <tr key={tanda.tandaId} className="hover:bg-muted/50">
                <td className="px-3 py-2.5 font-medium text-foreground">{tanda.nombre}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">{tanda.cantidad}</td>
                <td className="px-3 py-2.5 text-center text-muted-foreground">{tanda.grupos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PasoPreview({ evento, esquema, onSiguiente, onAnterior }) {
  const [preview, setPreview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cargado, setCargado] = useState(false)

  async function cargarPreview() {
    setIsLoading(true)
    try {
      const data = await getPreview(evento.id, esquema.id)
      setPreview(data)
      setCargado(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos calcular el preview.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Preview de generación</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cargarPreview}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              {cargado ? 'Recalcular' : 'Calcular preview'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!cargado && !isLoading && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Calculá el preview para ver cuántos grupos se generarían y cuántos participantes quedarían pendientes.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {cargado && preview && !isLoading && (
            preview.tieneTandas
              ? <PreviewConTandas preview={preview} />
              : <PreviewSinTandas preview={preview} />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onAnterior}>
          Atrás
        </Button>
        <Button type="button" onClick={onSiguiente}>
          Continuar
        </Button>
      </div>
    </div>
  )
}