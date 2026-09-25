import { useEffect, useState } from 'react'
import { getTramos } from '@/api/pagos.api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Seccion, Resaltado } from '../Seccion'

const compacto = new Intl.NumberFormat('es-AR', { notation: 'compact' })
const numero = (n) => n.toLocaleString('es-AR')

function formatearMonto(monto) {
  const num = parseFloat(monto)
  return num === 0 ? 'Gratis' : `$${numero(num)}`
}

function montoCorto(monto) {
  const num = parseFloat(monto)
  return num === 0 ? 'Gratis' : `$${compacto.format(num)}`
}

function rangoPorParticipante(t) {
  if (parseFloat(t.precio_por_participante_desde) === 0) return '—'
  const r = (v) => `$${numero(Math.round(parseFloat(v)))}`
  return `${r(t.precio_por_participante_desde)} — ${r(t.precio_por_participante_hasta)}`
}

export function Costos() {
  const [tramos, setTramos] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getTramos().then(setTramos).catch(() => setError(true))
  }, [])

  return (
    <Seccion id="costos" numero={3} titulo={<>Hablemos de <Resaltado>costos</Resaltado></>}>
      {error ? (
        <p className="text-xl text-muted-foreground">No pudimos cargar los precios. Probá de nuevo en un rato.</p>
      ) : (
        <>
          {/* Barra de progreso: un círculo por tramo, con el costo adentro y el alcance abajo */}
          <div className="overflow-x-auto pb-2">
            <div className="relative min-w-max">
              <div aria-hidden className="absolute inset-x-12 top-9 h-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-talita-amarillo to-border" />
              <ol className="relative flex justify-between gap-6">
                {(tramos ?? Array.from({ length: 5 }, (_, i) => ({ id: i }))).map((t, i) => (
                  <li key={t.id} className="flex w-24 flex-col items-center gap-3 text-center">
                    <span
                      className={cn(
                        'flex size-18 items-center justify-center rounded-full border text-base font-semibold tabular-nums shadow-sm',
                        i === 0 ? 'border-talita-amarillo bg-talita-amarillo' : 'border-border bg-background'
                      )}
                    >
                      {tramos && montoCorto(t.monto_fijo)}
                    </span>
                    <span className="text-sm leading-tight text-muted-foreground">
                      {tramos &&
                        (t.participantes_hasta
                          ? <>hasta <span className="font-medium text-foreground">{numero(t.participantes_hasta)}</span> inscriptos</>
                          : <>más de <span className="font-medium text-foreground">{numero(t.participantes_desde)}</span></>)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {tramos && (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Table className="text-base">
                <TableHeader>
                  <TableRow className="bg-muted/60 hover:bg-muted/60">
                    <TableHead className="px-5 font-medium">Inscriptos</TableHead>
                    <TableHead className="px-5 font-medium">Costo total</TableHead>
                    <TableHead className="px-5 font-medium">Por participante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tramos.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-5 tabular-nums">{numero(t.participantes_desde)} — {t.participantes_hasta ? numero(t.participantes_hasta) : '∞'}</TableCell>
                      <TableCell className="px-5 font-semibold tabular-nums">{formatearMonto(t.monto_fijo)}</TableCell>
                      <TableCell className="px-5 tabular-nums text-muted-foreground">{rangoPorParticipante(t)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground">No hace falta que te comuniques con nosotros.</span>{' '}
        Cuando tu evento se acerca al límite de su tramo, Talita te manda por mail el link de pago del
        siguiente. Pagás solo la diferencia y las inscripciones siguen sin cortes.
      </p>
    </Seccion>
  )
}
