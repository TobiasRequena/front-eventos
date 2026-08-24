import { Users, Heart, AlertTriangle, Accessibility, Pill, UserCheck } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'

export function ResumenKpis({ stats, onVerPagos, onVerFichas }) {
  const kpis = stats.kpisFichaMedica

  const totalCondiciones = kpis
    ? (kpis.conDiabetes + kpis.conAsma + kpis.conEpilepsia + kpis.conCardiopatia + kpis.conOtrasCondiciones)
    : 0

  const totalAlergias = kpis
    ? (kpis.conAlergias + kpis.conRestriccionesAlimentarias)
    : 0

  const totalAdaptaciones = kpis
    ? (kpis.conDiscapacidad + kpis.conRecomendaciones)
    : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard
          icon={Users}
          label="Total inscriptos"
          value={stats.totalInscriptos}
        />
        <KpiCard
          icon={UserCheck}
          label="Total acreditados"
          value={stats.cantidadAcreditados}
        />
        {stats.resumenPagos?.pendiente_aprobacion > 0 && (
          <KpiCard
            icon={AlertTriangle}
            label="Comprobantes esperando revisión"
            value={stats.resumenPagos.pendiente_aprobacion}
            onClick={onVerPagos}
            className={stats.resumenPagos?.pendiente_aprobacion ? 'sm:col-span-2' : ''}
          />
        )}
      </div>

      {kpis && kpis.total > 0 && (
        <>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Fichas médicas
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {totalCondiciones > 0 && (
              <KpiCard
                icon={Heart}
                label="Condiciones de salud"
                value={totalCondiciones}
                onClick={() => onVerFichas('condiciones')}
              />
            )}
            {totalAlergias > 0 && (
              <KpiCard
                icon={AlertTriangle}
                label="Alergias y restricciones"
                value={totalAlergias}
                onClick={() => onVerFichas('alergias')}
              />
            )}
            {totalAdaptaciones > 0 && (
              <KpiCard
                icon={Accessibility}
                label="Adaptaciones"
                value={totalAdaptaciones}
                onClick={() => onVerFichas('adaptaciones')}
              />
            )}
            {kpis.conMedicacionMenores > 0 && (
              <KpiCard
                icon={Pill}
                label="Medicación (menores)"
                value={kpis.conMedicacionMenores}
                onClick={() => onVerFichas('medicacion')}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}