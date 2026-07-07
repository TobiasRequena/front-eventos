import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SeccionDatosEvento } from '@/components/eventos/SeccionDatosEvento'
import { editarEventoSchema } from '@/lib/validators/evento.schemas'
import { patchEvento } from '@/api/eventos.api'
import { subirPortadaEvento } from '@/api/archivos.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { useAuth } from '@/contexts/AuthContext'

function adaptarEventoAForm(evento) {
  return {
    nombre: evento.nombre ?? '',
    codigo: evento.codigo ?? '',
    descripcion: evento.descripcion ?? '',
    fechaInicio: evento.fecha_inicio ?? '',
    fechaFin: evento.fecha_fin ?? '',
    politicaMenor: evento.politica_menor ?? 'no_aplica',
    tieneGrupos: evento.tiene_grupos ?? false,
    tieneTalleres: evento.tiene_talleres ?? false,
    cbuCvu: evento.cbu_cvu ?? '',
    aliasCobro: evento.alias_cobro ?? '',
    costo: parseFloat(evento.costo ?? 0),
  }
}

export function EditarEventoPanel({ evento, onVolver, onGuardado }) {
  const { orgActiva } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagenArchivo, setImagenArchivo] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(
    evento.imagen_url ?? evento.imagenUrl ?? null
  )

  const form = useForm({
    resolver: zodResolver(editarEventoSchema),
    defaultValues: adaptarEventoAForm(evento),
  })

  function handleCambiarImagen(file) {
    if (!file) return
    setImagenArchivo(file)
    setImagenPreview(URL.createObjectURL(file))
  }

  function handleQuitarImagen() {
    setImagenArchivo(null)
    if (imagenPreview && imagenPreview !== (evento.imagen_url ?? evento.imagenUrl)) {
      URL.revokeObjectURL(imagenPreview)
    }
    setImagenPreview(null)
  }

  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      const eventoActualizado = await patchEvento(evento.id, {
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
      })

      if (imagenArchivo && orgActiva?.id) {
        try {
          await subirPortadaEvento(imagenArchivo, evento.id, orgActiva.id)
        } catch {
          toast.warning('El evento se actualizó, pero no pudimos subir la imagen de portada.')
        }
      }

      toast.success('Evento actualizado correctamente.')
      onGuardado(eventoActualizado)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No pudimos actualizar el evento.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...form}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onVolver}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al detalle
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Editar evento
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onVolver}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SeccionDatosEvento
              imagenPreview={imagenPreview}
              onCambiarImagen={handleCambiarImagen}
              onQuitarImagen={handleQuitarImagen}
              codigoOriginal={evento.codigo}
            />
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Preview disponible en el creador de evento. Acá mostramos solo los datos básicos.
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}