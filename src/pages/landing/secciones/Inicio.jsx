import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthCarousel } from '@/components/layout/AuthCarousel'
import { Seccion, Resaltado } from '../Seccion'

export function Inicio({ onIrA }) {
  return (
    <Seccion id="inicio" className="relative isolate items-center gap-8 overflow-hidden py-10 text-center">
      {/* Fotos de fondo que van cambiando (las mismas del login), lavadas como en las piezas de Instagram */}
      <AuthCarousel overlay={false} className="absolute inset-0 -z-20 overflow-hidden grayscale-[30%]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/85" />

      <h1 className="sr-only">Talita Encuentro</h1>
      {/* max-h: en pantallas bajas el logo se achica para que la portada entre entera sin scrollear */}
      <img src="/logo_talita_encuentro.png" alt="" className="max-h-[38dvh] w-72 object-contain md:w-[28rem]" />

      <p className="max-w-lg text-xl text-foreground/80 md:text-2xl">
        Mucho más que un formulario: lo necesario para el <Resaltado>encuentro</Resaltado>.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="h-12 px-8 text-base">
          <Link to="/login">Iniciar sesión</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
          <Link to="/register">Crear usuario</Link>
        </Button>
      </div>

      {/* Para quien llega a inscribirse y no a organizar */}
      <Button variant="link" onClick={() => onIrA('proximos-eventos')} className="cursor-pointer text-base">
        ¿Venís a inscribirte? Mirá los próximos eventos
      </Button>
    </Seccion>
  )
}
