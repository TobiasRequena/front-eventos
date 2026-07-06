import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function RespuestasPopulares({ camposFormStats }) {
  const camposConRespuestas = camposFormStats?.filter(
    (c) => c.respuestasPopulares?.length > 0
  )

  if (!camposConRespuestas?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Respuestas más populares</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {camposConRespuestas.map((campo) => {
          const max = campo.respuestasPopulares[0]?.cantidad ?? 1

          return (
            <div key={campo.id} className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {campo.etiqueta}
              </p>
              <div className="space-y-2">
                {campo.respuestasPopulares.map((respuesta) => (
                  <div key={respuesta.valor} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{respuesta.valor}</span>
                      <span className="text-muted-foreground">{respuesta.cantidad}</span>
                    </div>
                    <Progress
                      value={Math.round((respuesta.cantidad / max) * 100)}
                      className="h-1.5"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}