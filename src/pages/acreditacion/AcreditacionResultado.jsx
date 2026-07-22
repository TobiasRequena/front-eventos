import { useState } from 'react'
import { CheckCircle2, XCircle, Users, User, ArrowLeft, AlertCircle, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { acreditarIndividual, acreditarGrupal } from '@/api/acreditacion.api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ESTADO_PAGO_CONFIG = {
  no_aplica: { label: 'Sin costo', variant: 'secondary' },
  pendiente: { label: 'Pago pendiente', variant: 'outline' },
  aprobado: { label: 'Pago aprobado', variant: 'default' },
  rechazado: { label: 'Pago rechazado', variant: 'destructive' },
}

export function AcreditacionResultado({ resultado, sesion, evento, onVolver }) {
  const { participante, grupo } = resultado
  const [procesando, setProcesando] = useState(false)
  const [acreditado, setAcreditado] = useState(false)
  const [resultadoGrupal, setResultadoGrupal] = useState(null)

  const esReferente = participante.rol_grupo === 'responsable' && grupo

  // Inicializar selección: todos los no acreditados seleccionados por defecto
  const todosLosIntegrantes = esReferente
    ? [participante, ...grupo.integrantes.filter((i) => i.id !== participante.id)]
    : []

  const [seleccionados, setSeleccionados] = useState(() =>
    new Set(todosLosIntegrantes.filter((i) => !i.acreditado).map((i) => i.id))
  )

  const estadoPago = ESTADO_PAGO_CONFIG[participante.estado_pago] ?? ESTADO_PAGO_CONFIG.no_aplica

  function toggleSeleccion(id) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleAcreditarIndividual() {
    setProcesando(true)
    try {
      await acreditarIndividual({
        participanteId: participante.id,
        acreditadorId: sesion.id,
        eventoId: evento.id,
      })
      setAcreditado(true)
      toast.success(`${participante.nombre} acreditado correctamente.`)
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('Este participante ya fue acreditado.')
      } else {
        toast.error('No pudimos acreditar al participante.')
      }
    } finally {
      setProcesando(false)
    }
  }

  async function handleAcreditarSeleccionados() {
    if (seleccionados.size === 0) {
      toast.error('Seleccioná al menos un integrante.')
      return
    }
    setProcesando(true)
    try {
      const data = await acreditarGrupal({
        participanteIds: Array.from(seleccionados),
        acreditadorId: sesion.id,
        eventoId: evento.id,
      })
      setResultadoGrupal(data.resultados)
      const acreditadosNuevos = data.resultados.filter((r) => r.resultado === 'acreditado').length
      toast.success(`${acreditadosNuevos} integrante${acreditadosNuevos !== 1 ? 's' : ''} acreditado${acreditadosNuevos !== 1 ? 's' : ''}.`)
    } catch {
      toast.error('No pudimos acreditar al grupo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <button
        type="button"
        onClick={onVolver}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a escanear
      </button>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-foreground">
                {participante.nombre} {participante.apellido}
              </p>
              <p className="text-sm text-muted-foreground">
                DNI {participante.dni} · {participante.es_mayor ? 'Mayor' : 'Menor'} de edad
              </p>
            </div>
            {participante.acreditado ? (
              <Badge variant="secondary" className="shrink-0">Ya acreditado</Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">Sin acreditar</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={estadoPago.variant}>{estadoPago.label}</Badge>
            {esReferente && (
              <Badge variant="secondary">
                <Users className="mr-1 h-3 w-3" />
                Referente — {grupo.nombre}
              </Badge>
            )}
          </div>

          {participante.estado_pago === 'pendiente' && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Tiene pago pendiente.
            </div>
          )}
        </CardContent>
      </Card>

      {esReferente && !resultadoGrupal && (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-10"></TableHead>
                <TableHead className="font-medium text-foreground">Nombre</TableHead>
                <TableHead className="font-medium text-foreground">Pago</TableHead>
                <TableHead className="w-8 font-medium text-foreground">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todosLosIntegrantes.map((integrante) => {
                const esRef = integrante.id === participante.id
                const estadoPagoIntegrante = ESTADO_PAGO_CONFIG[integrante.estado_pago] ?? ESTADO_PAGO_CONFIG.no_aplica
                return (
                  <TableRow
                    key={integrante.id}
                    className={integrante.acreditado ? 'opacity-50' : 'hover:bg-muted/50'}
                  >
                    <TableCell>
                      <Checkbox
                        checked={seleccionados.has(integrante.id)}
                        disabled={integrante.acreditado}
                        onCheckedChange={() => toggleSeleccion(integrante.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {integrante.nombre} {integrante.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {esRef ? 'Referente' : integrante.es_mayor ? 'Mayor' : 'Menor'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={estadoPagoIntegrante.variant} className="text-xs">
                        {estadoPagoIntegrante.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {integrante.acreditado
                        ? <CheckCircle2 className="h-4 w-4 text-success" />
                        : <XCircle className="h-4 w-4 text-muted-foreground" />
                      }
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {resultadoGrupal && (
        <Card>
          <CardContent className="space-y-2 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resultado
            </p>
            {resultadoGrupal.map((r) => (
              <div key={r.participanteId} className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">
                  {todosLosIntegrantes.find((i) => i.id === r.participanteId)
                    ? `${todosLosIntegrantes.find((i) => i.id === r.participanteId).nombre} ${todosLosIntegrantes.find((i) => i.id === r.participanteId).apellido}`
                    : r.participanteId
                  }
                </span>
                {r.resultado === 'acreditado'
                  ? <Badge variant="default">Acreditado</Badge>
                  : <Badge variant="secondary">Ya estaba</Badge>
                }
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!acreditado && !resultadoGrupal && (
        <div className="space-y-2">
          {esReferente ? (
            <Button
              className="w-full"
              onClick={handleAcreditarSeleccionados}
              disabled={procesando || seleccionados.size === 0}
            >
              <Users className="h-4 w-4" />
              {procesando
                ? 'Acreditando...'
                : `Acreditar seleccionados (${seleccionados.size})`
              }
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleAcreditarIndividual}
              disabled={procesando || participante.acreditado}
            >
              <CheckCircle2 className="h-4 w-4" />
              {participante.acreditado
                ? 'Ya acreditado'
                : procesando
                  ? 'Acreditando...'
                  : 'Acreditar'
              }
            </Button>
          )}
        </div>
      )}

      {(acreditado || resultadoGrupal) && (
        <Button onClick={onVolver} className="w-full">
          <ScanLine className="h-4 w-4" />
          Escanear siguiente
        </Button>
      )}
    </div>
  )
}