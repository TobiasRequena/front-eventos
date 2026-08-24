import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function Variacion({ valor }) {
  if (valor === null || valor === undefined) return null

  const esCrecimiento = valor > 0
  const esBaja = valor < 0
  const sinCambio = valor === 0

  return (
    <div className={cn(
      'flex items-center gap-0.5 text-xs font-medium',
      esCrecimiento && 'text-green-600',
      esBaja && 'text-red-500',
      sinCambio && 'text-muted-foreground',
    )}>
      {esCrecimiento && <TrendingUp className="h-3 w-3" />}
      {esBaja && <TrendingDown className="h-3 w-3" />}
      {`${Math.abs(valor).toFixed(1)}%`}
    </div>
  )
}

export function KpiCard({ icon: Icon, label, value, variacion, className, onClick }) {
  return (
    <Card
      className={cn(className, onClick && 'cursor-pointer hover:bg-accent/50 transition-colors')}
      onClick={onClick}
    >
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">
              {value}
            </p>
            <Variacion valor={variacion} />
          </div>
          <p className="mt-1 truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}