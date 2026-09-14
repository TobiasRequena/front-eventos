import { Users, Heart, AlertTriangle, Accessibility, Pill, UserCheck, CheckCircle2 } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Card, CardContent } from '@/components/ui/card'

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
          {totalCondiciones === 0 && totalAlergias === 0 && totalAdaptaciones === 0 && kpis.conMedicacionMenores === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Sin novedades médicas</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ningún participante reportó condiciones, alergias, adaptaciones ni medicación.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </>
      )}
    </div>
  )
}