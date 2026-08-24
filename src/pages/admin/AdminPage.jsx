import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { getAdminStats } from '@/api/admin.api'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Bar, BarChart, CartesianGrid, XAxis, Line, LineChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Users, Building2, CalendarRange, UserCheck, DollarSign, Loader2, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function generarOpcionesMes() {
  const opciones = []
  const hoy = new Date()
  for (let anio = hoy.getFullYear(); anio >= hoy.getFullYear() - 1; anio--) {
    for (let mes = 11; mes >= 0; mes--) {
      if (anio === hoy.getFullYear() && mes > hoy.getMonth()) continue
      opciones.push({
        value: `${anio}-${String(mes + 1).padStart(2, '0')}`,
        label: `${MESES[mes]} ${anio}`,
      })
    }
  }
  return opciones
}

function mesADesdeHasta(mesStr) {
  const [anio, mes] = mesStr.split('-').map(Number)
  const desde = new Date(anio, mes - 1, 1).toISOString().split('T')[0]
  const hasta = new Date(anio, mes, 0).toISOString().split('T')[0]
  return { desde, hasta }
}

const OPCIONES_MES = generarOpcionesMes()
const MES_ACTUAL = OPCIONES_MES[0].value

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

export default function AdminPage() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mesSeleccionado, setMesSeleccionado] = useState(MES_ACTUAL)

  useBreadcrumb([{ label: 'Panel Admin' }])

  useEffect(() => {
    if (!usuario) return
    if (!usuario.es_super_admin) { navigate('/dashboard'); return }
    cargar(mesSeleccionado)
  }, [usuario, mesSeleccionado])

  async function cargar(mes) {
    const { desde, hasta } = mesADesdeHasta(mes ?? mesSeleccionado)
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
            <Select value={mesSeleccionado} onValueChange={setMesSeleccionado}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {OPCIONES_MES.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => cargar(mesSeleccionado)}
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
        </>
      )}
    </div>
  )
}