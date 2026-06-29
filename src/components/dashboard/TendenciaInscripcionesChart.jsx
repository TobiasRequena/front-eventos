import { useMemo, useState } from 'react'
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
import { generarTendenciaMock } from '@/lib/mocks/tendenciaInscripciones.mock'

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

  const datos = useMemo(() => generarTendenciaMock(RANGOS[rango].dias), [rango])

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
      </CardContent>
    </Card>
  )
}