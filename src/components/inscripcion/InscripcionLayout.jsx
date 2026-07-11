import { CalendarRange } from 'lucide-react'

export function InscripcionLayout({ evento, children }) {
  const imagenUrl = evento?.imagen_url ?? evento?.imagenUrl

  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          {imagenUrl ? (
            <img
              src={imagenUrl}
              alt={evento.nombre}
              className="h-20 w-full max-w-sm rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <CalendarRange className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {evento?.nombre}
            </h1>
            {evento?.fecha_inicio && (
              <p className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(evento.fecha_inicio))}
              </p>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}