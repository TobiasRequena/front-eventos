import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { eventoSchema } from '@/lib/validators/evento.schemas'
import { Button } from '@/components/ui/button'
import { SeccionDatosEvento } from '@/components/eventos/SeccionDatosEvento'
import { SeccionFormularioInscripcion } from '@/components/eventos/SeccionFormularioInscripcion'
import { SeccionTalleres } from '@/components/eventos/SeccionTalleres'
import { EventoPreviewPanel } from '@/components/eventos/EventoPreviewPanel'

const VALORES_INICIALES = {
  nombre: '',
  codigo: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  politicaMenor: 'no_aplica',
  tieneGrupos: false,
  tieneTalleres: false,
  modoTaller: 'ninguno',
  cbuCvu: '',
  aliasCobro: '',
  costo: 0,
  camposForm: [],
  talleres: [],
}

export default function CrearEventoPage() {
  const navigate = useNavigate()
  useBreadcrumb([{ label: 'Eventos', to: '/eventos' }, { label: 'Nuevo evento' }])

  const form = useForm({
    resolver: zodResolver(eventoSchema),
    defaultValues: VALORES_INICIALES,
    mode: 'onChange',
  })

  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  function handleCambiarImagen(file) {
    if (!file) return
    setImagenArchivo(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  function handleQuitarImagen() {
    setImagenArchivo(null)
    if (imagenPreview) URL.revokeObjectURL(imagenPreview)
    setImagenPreview(null)
  }

  function onSubmit(values) {
    console.log('TODO: crear evento con', values, 'imagen:', imagenArchivo)
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo evento</h1>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/eventos')}>
              Cancelar
            </Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)}>
              Crear evento
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <SeccionDatosEvento
              imagenPreview={imagenPreview}
              onCambiarImagen={handleCambiarImagen}
              onQuitarImagen={handleQuitarImagen}
            />
            <SeccionFormularioInscripcion />
            <SeccionTalleres />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <EventoPreviewPanel imagenPreview={imagenPreview} />
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}