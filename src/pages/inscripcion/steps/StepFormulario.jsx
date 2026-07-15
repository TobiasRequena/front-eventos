import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CampoFormInput } from '@/components/eventos/CampoFormInput'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'

export default function StepFormulario({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder } = wizard
  const camposForm = evento.camposForm ?? []

  const defaultValues = {}
  camposForm.forEach((campo) => {
    if (campo.tipo === 'booleano') {
      defaultValues[campo.id] = datosWizard.respuestasForm?.[campo.id] ?? false
    } else {
      defaultValues[campo.id] = datosWizard.respuestasForm?.[campo.id] ?? ''
    }
  })

  const { control, handleSubmit } = useForm({ defaultValues })

  function onSubmit(values) {
    avanzar({ respuestasForm: values })
  }

  return (
    <InscripcionStepLayout evento={evento} titulo="Información adicional">
      <div className="space-y-4">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {camposForm.map((campo) => (
            <CampoFormInput
              key={campo.id}
              campo={campo}
              control={control}
              name={campo.id}
            />
          ))}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={retroceder} className="flex-1">
              Atrás
            </Button>
            <Button type="submit" className="flex-1">
              Continuar
            </Button>
          </div>
        </form>
      </div>
    </InscripcionStepLayout>
  )
}