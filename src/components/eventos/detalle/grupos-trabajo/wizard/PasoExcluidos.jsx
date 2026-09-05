import { useState, useMemo } from 'react'
import { Search, UserX, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { agregarExcluido, quitarExcluido } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

function idsExcluidos(esquema) {
  return new Set((esquema.excluidos ?? []).map((e) => e.participante_id))
}

export function PasoExcluidos({ evento, esquema, participantes, participantesCargando, onSiguiente, onAnterior, onExcluidosGuardados }) {
  // El detalle de la agrupación (incluidos los excluidos) ya lo tiene el editor padre.
  const [excluidosOriginales, setExcluidosOriginales] = useState(() => idsExcluidos(esquema))
  const [excluidosLocales, setExcluidosLocales] = useState(() => idsExcluidos(esquema))
  const [guardando, setGuardando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const esBorrador = esquema.estado === 'borrador'

  const participantesFiltrados = useMemo(() => {
    if (!busqueda) return participantes
    const q = busqueda.toLowerCase()
    return participantes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        p.dni.includes(q)
    )
  }, [participantes, busqueda])

  function toggleLocal(participanteId) {
    if (!esBorrador) return
    setExcluidosLocales((prev) => {
      const next = new Set(prev)
      if (next.has(participanteId)) next.delete(participanteId)
      else next.add(participanteId)
      return next
    })
  }

  async function handleContinuar() {
    if (!esBorrador) {
      onSiguiente()
      return
    }

    // Calcular diferencias
    const agregar = [...excluidosLocales].filter((id) => !excluidosOriginales.has(id))
    const quitar = [...excluidosOriginales].filter((id) => !excluidosLocales.has(id))

    if (agregar.length === 0 && quitar.length === 0) {
      onSiguiente()
      return
    }

    setGuardando(true)
    try {
      await Promise.all([
        agregar.length > 0 ? agregarExcluido(evento.id, esquema.id, agregar) : Promise.resolve(),
        ...quitar.map((id) => quitarExcluido(evento.id, esquema.id, id)),
      ])
      setExcluidosOriginales(new Set(excluidosLocales))
      onExcluidosGuardados?.(excluidosLocales)
      toast.success('Exclusiones guardadas.')
      onSiguiente()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos guardar las exclusiones.'))
    } finally {
      setGuardando(false)
    }
  }

  const cantidadCambios = useMemo(() => {
    const agregar = [...excluidosLocales].filter((id) => !excluidosOriginales.has(id)).length
    const quitar = [...excluidosOriginales].filter((id) => !excluidosLocales.has(id)).length
    return agregar + quitar
  }, [excluidosLocales, excluidosOriginales])

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Excluidos manualmente</CardTitle>
            {excluidosLocales.size > 0 && (
              <Badge variant="outline">
                <UserX className="mr-1 h-3 w-3" />
                {excluidosLocales.size} excluido{excluidosLocales.size !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Los participantes marcados no participarán en la generación de grupos y quedarán como "excluidos por administrador". Los cambios se guardan al presionar Continuar.
          </p>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>

          {participantesCargando ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : participantesFiltrados.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No se encontraron participantes.
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
              {participantesFiltrados.map((participante) => {
                const estaExcluido = excluidosLocales.has(participante.id)
                const cambio = estaExcluido !== excluidosOriginales.has(participante.id)
                return (
                  <div
                    key={participante.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 cursor-pointer"
                    onClick={() => esBorrador && toggleLocal(participante.id)}
                  >
                    <Checkbox
                      checked={excluidosLocales.has(participante.id)}
                      disabled={!esBorrador}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => { }} // vacío — el div maneja el toggle
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${excluidosLocales.has(participante.id) ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {participante.nombre} {participante.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">DNI {participante.dni}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {excluidosLocales.has(participante.id) !== excluidosOriginales.has(participante.id) && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          Modificado
                        </Badge>
                      )}
                      {excluidosLocales.has(participante.id) && (
                        <Badge variant="outline" className="text-xs">
                          <X className="mr-1 h-3 w-3" />
                          Excluido
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onAnterior} disabled={guardando}>
          Atrás
        </Button>
        <Button type="button" onClick={handleContinuar} disabled={guardando}>
          {guardando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : cantidadCambios > 0
            ? `Guardar ${cantidadCambios} cambio${cantidadCambios !== 1 ? 's' : ''} y continuar`
            : 'Continuar'
          }
        </Button>
      </div>
    </div>
  )
}