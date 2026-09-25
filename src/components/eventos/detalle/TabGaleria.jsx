import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'
import { getFotosGaleria, subirFotoGaleria, eliminarFotoGaleria } from '@/api/landing.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

const MAX_FOTOS = 20

/**
 * Fotos del evento para la galería de la página principal de Talita.
 * La pestaña solo existe cuando el evento terminó (ver EventoDetallePage).
 */
export function TabGaleria({ evento }) {
  const [fotos, setFotos] = useState(null)
  const [subiendo, setSubiendo] = useState(0)

  useEffect(() => {
    getFotosGaleria(evento.id).then(setFotos).catch(() => setFotos([]))
  }, [evento.id])

  async function elegir(e) {
    const archivos = [...e.target.files].slice(0, MAX_FOTOS - (fotos?.length ?? 0))
    e.target.value = ''
    setSubiendo(archivos.length)
    // Una por una: el back cuenta el límite de fotos en cada subida
    for (const archivo of archivos) {
      try {
        const foto = await subirFotoGaleria(evento.id, archivo)
        setFotos((f) => [...f, foto])
      } catch (err) {
        toast.error(getApiErrorMessage(err, `No pudimos subir ${archivo.name}.`))
      } finally {
        setSubiendo((n) => n - 1)
      }
    }
  }

  async function eliminar(id) {
    try {
      await eliminarFotoGaleria(evento.id, id)
      setFotos((f) => f.filter((x) => x.id !== id))
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar la foto.'))
    }
  }

  const lleno = (fotos?.length ?? 0) >= MAX_FOTOS

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Las fotos se ven públicamente en la página de Talita Encuentro. Subí solo fotos en las que las personas
          (y, si hay menores, sus madres, padres o tutores) hayan dado permiso para aparecer.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {fotos ? `${fotos.length} de ${MAX_FOTOS} fotos` : 'Cargando…'}
        </p>
        <Button asChild disabled={lleno || subiendo > 0 || !fotos}>
          <label className={lleno || !fotos ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
            {subiendo > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {subiendo > 0 ? `Subiendo ${subiendo}…` : 'Subir fotos'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={elegir}
              disabled={lleno || subiendo > 0 || !fotos}
            />
          </label>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {!fotos && Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-square w-full rounded-lg" />)}
        {fotos?.map((f) => (
          <div key={f.id} className="group relative">
            <img src={f.url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => eliminar(f.id)}
              aria-label="Eliminar foto"
              className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      {fotos?.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Todavía no subiste fotos de este evento.</p>
      )}
    </div>
  )
}
