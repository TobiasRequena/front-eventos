import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { CampoFormInput } from '@/components/eventos/CampoFormInput'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'

function buildSchema(camposForm) {
  const shape = {}
  camposForm.forEach((campo) => {
    if (campo.tipo === 'booleano') {
      shape[campo.id] = z.boolean()
    } else if (campo.requerido) {
      shape[campo.id] = z.string().min(1, `${campo.etiqueta} es obligatorio.`)
    } else {
      shape[campo.id] = z.string().optional()
    }
  })
  return z.object(shape)
}

export default function StepFormulario({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder, esUltimoPasoVisible } = wizard
  const camposForm = evento.camposForm ?? []

  const defaultValues = {}
  camposForm.forEach((campo) => {
    defaultValues[campo.id] = campo.tipo === 'booleano'
      ? (datosWizard.respuestasForm?.[campo.id] ?? false)
      : (datosWizard.respuestasForm?.[campo.id] ?? '')
  })

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(buildSchema(camposForm)),
    defaultValues,
  })

  function onSubmit(values) {
    avanzar({ respuestasForm: values })
  }

  return (
    <InscripcionStepLayout evento={evento} titulo="Información adicional">
      <div className="space-y-4">
        <form
          onSubmit={handleSubmit(
            onSubmit,
            () => toast.error('Completá los campos obligatorios antes de continuar.')
          )}
          className="space-y-4"
        >
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
              {esUltimoPasoVisible ? 'Enviar inscripción' : 'Continuar'}
            </Button>
          </div>
        </form>
      </div>
    </InscripcionStepLayout>
  )
}