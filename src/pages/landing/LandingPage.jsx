import { useEffect, useRef, useState } from 'react'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SECCIONES } from './datosLanding'
import { Inicio } from './secciones/Inicio'
import { ComoFunciona } from './secciones/ComoFunciona'
import { Costos } from './secciones/Costos'
import { ProximosEventos } from './secciones/ProximosEventos'
import { Nosotros } from './secciones/Nosotros'
import { Galeria } from './secciones/Galeria'
import { PieLanding } from './PieLanding'

// conTitulos: en escritorio y en el menú abierto del celular; sin títulos, solo los números
function ListaSecciones({ activa, onElegir, conTitulos }) {
  return (
    <ol className="flex flex-col gap-1">
      {SECCIONES.map((s, i) => {
        const esActiva = activa === s.id
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onElegir(s.id)}
              aria-current={esActiva ? 'location' : undefined}
              aria-label={s.titulo}
              className={cn(
                'relative flex w-full cursor-pointer items-baseline gap-3 rounded-lg py-2.5 text-left transition-colors',
                conTitulos ? 'px-4' : 'justify-center',
                esActiva ? 'bg-background text-foreground shadow-sm ring-1 ring-border' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                aria-hidden
                className={cn('absolute inset-y-2.5 left-0 w-1 rounded-full', esActiva ? 'bg-talita-amarillo' : 'bg-transparent')}
              />
              <span className={cn('text-xs font-semibold tabular-nums', esActiva && 'text-talita-rojo')}>
                {String(i + 1).padStart(2, '0')}
              </span>
              {conTitulos && <span className="text-base font-medium leading-snug lg:text-lg">{s.titulo}</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export default function LandingPage() {
  const contenidoRef = useRef(null)
  const [activa, setActiva] = useState(SECCIONES[0].id)
  const [menuAbierto, setMenuAbierto] = useState(false)

  // La sección activa es la que cruza la línea media de la columna derecha
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiva(e.target.id)),
      { root: contenidoRef.current, rootMargin: '-50% 0px -50% 0px' }
    )
    contenidoRef.current.querySelectorAll('section[id]').forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // Links compartibles: /#costos entra directo a esa sección
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    if (SECCIONES.some((s) => s.id === id)) document.getElementById(id).scrollIntoView()
  }, [])

  function irA(id) {
    setMenuAbierto(false)
    history.replaceState(null, '', id === SECCIONES[0].id ? window.location.pathname : `#${id}`)
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="grid h-dvh grid-cols-[3.5rem_1fr] bg-background text-foreground md:grid-cols-[15rem_1fr] lg:grid-cols-[20rem_1fr]">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
      >
        Saltar al contenido
      </a>
      <nav aria-label="Secciones" className="relative flex flex-col justify-center border-r border-border bg-sidebar px-1.5 py-8 md:px-4 lg:px-6">
        {/* Celular: solo números + botón para abrir el menú con los títulos */}
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="absolute top-3 left-1/2 -translate-x-1/2 md:hidden"
        >
          <Menu />
        </Button>
        <div className="md:hidden">
          <ListaSecciones activa={activa} onElegir={irA} />
        </div>
        <div className="hidden md:block">
          <ListaSecciones activa={activa} onElegir={irA} conTitulos />
        </div>
      </nav>

      <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
        <SheetContent side="left" className="w-72 justify-center bg-sidebar p-4">
          <SheetTitle className="sr-only">Secciones</SheetTitle>
          <ListaSecciones activa={activa} onElegir={irA} conTitulos />
        </SheetContent>
      </Sheet>

      <main id="contenido" ref={contenidoRef} tabIndex={-1} className="snap-y snap-proximity overflow-y-auto overflow-x-hidden outline-none motion-safe:scroll-smooth">
        <Inicio onIrA={irA} />
        <ComoFunciona />
        <Costos />
        <ProximosEventos />
        <Nosotros />
        <Galeria />
        <PieLanding />
      </main>
    </div>
  )
}
