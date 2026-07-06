import { Users, BarChart3 } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'

export function ResumenKpis({ stats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <KpiCard
        icon={Users}
        label="Total inscriptos"
        value={stats.totalInscriptos}
      />
      <KpiCard
        icon={BarChart3}
        label="Talleres con cupo"
        value={stats.bloquesTaller.flatMap((b) => b.talleres).filter((t) => t.capacidad).length}
      />
    </div>
  )
}