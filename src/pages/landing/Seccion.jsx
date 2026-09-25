import { cn } from '@/lib/utils'

// Cada sección ocupa al menos el alto de la columna y arranca alineada arriba (scroll-snap),
// así nunca queda cortada al medio.
export function Seccion({ id, numero, titulo, className, children }) {
  return (
    <section
      id={id}
      aria-labelledby={titulo ? `${id}-titulo` : undefined}
      className={cn('flex min-h-full snap-start flex-col justify-center gap-12 px-6 py-20 md:px-14 lg:px-20', className)}
    >
      {titulo && (
        <header className="flex flex-col gap-3">
          <span className="text-sm font-medium tracking-widest text-muted-foreground tabular-nums">
            {String(numero).padStart(2, '0')}
          </span>
          <h2 id={`${id}-titulo`} className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {titulo}
          </h2>
        </header>
      )}
      {children}
    </section>
  )
}

export function Pregunta({ children }) {
  return <h3 className="text-2xl font-semibold tracking-tight text-foreground">{children}</h3>
}

export function Resaltado({ children }) {
  return <span className="resaltado box-decoration-clone px-0.5">{children}</span>
}
