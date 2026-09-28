import { useState } from 'react'
import { cn } from '@/lib/utils'
import { FormularioContacto } from '@/components/soporte/FormularioContacto'
import { Seccion, Pregunta, Resaltado } from '../Seccion'
import { EQUIPO, INSTAGRAM, MANIFIESTO } from '../datosLanding'
import { IconoInstagram } from '../IconoInstagram'

// 4 renglones con "..."; un click lo abre entero y otro lo vuelve a cerrar
function TextoPlegable({ texto }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <button
      type="button"
      onClick={() => setAbierto((a) => !a)}
      aria-expanded={abierto}
      className="group mt-2 block w-full cursor-pointer text-left"
    >
      <p className={cn('text-2xl leading-snug whitespace-pre-line text-foreground/80', !abierto && 'line-clamp-4')}>
        {texto}
      </p>
      {/* Aparece al pasar el mouse; en celular (sin hover) se ve siempre */}
      <span className="mt-1 inline-block text-lg font-bold text-talita-rojo opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
        {abierto ? 'Ver menos' : 'Ver más'}
      </span>
    </button>
  )
}

export function Nosotros() {
  return (
    <Seccion id="nosotros" numero={5} titulo={<><Resaltado>Nosotros</Resaltado>:</>}>
      <div className="grid gap-10 sm:grid-cols-2">
        {EQUIPO.map((p) => (
          <div key={p.nombre} className="flex flex-col items-center gap-4 text-center">
            {/* ponytail: inicial como foto hasta tener las fotos reales en src/assets/landing */}
            <div className="flex size-40 items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground ring-4 ring-talita-amarillo/60 ring-offset-4 ring-offset-background">
              {p.nombre[0]}
            </div>
            <p className="text-2xl font-bold tracking-tight">{p.nombre}</p>
            <p className="max-w-xs text-base leading-relaxed text-muted-foreground">{p.descripcion}</p>
          </div>
        ))}
      </div>

      <p className="text-center font-manuscrita text-5xl font-bold">
        Juntos creamos <span className="text-talita-rojo">Talita</span>
      </p>

      <div className="grid grid-cols-1 gap-x-12 gap-y-10 font-manuscrita md:grid-cols-2">
        {MANIFIESTO.map((m) => (
          // Si la cantidad es impar, el último ocupa las dos columnas en vez de quedar colgado
          <div key={m.titulo} className="md:odd:last:col-span-2">
            <h3 className="text-4xl font-bold">
              <span className="resaltado">{m.titulo}</span>
            </h3>
            <TextoPlegable texto={m.texto} />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Pregunta>Contacto</Pregunta>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <FormularioContacto textoBoton="Enviar mensaje" />
        </div>
        <a
          href={`https://instagram.com/${INSTAGRAM}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-lg font-medium shadow-sm transition-colors hover:border-talita-amarillo"
        >
          <IconoInstagram className="size-6 text-talita-rojo" />
          @{INSTAGRAM}
          <span className="text-base font-normal text-muted-foreground">· seguinos en Instagram</span>
        </a>
      </div>
    </Seccion>
  )
}
