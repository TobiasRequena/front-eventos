import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const PASO_LABELS = {
  datos_personales: 'Tus datos',
  grupo: 'Grupo',
  talleres: 'Talleres',
  formulario: 'Formulario',
  pago: 'Pago',
}

export function WizardProgress({ pasos, indexVisual }) {
  const pasosVisibles = pasos.filter((p) => p !== 'confirmacion')

  return (
    <div className="mb-6 flex items-center justify-center gap-0">
      {pasosVisibles.map((paso, index) => {
        const completado = index < indexVisual
        const activo = index === indexVisual

        return (
          <div key={paso} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
                  completado && 'border-primary bg-primary text-primary-foreground',
                  activo && 'border-primary bg-background text-primary',
                  !completado && !activo && 'border-border bg-background text-muted-foreground'
                )}
              >
                {completado ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'hidden text-xs sm:block',
                  activo ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {PASO_LABELS[paso]}
              </span>
            </div>

            {index < pasosVisibles.length - 1 && (
              <div
                className={cn(
                  'mx-2 mb-4 h-0.5 w-8 sm:w-12',
                  index < indexVisual ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}