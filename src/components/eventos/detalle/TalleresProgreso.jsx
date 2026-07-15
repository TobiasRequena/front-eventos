import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

function TallerProgressCard({ taller, onClick }) {
  const porcentaje = taller.capacidad
    ? Math.round((taller.inscriptos / taller.capacidad) * 100)
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full space-y-2 rounded-md border border-border p-3 text-left transition-colors',
        'hover:bg-accent/50 cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground truncate">{taller.nombre}</p>
        <span className="shrink-0 text-xs text-muted-foreground">
          {porcentaje !== null
            ? `${taller.inscriptos} / ${taller.capacidad}`
            : `${taller.inscriptos ?? 0} inscriptos`
          }
        </span>
      </div>
      {porcentaje !== null ? (
        <Progress value={porcentaje} className="h-1.5" />
      ) : null}
    </button>
  )
}

export function TalleresProgreso({ bloquesTaller, onSeleccionarTaller }) {
  if (!bloquesTaller?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Talleres</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bloquesTaller.map((bloque) => (
          <div key={bloque.id ?? bloque.nombre} className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {bloque.nombre}
            </p>
            <div className="space-y-2">
              {bloque.talleres.map((taller) => (
                <TallerProgressCard
                  key={taller.id ?? taller.nombre}
                  taller={taller}
                  onClick={() => onSeleccionarTaller(bloque, taller)}
                />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}