import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth,
  isToday, startOfMonth, startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getEventosLanding, getOrganizacionesLanding } from '@/api/landing.api'
import { Seccion, Resaltado } from '../Seccion'

const POR_PAGINA = 5
const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const iniciales = (nombre) =>
  nombre.split(/\s+/).filter((p) => p.length > 2 || /^\d+$/.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || nombre[0].toUpperCase()

function LogoOrg({ org, className }) {
  if (org.logo_url) {
    return <img src={org.logo_url} alt="" loading="lazy" className={cn('shrink-0 rounded-full bg-background object-contain', className)} />
  }
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-foreground font-semibold text-background', className)}>
      {iniciales(org.nombre)}
    </span>
  )
}

function Calendario({ eventos, mes, setMes, tick }) {
  const dias = eachDayOfInterval({
    start: startOfWeek(startOfMonth(mes), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(mes), { weekStartsOn: 1 }),
  })

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMes(addMonths(mes, -1))} aria-label="Mes anterior">
          <ChevronLeft />
        </Button>
        <p className="text-lg font-semibold capitalize">{format(mes, 'MMMM yyyy', { locale: es })}</p>
        <Button variant="ghost" size="icon" onClick={() => setMes(addMonths(mes, 1))} aria-label="Mes siguiente">
          <ChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS.map((d, i) => <span key={i} className="pb-2 text-xs font-medium text-muted-foreground">{d}</span>)}
        {dias.map((dia) => {
          const delDia = eventos.filter((e) => isSameDay(e.fecha, dia))
          // Si hay más de un evento el mismo día, se turnan
          const evento = delDia[tick % delDia.length]
          return (
            <div
              key={dia.toISOString()}
              className={cn(
                'flex aspect-square min-w-0 flex-col items-center gap-0.5 rounded-md p-0.5 text-sm tabular-nums',
                !isSameMonth(dia, mes) && 'text-muted-foreground/40',
                isToday(dia) && 'font-semibold ring-1 ring-foreground/40',
                evento && 'bg-talita-amarillo/25'
              )}
              title={delDia.map((e) => e.nombre).join(' · ') || undefined}
            >
              <span>{format(dia, 'd')}</span>
              {evento && (
                <>
                  <LogoOrg org={evento.org} className="size-5 text-[8px]" />
                  <span className="line-clamp-1 w-full text-[10px] leading-tight text-foreground/80">{evento.nombre}</span>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Logos({ organizaciones }) {
  // Si son pocas entran quietas; si son muchas se deslizan en loop (lista duplicada)
  const desliza = organizaciones.length > 5
  const lista = desliza ? [...organizaciones, ...organizaciones] : organizaciones
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <ul className={cn('flex w-max gap-12', desliza ? 'animate-marquee hover:[animation-play-state:paused] motion-reduce:animate-none' : 'mx-auto')}>
        {lista.map((o, i) => (
          <li key={i} aria-hidden={i >= organizaciones.length} className="flex w-28 flex-col items-center gap-2 text-center opacity-70">
            <LogoOrg org={o} className="size-14 text-base" />
            <span className="text-sm leading-tight text-muted-foreground">{o.nombre}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProximosEventos() {
  const [mes, setMes] = useState(() => startOfMonth(new Date()))
  const [pagina, setPagina] = useState(0)
  const [tick, setTick] = useState(0)

  const [eventos, setEventos] = useState(null)
  const [organizaciones, setOrganizaciones] = useState([])
  const [error, setError] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    getEventosLanding()
      .then((lista) => setEventos(lista.map((e) => ({ ...e, fecha: new Date(e.fecha_inicio) }))))
      .catch(() => setError(true))
    getOrganizacionesLanding().then(setOrganizaciones).catch(() => {})
  }, [])

  // Los que ya empezaron pero siguen abiertos (duran varios días) también cuentan como próximos
  const proximos = eventos ?? []
  const visibles = proximos.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA)
  const hayMas = (pagina + 1) * POR_PAGINA < proximos.length

  return (
    <Seccion id="proximos-eventos" numero={4} titulo={<>Próximos <Resaltado>eventos</Resaltado> !</>}>
      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[1fr_1.15fr]">
        <Calendario eventos={proximos} mes={mes} setMes={setMes} tick={tick} />

        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {!eventos && !error &&
              Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <Skeleton className="size-11" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </li>
              ))}
            {error && <li className="p-6 text-muted-foreground">No pudimos cargar los eventos. Probá de nuevo en un rato.</li>}
            {eventos && visibles.length === 0 && (
              <li className="p-6 text-muted-foreground">Todavía no hay eventos publicados.</li>
            )}
            {visibles.map((e) => (
              <li key={e.codigo + e.fecha_inicio} className="flex items-center gap-4 px-5 py-4">
                <div className="flex w-11 shrink-0 flex-col items-center leading-none">
                  <span className="text-2xl font-bold tabular-nums">{format(e.fecha, 'd')}</span>
                  <span className="mt-1 text-xs font-medium uppercase text-talita-rojo">{format(e.fecha, 'MMM', { locale: es })}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{e.nombre}</p>
                  <p className="truncate text-sm text-muted-foreground">{e.org.nombre}</p>
                </div>
                <Button asChild variant="outline" className="h-9 shrink-0 px-3">
                  <Link to={`/inscribirse/${e.codigo}`}>
                    Inscribirme <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
          {/* Siempre en su lugar: se deshabilitan en vez de aparecer y desaparecer */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
              Anteriores
            </Button>
            <Button variant="outline" disabled={!hayMas} onClick={() => setPagina((p) => p + 1)}>
              Ver más
            </Button>
          </div>
        </div>
      </div>

      {/* Se muestra si alguna ya creó un evento; si ninguna lo hizo, recién cuando son 3 */}
      {(organizaciones.some((o) => o.tiene_eventos) || organizaciones.length >= 3) && (
        <div className="flex flex-col gap-8 border-t border-border pt-12">
          <h3 className="text-center text-2xl font-semibold tracking-tight">Gracias por elegirnos</h3>
          <Logos organizaciones={organizaciones} />
        </div>
      )}
    </Seccion>
  )
}
