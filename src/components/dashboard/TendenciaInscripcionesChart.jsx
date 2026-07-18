import { useMemo, useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getEstadisticasInscripciones } from '@/api/eventos.api'
import { Loader2 } from 'lucide-react'

const RANGOS = {
  '7d': { dias: 7, label: 'Últimos 7 días' },
  '14d': { dias: 14, label: 'Últimos 14 días' },
  '30d': { dias: 30, label: 'Últimos 30 días' },
}

const chartConfig = {
  inscripciones: {
    label: 'Inscripciones',
    color: 'var(--primary)',
  },
}

function formatearFechaCorta(fechaIso) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(
    new Date(fechaIso)
  )
}

export function TendenciaInscripcionesChart({ className }) {
  const [rango, setRango] = useState('7d')
  const [datos, setDatos] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getEstadisticasInscripciones(rango)
      .then((data) => setDatos(data.datos))
      .catch(() => setDatos([]))
      .finally(() => setIsLoading(false))
  }, [rango])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-base">Tendencia de inscripciones</CardTitle>
        <Select value={rango} onValueChange={setRango}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RANGOS).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={datos}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="fecha"
                tickFormatter={formatearFechaCorta}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={formatearFechaCorta} />}
              />
              <Bar dataKey="inscripciones" fill="var(--color-inscripciones)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}