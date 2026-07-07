import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

function RespuestasSeleccion({ campo }) {
  const max = campo.respuestasPopulares[0]?.cantidad ?? 1
  return (
    <div className="space-y-2">
      {campo.respuestasPopulares.map((r) => (
        <div key={r.valor} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{r.valor}</span>
            <span className="text-muted-foreground">{r.cantidad}</span>
          </div>
          <Progress value={Math.round((r.cantidad / max) * 100)} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}

function RespuestasBooleano({ campo }) {
  const max = campo.totalRespuestas ?? 1
  return (
    <div className="space-y-2">
      {campo.respuestasPopulares.map((r) => (
        <div key={r.valor} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{r.valor === 'true' ? 'Sí' : 'No'}</span>
            <span className="text-muted-foreground">
              {r.cantidad} ({Math.round((r.cantidad / max) * 100)}%)
            </span>
          </div>
          <Progress value={Math.round((r.cantidad / max) * 100)} className="h-1.5" />
        </div>
      ))}
    </div>
  )
}

function RespuestasTexto({ campo }) {
  if (!campo.respuestasFrecuentes?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        {campo.totalRespuestas} respuesta{campo.totalRespuestas !== 1 ? 's' : ''} recibidas.
      </p>
    )
  }
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground mb-2">Respuestas más frecuentes:</p>
      {campo.respuestasFrecuentes.map((r) => (
        <div key={r.valor} className="flex items-center justify-between text-sm">
          <span className="truncate text-foreground">"{r.valor}"</span>
          <span className="shrink-0 ml-2 text-muted-foreground">{r.cantidad}x</span>
        </div>
      ))}
    </div>
  )
}

function RespuestasNumero({ campo }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Promedio</p>
        <p className="text-sm font-semibold text-foreground">{campo.promedio?.toFixed(1) ?? '—'}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Mínimo</p>
        <p className="text-sm font-semibold text-foreground">{campo.minimo ?? '—'}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Máximo</p>
        <p className="text-sm font-semibold text-foreground">{campo.maximo ?? '—'}</p>
      </div>
    </div>
  )
}

function RespuestasFecha({ campo }) {
  function formatearFecha(fechaStr) {
    if (!fechaStr) return '—'
    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(fechaStr))
  }

  return (
    <div className="grid grid-cols-2 gap-3 text-center">
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Primera fecha</p>
        <p className="text-sm font-semibold text-foreground">{formatearFecha(campo.minimo)}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-xs text-muted-foreground">Última fecha</p>
        <p className="text-sm font-semibold text-foreground">{formatearFecha(campo.maximo)}</p>
      </div>
    </div>
  )
}

function RespuestasCampo({ campo }) {
  switch (campo.tipo) {
    case 'seleccion':
      return <RespuestasSeleccion campo={campo} />
    case 'booleano':
      return <RespuestasBooleano campo={campo} />
    case 'texto':
      return <RespuestasTexto campo={campo} />
    case 'numero':
      return <RespuestasNumero campo={campo} />
    case 'fecha':
      return <RespuestasFecha campo={campo} />
    default:
      return null
  }
}

export function RespuestasPopulares({ camposFormStats }) {
  if (!camposFormStats?.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Respuestas del formulario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {camposFormStats.map((campo) => (
          <div key={campo.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {campo.etiqueta}
              </p>
              {campo.totalRespuestas !== undefined && (
                <p className="text-xs text-muted-foreground">
                  {campo.totalRespuestas} respuestas
                </p>
              )}
            </div>
            <RespuestasCampo campo={campo} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}