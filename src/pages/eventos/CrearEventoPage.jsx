import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useAuth } from '@/contexts/AuthContext'
import { eventoSchema } from '@/lib/validators/evento.schemas'
import { crearEvento } from '@/api/eventos.api'
import { subirPortadaEvento } from '@/api/archivos.api'
import { getApiErrorMessage } from '@/api/httpClient'
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
  cbuCvu: '',
  aliasCobro: '',
  costo: 0,
  camposForm: [],
  bloquesTaller: [],
}

function armarPayload(values) {
  // Recalcular orden de camposForm según posición actual en el array
  // (el drag puede haber cambiado el orden sin actualizar el campo)
  const camposForm = values.camposForm.map((campo, index) => ({
    etiqueta: campo.etiqueta,
    tipo: campo.tipo,
    opciones: campo.tipo === 'seleccion' ? campo.opciones : undefined,
    requerido: campo.requerido,
    orden: index,
    // `multiple` no está en el contrato del back todavía, lo omitimos
    // por ahora hasta que el back lo soporte
  }))

  const bloquesTaller = values.bloquesTaller.map((bloque, bloqueIndex) => ({
    nombre: bloque.nombre,
    cantidadElegible: bloque.cantidadElegible,
    esObligatorio: bloque.esObligatorio,
    orden: bloqueIndex,
    talleres: bloque.talleres.map((taller) => ({
      nombre: taller.nombre,
      descripcion: taller.descripcion || undefined,
      inicio: taller.inicio,
      fin: taller.fin,
      capacidad: taller.capacidad || undefined,
    })),
  }))

  return {
    nombre: values.nombre,
    codigo: values.codigo,
    descripcion: values.descripcion || undefined,
    fechaInicio: values.fechaInicio,
    fechaFin: values.fechaFin,
    politicaMenor: values.politicaMenor,
    tieneGrupos: values.tieneGrupos,
    tieneTalleres: values.tieneTalleres,
    cbuCvu: values.cbuCvu || undefined,
    aliasCobro: values.aliasCobro || undefined,
    costo: values.costo,
    camposForm,
    bloquesTaller: values.tieneTalleres ? bloquesTaller : [],
  }
}

export default function CrearEventoPage() {
  const navigate = useNavigate()
  const { orgActiva } = useAuth()
  useBreadcrumb([{ label: 'Eventos', to: '/eventos' }, { label: 'Nuevo evento' }])

  const form = useForm({
    resolver: zodResolver(eventoSchema),
    defaultValues: VALORES_INICIALES,
    mode: 'onChange',
  })

  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      const payload = armarPayload(values)
      const resultado = await crearEvento(payload)
      const eventoId = resultado.evento.id

      // Subir imagen si el usuario seleccionó una
      if (imagenArchivo && orgActiva?.id) {
        try {
          await subirPortadaEvento(imagenArchivo, eventoId, orgActiva.id)
        } catch {
          // Error no bloqueante: el evento ya se creó, la imagen es opcional.
          // Avisamos pero seguimos con el flujo normal.
          toast.warning('El evento se creó, pero no pudimos subir la imagen de portada.')
        }
      }

      if (resultado.esPrimerEventoGratis) {
        toast.success('🎉 ¡Tu primer evento es gratis! Ya podés empezar a recibir inscripciones.')
      } else {
        toast.success('Evento creado correctamente.')
      }

      navigate(`/eventos/${eventoId}/detalle`)
    } catch (error) {
      const status = error?.response?.status

      if (status === 409) {
        // Código duplicado — lo marcamos directo en el campo
        form.setError('codigo', {
          type: 'manual',
          message: 'Este código ya está en uso por otro evento vigente.',
        })
        // Scroll al campo de código para que el usuario lo vea
        document.querySelector('[name="codigo"]')?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        return
      }

      toast.error(getApiErrorMessage(error, 'No pudimos crear el evento.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo evento</h1>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => navigate('/eventos')}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSubmitting ? 'Creando...' : 'Crear evento'}
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