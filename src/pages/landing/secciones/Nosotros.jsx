import { FormularioContacto } from '@/components/soporte/FormularioContacto'
import { Seccion, Pregunta } from '../Seccion'
import { EQUIPO, INSTAGRAM, MANIFIESTO } from '../datosLanding'
import { IconoInstagram } from '../IconoInstagram'

export function Nosotros() {
  return (
    <Seccion id="nosotros" numero={5} titulo="Nosotros">
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
          <div key={m.titulo}>
            <h3 className="text-4xl font-bold">
              <span className="resaltado">{m.titulo}</span>
            </h3>
            <p className="mt-2 text-2xl leading-snug text-foreground/80">{m.texto}</p>
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
