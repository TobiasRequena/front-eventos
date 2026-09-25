import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AuthCarousel } from '@/components/layout/AuthCarousel'
import { Seccion, Resaltado } from '../Seccion'

export function Inicio() {
  return (
    <Seccion id="inicio" className="relative isolate items-center overflow-hidden text-center">
      {/* Fotos de fondo que van cambiando (las mismas del login), lavadas como en las piezas de Instagram */}
      <AuthCarousel overlay={false} className="absolute inset-0 -z-20 overflow-hidden grayscale-[30%]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-background/85" />

      <img src="/logo_talita_encuentro.png" alt="Talita Encuentro" className="w-72 md:w-[28rem]" />

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
    </Seccion>
  )
}
