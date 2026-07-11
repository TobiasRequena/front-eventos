import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CampoFormInput } from '@/components/eventos/CampoFormInput'

export default function StepFormulario({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder } = wizard
  const camposForm = evento.camposForm ?? []

  const defaultValues = {}
  camposForm.forEach((campo) => {
    defaultValues[campo.id] = datosWizard.respuestasForm?.[campo.id] ?? ''
  })

  const { control, handleSubmit } = useForm({ defaultValues })

  function onSubmit(values) {
    avanzar({ respuestasForm: values })
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Información adicional
        </p>

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
      </CardContent>
    </Card>
  )
}