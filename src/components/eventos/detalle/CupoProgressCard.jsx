import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function CupoProgressCard({ totalInscriptos, cupoMaximo }) {
  if (!cupoMaximo) return null

  const porcentaje = Math.min((totalInscriptos / cupoMaximo) * 100, 100)
  const disponibles = cupoMaximo - totalInscriptos
  const casi_lleno = porcentaje >= 80

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Cupo del evento</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalInscriptos.toLocaleString('es-AR')}</span>
            {' / '}
            {cupoMaximo.toLocaleString('es-AR')}
          </p>
        </div>
        <Progress
          value={porcentaje}
          className={casi_lleno ? 'text-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          {disponibles <= 0
            ? 'Cupo completo'
            : casi_lleno
              ? `Quedan solo ${disponibles.toLocaleString('es-AR')} lugares`
              : `${disponibles.toLocaleString('es-AR')} lugares disponibles`
          }
        </p>
      </CardContent>
    </Card>
  )
}