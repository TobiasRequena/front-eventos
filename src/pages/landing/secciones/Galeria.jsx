import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { AuthCarousel } from '@/components/layout/AuthCarousel'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Seccion, Resaltado } from '../Seccion'
import { cn } from '@/lib/utils'
import { GALERIA } from '../datosLanding'

// Todas las fotos de todos los eventos, mezcladas una sola vez al cargar el módulo.
// Cada una recuerda de qué evento es, para iluminar su card en la línea de tiempo.
const diapositivas = GALERIA
  .flatMap((ev, evento) => ev.fotos.map((foto) => ({ foto, evento })))
  .sort(() => Math.random() - 0.5)
const fotos = diapositivas.map((d) => d.foto)

export function Galeria() {
  const [abierto, setAbierto] = useState(null)
  const [actual, setActual] = useState(0)
  const eventoActual = diapositivas[actual].evento

  return (
    <Seccion id="galeria" numero={6} titulo={<>Galería de <Resaltado>fotos</Resaltado></>}>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <AuthCarousel
          images={fotos}
          overlay={false}
          onChange={setActual}
          className="relative aspect-[4/5] overflow-hidden rounded-xl shadow-sm lg:aspect-auto lg:min-h-[28rem]"
        />

        <ol className="relative flex flex-col gap-3 border-l border-border pl-6">
          {GALERIA.map((ev, i) => (
            <li key={ev.nombre + ev.fecha} className="relative">
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
                  {format(parseISO(ev.fecha), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                <p className="text-base font-semibold">{ev.nombre}</p>
                <p className="text-sm text-muted-foreground">{ev.org} · {ev.fotos.length} fotos</p>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <Dialog open={!!abierto} onOpenChange={(v) => !v && setAbierto(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{abierto?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
            {abierto?.fotos.map((f, i) => (
              <img key={i} src={f} alt={`${abierto.nombre}, foto ${i + 1}`} className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Seccion>
  )
}
