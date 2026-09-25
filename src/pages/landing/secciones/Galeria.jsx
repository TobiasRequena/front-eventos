import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ImagePlus } from 'lucide-react'
import { AuthCarousel } from '@/components/layout/AuthCarousel'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getGaleriaLanding } from '@/api/landing.api'
import { Seccion, Resaltado } from '../Seccion'
import { cn } from '@/lib/utils'

function mezclar(lista) {
  const a = [...lista]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function SinFotos() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <ImagePlus className="size-10 text-talita-amarillo" />
      <p className="text-2xl font-semibold tracking-tight">Cargá tus imágenes al finalizar el evento</p>
      <p className="max-w-md text-base text-muted-foreground">
        Las fotos que suban las organizaciones de sus encuentros terminados van a aparecer acá.
      </p>
    </div>
  )
}

export function Galeria() {
  const [galeria, setGaleria] = useState(null)
  const [abierto, setAbierto] = useState(null)
  const [actual, setActual] = useState(0)

  useEffect(() => {
    getGaleriaLanding().then(setGaleria).catch(() => setGaleria([]))
  }, [])

  // Fotos de todos los eventos, mezcladas. Cada una recuerda de qué evento es,
  // para iluminar su card en la línea de tiempo. El carrusel carga todas sus
  // imágenes de entrada, así que se queda con 15; el resto se ve al abrir cada evento.
  const diapositivas = useMemo(
    () => mezclar((galeria ?? []).flatMap((ev, evento) => ev.fotos.map((foto) => ({ foto, evento })))).slice(0, 15),
    [galeria]
  )
  const fotos = useMemo(() => diapositivas.map((d) => d.foto), [diapositivas])
  const eventoActual = diapositivas[actual]?.evento

  return (
    <Seccion id="galeria" numero={6} titulo={<>Galería de <Resaltado>fotos</Resaltado></>}>
      {!galeria && <Skeleton className="aspect-[4/5] w-full rounded-xl lg:aspect-auto lg:h-[28rem]" />}
      {galeria?.length === 0 && <SinFotos />}
      {galeria?.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <AuthCarousel
            images={fotos}
            overlay={false}
            onChange={setActual}
            className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-sm lg:aspect-auto lg:min-h-[28rem]"
          />

          <ol className="relative flex flex-col gap-3 border-l border-border pl-6">
            {galeria.map((ev, i) => (
              <li key={ev.nombre + ev.fecha_inicio} className="relative">
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-5 -left-[1.95rem] size-2.5 rounded-full ring-4 ring-background transition-colors duration-700',
                    i === eventoActual ? 'bg-talita-amarillo' : 'bg-border'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setAbierto(ev)}
                  aria-current={i === eventoActual ? 'true' : undefined}
                  className={cn(
                    'w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition-all duration-700 hover:border-talita-amarillo',
                    i === eventoActual
                      ? 'border-talita-amarillo bg-talita-amarillo/15 shadow-md'
                      : 'border-border bg-card opacity-70 hover:opacity-100'
                  )}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-talita-rojo">
                    {format(new Date(ev.fecha_inicio), "d 'de' MMMM yyyy", { locale: es })}
                  </p>
                  <p className="text-base font-semibold">{ev.nombre}</p>
                  <p className="text-sm text-muted-foreground">{ev.org_nombre} · {ev.fotos.length} fotos</p>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <Dialog open={!!abierto} onOpenChange={(v) => !v && setAbierto(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{abierto?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
            {abierto?.fotos.map((f, i) => (
              <img key={f} src={f} alt={`${abierto.nombre}, foto ${i + 1}`} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Seccion>
  )
}
