import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { getAdminStats } from '@/api/admin.api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Users, Building2, CalendarRange, UserCheck, DollarSign, Loader2, RefreshCw, CalendarIcon, Heart, MessageSquare } from 'lucide-react'

function inicioMesActual() {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
}

const RANGO_INICIAL = { from: inicioMesActual(), to: new Date() }

function formatearFechaCorta(fechaIso) {
  if (!fechaIso) return ''
  const [anio, mes, dia] = fechaIso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(anio, mes - 1, dia))
}

const chartConfigBarra = { valor: { label: 'Cantidad', color: 'var(--primary)' } }
const chartConfigLinea = { valor: { label: 'Revenue', color: 'var(--primary)' } }

function GraficoBarra({ titulo, datos }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigBarra} className="h-48 w-full">
          <BarChart data={datos}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="fecha" tickFormatter={formatearFechaCorta} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={formatearFechaCorta} />} />
            <Bar dataKey="valor" fill="var(--color-valor)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function GraficoLinea({ titulo, datos }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent>
        <ChartContainer config={chartConfigLinea} className="h-48 w-full">
          <LineChart data={datos}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="fecha" tickFormatter={formatearFechaCorta} tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={formatearFechaCorta} />} />
            <Line type="monotone" dataKey="valor" stroke="var(--color-valor)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

// Me gusta de las funciones y buzón de sugerencias de la landing
function StatsLanding({ landing }) {
  const maximo = landing.topFunciones[0]?.votos ?? 0
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icon={Heart} label="Me gusta en funciones" value={landing.totalMeGusta.toLocaleString('es-AR')} />
        <KpiCard icon={MessageSquare} label="Sugerencias nuevas" value={landing.sugerencias.nuevas.toLocaleString('es-AR')} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Top 5 funciones con más me gusta</CardTitle></CardHeader>
          <CardContent>
            {landing.topFunciones.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía nadie marcó me gusta.</p>
            ) : (
              <ol className="space-y-4">
                {landing.topFunciones.map((f, i) => (
                  <li key={f.funcion} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{i + 1}. {f.funcion}</span>
                      <span className="tabular-nums text-muted-foreground">{f.votos.toLocaleString('es-AR')}</span>
                    </div>
                    <Progress value={(f.votos / maximo) * 100} />
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Últimas sugerencias del buzón</CardTitle></CardHeader>
          <CardContent>
            {landing.sugerencias.ultimas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no llegaron sugerencias.</p>
            ) : (
              <ul className="divide-y divide-border">
                {landing.sugerencias.ultimas.map((s) => (
                  <li key={s.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="whitespace-pre-wrap break-words text-sm">{s.texto}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(s.creado_en), "d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default function AdminPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rango, setRango] = useState(RANGO_INICIAL)

  useBreadcrumb([{ label: 'Panel Admin' }])

  useEffect(() => {
    if (!usuario) return
    if (!usuario.es_super_admin) { navigate('/dashboard'); return }
    if (!rango?.from || !rango?.to) return
    cargar(rango)
  }, [usuario, rango])

  async function cargar(r) {
    const rangoActual = r ?? rango
    const desde = format(rangoActual.from, 'yyyy-MM-dd')
    const hasta = format(rangoActual.to, 'yyyy-MM-dd')
    setIsLoading(true)
    try {
      const data = await getAdminStats({ desde, hasta })
      setStats(data)
    } catch {
      toast.error('No pudimos cargar las estadísticas.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!usuario?.es_super_admin) return null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Panel Admin</h1>
          <p className="text-sm text-muted-foreground">Estadísticas globales de la plataforma.</p>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-60 justify-start text-left font-normal">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  {rango?.from && rango?.to
                    ? `${format(rango.from, 'd MMM yyyy', { locale: es })} - ${format(rango.to, 'd MMM yyyy', { locale: es })}`
                    : 'Elegí un período'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={rango}
                  onSelect={setRango}
                  disabled={{ after: new Date() }}
                  locale={es}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cargar(rango)}
            disabled={isLoading}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
          </div>
        </div>
      ) : stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Users}
              label="Usuarios"
              value={stats.usuarios.total.toLocaleString('es-AR')}
              variacion={stats.usuarios.variacion}
              sublabel={`${stats.usuarios.nuevos} ${stats.usuarios.nuevos === 1 ? 'nuevo' : 'nuevos'}`}
            />
            <KpiCard
              icon={Building2}
              label="Organizaciones"
              value={stats.organizaciones.total.toLocaleString('es-AR')}
              variacion={stats.organizaciones.variacion}
              sublabel={`${stats.organizaciones.nuevos} ${stats.organizaciones.nuevos === 1 ? 'nueva' : 'nuevas'}`}
            />
            <KpiCard
              icon={CalendarRange}
              label="Eventos activos"
              value={stats.eventos.activos.toLocaleString('es-AR')}
              variacion={stats.eventos.variacion}
              sublabel={`${stats.eventos.nuevos} ${stats.eventos.nuevos === 1 ? 'nuevo' : 'nuevos'}`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard icon={UserCheck} label="Inscriptos" value={stats.inscriptos.total.toLocaleString('es-AR')} variacion={stats.inscriptos.variacion} />
            <KpiCard icon={DollarSign} label="Revenue total" value={`$${stats.revenue.total.toLocaleString('es-AR')}`} variacion={stats.revenue.variacion} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <GraficoBarra titulo="Usuarios nuevos" datos={stats.usuarios.evolucion} />
            <GraficoBarra titulo="Organizaciones nuevas" datos={stats.organizaciones.evolucion} />
            <GraficoBarra titulo="Inscriptos" datos={stats.inscriptos.evolucion} />
            <GraficoLinea titulo="Revenue" datos={stats.revenue.evolucion} />
          </div>
          {stats.landing && <StatsLanding landing={stats.landing} />}
        </>
      )}
    </div>
  )
}