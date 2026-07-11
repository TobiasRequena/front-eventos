import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { InscripcionLayout } from '@/components/inscripcion/InscripcionLayout'
import { WizardProgress } from '@/components/inscripcion/WizardProgress'
import { useInscripcionWizard } from '@/hooks/useInscripcionWizard'
import { getEventoPorCodigo } from '@/api/inscripcion.api'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarX2 } from 'lucide-react'
import StepDatosPersonales from '@/pages/inscripcion/steps/StepDatosPersonales'
import StepGrupo from '@/pages/inscripcion/steps/StepGrupo'
import StepTalleres from '@/pages/inscripcion/steps/StepTalleres'
import StepFormulario from '@/pages/inscripcion/steps/StepFormulario'
import StepPago from '@/pages/inscripcion/steps/StepPago'
import StepConfirmacion from '@/pages/inscripcion/steps/StepConfirmacion'

function InscripcionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

function EventoNoEncontrado() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CalendarX2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
      <p className="text-base font-medium text-foreground">Evento no encontrado</p>
      <p className="mt-1 text-sm text-muted-foreground">
        El link de inscripción no es válido o el evento ya no está disponible.
      </p>
    </div>
  )
}

const STEP_COMPONENTS = {
  datos_personales: StepDatosPersonales,
  grupo: StepGrupo,
  talleres: StepTalleres,
  formulario: StepFormulario,
  pago: StepPago,
  confirmacion: StepConfirmacion,
}

export default function InscripcionPage() {
  const { codigoEvento } = useParams()
  const [searchParams] = useSearchParams()
  const codigoGrupo = searchParams.get('grupo')

  const [evento, setEvento] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    if (!codigoEvento) return
    setStatus('loading')
    getEventoPorCodigo(codigoEvento)
      .then((data) => {
        setEvento(data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [codigoEvento])

  const wizard = useInscripcionWizard(evento ?? {}, codigoGrupo)

  if (status === 'loading') {
    return (
      <div className="min-h-svh bg-muted/40 p-8">
        <div className="mx-auto max-w-2xl">
          <InscripcionSkeleton />
        </div>
      </div>
    )
  }

  if (status === 'error' || !evento) {
    return (
      <div className="min-h-svh bg-muted/40 p-8">
        <div className="mx-auto max-w-2xl">
          <EventoNoEncontrado />
        </div>
      </div>
    )
  }

  const StepComponent = STEP_COMPONENTS[wizard.pasoActual]

  return (
    <InscripcionLayout evento={evento}>
      {wizard.pasoActual !== 'confirmacion' && (
        <WizardProgress
          pasos={wizard.pasos}
          indexVisual={wizard.indexVisual}
        />
      )}

      {StepComponent && (
        <StepComponent
          evento={evento}
          wizard={wizard}
          codigoGrupoInicial={codigoGrupo}
        />
      )}
    </InscripcionLayout>
  )
}