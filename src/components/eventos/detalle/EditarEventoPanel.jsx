import { useEffect, useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { SeccionDatosEvento } from '@/components/eventos/SeccionDatosEvento'
import { editarEventoSchema } from '@/lib/validators/evento.schemas'
import { recortarDescripcion } from '@/lib/descripcionFormato'
import { patchEvento } from '@/api/eventos.api'
import { crearZonaCosto, editarZonaCosto, eliminarZonaCosto } from '@/api/zonasCosto.api'
import { guardarPlanesPago } from '@/api/planesPago.api'
import { planApiAForm, planFormAApi } from '@/lib/costoEvento'
import { listarCamposForm, editarCampoForm } from '@/api/camposForm.api'
import { subirPortadaEvento } from '@/api/archivos.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { useAuth } from '@/contexts/AuthContext'
import { EventoPreviewPanel } from '@/components/eventos/EventoPreviewPanel'
import { SeccionCamposFormEdicion } from '@/components/eventos/detalle/SeccionCamposFormEdicion'

/**
 * Compara las zonas del form contra las zonas originales del evento y
 * dispara solo los POST/PATCH/DELETE necesarios, todos juntos (un único
 * batch al hacer submit, no una request por campo tocado).
 */
async function sincronizarZonasCosto(eventoId, zonasForm, zonasOriginales) {
  const originalesPorId = new Map(zonasOriginales.map((z) => [z.id, z]))
  const idsEnForm = new Set(zonasForm.filter((z) => z.id).map((z) => z.id))

  const llamadas = []

  for (const zona of zonasForm) {
    if (!zona.id) {
      llamadas.push(crearZonaCosto(eventoId, { nombre: zona.nombre, costo: zona.costo }))
      continue
    }
    const original = originalesPorId.get(zona.id)
    if (original && (original.nombre !== zona.nombre || parseFloat(original.costo) !== zona.costo)) {
      llamadas.push(editarZonaCosto(eventoId, zona.id, { nombre: zona.nombre, costo: zona.costo }))
    }
  }

  for (const original of zonasOriginales) {
    if (!idsEnForm.has(original.id)) {
      llamadas.push(eliminarZonaCosto(eventoId, original.id))
    }
  }

  await Promise.all(llamadas)
}

/**
 * Igual que las zonas: compara contra los campos originales y manda un PATCH
 * por campo solo con lo que cambió (etiqueta, opciones, multiple o activo).
 */
async function sincronizarCamposForm(eventoId, camposForm, originales) {
  const llamadas = []

  for (const campo of camposForm) {
    const original = originales.get(campo.id)
    if (!original) continue

    const cambios = {}
    if (campo.etiqueta !== original.etiqueta) cambios.etiqueta = campo.etiqueta
    if (campo.activo !== original.activo) cambios.activo = campo.activo
    if (campo.tipo === 'seleccion' && campo.multiple !== original.multiple) cambios.multiple = campo.multiple
    if (campo.opciones && JSON.stringify(campo.opciones) !== JSON.stringify(original.opciones ?? [])) {
      cambios.opciones = campo.opciones
    }
    if (Object.keys(cambios).length > 0) {
      llamadas.push(editarCampoForm(eventoId, campo.id, cambios))
    }
  }

  await Promise.all(llamadas)
}

function adaptarCampoAForm(campo) {
  return {
    id: campo.id,
    tipo: campo.tipo,
    etiqueta: campo.etiqueta,
    opciones: campo.tipo === 'seleccion' ? [...(campo.opciones ?? [])] : null,
    activo: campo.activo ?? true,
    multiple: campo.multiple ?? false,
    requerido: campo.requerido ?? false, // solo para mostrar, no se edita
  }
}

function adaptarEventoAForm(evento) {
  return {
    nombre: evento.nombre ?? '',
    codigo: evento.codigo ?? '',
    descripcion: evento.descripcion ?? '',
    fechaInicio: evento.fecha_inicio ?? '',
    fechaFin: evento.fecha_fin ?? '',
    politicaMenor: evento.politica_menor ?? 'no_aplica',
    cupoMaximo: evento.cupo_maximo ?? null,
    tieneGrupos: evento.tiene_grupos ?? false,
    tieneTalleres: evento.tiene_talleres ?? false,
    tienePrecioPorZona: evento.tiene_precio_por_zona ?? false,
    cbuCvu: evento.cbu_cvu ?? '',
    aliasCobro: evento.alias_cobro ?? '',
    costo: parseFloat(evento.costo ?? 0),
    configFichaMedica: evento.config_ficha_medica ?? 'no',
    configCertificado: evento.config_certificado ?? 'no',
    requiereAutorizacionMenores: evento.requiere_autorizacion_menores ?? false,
    solicitaContactoEmergencia: evento.solicita_contacto_emergencia ?? false,
    mostrarEnLanding: evento.mostrar_en_landing ?? false,
    autorizacionTemplateUrl: evento.autorizacion_template_url ?? null,
    zonasCosto: (evento.zonasCosto ?? []).map((z) => ({
      id: z.id,
      nombre: z.nombre,
      costo: parseFloat(z.costo),
    })),
    planesPago: (evento.planesPago ?? []).map(planApiAForm),
    aceptaCuotas: (evento.planesPago ?? []).length > 0,
    seccionTalleres: [
      ...(evento.bloquesTaller ?? []).map((b) => ({ tipo: 'bloque', ...b })),
      ...(evento.talleresSueltos ?? []).map((t) => ({ tipo: 'taller_suelto', ...t })),
    ],
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
    defaultValues: {
      ...adaptarEventoAForm(evento),
      camposForm: (evento.camposForm ?? []).map(adaptarCampoAForm),
    },
  })

  // Los activos ya vienen en evento.camposForm, así que la sección se muestra al toque.
  // Los dados de baja (para poder reactivarlos) se piden aparte y se agregan al final.
  const [camposOriginales, setCamposOriginales] = useState(
    () => new Map((evento.camposForm ?? []).map((c) => [c.id, adaptarCampoAForm(c)]))
  )
  useEffect(() => {
    let cancelado = false
    listarCamposForm(evento.id, { incluirInactivos: true })
      .then((campos) => {
        const inactivos = campos.filter((c) => c.activo === false).map(adaptarCampoAForm)
        if (cancelado || inactivos.length === 0) return
        form.setValue('camposForm', [...form.getValues('camposForm'), ...inactivos])
        setCamposOriginales((prev) => new Map([...prev, ...inactivos.map((c) => [c.id, c])]))
      })
      .catch(() => {}) // sin los inactivos solo se pierde la opción de reactivar
    return () => {
      cancelado = true
    }
  }, [evento.id, form])

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
        descripcion: recortarDescripcion(values.descripcion) || undefined,
        fechaInicio: values.fechaInicio,
        fechaFin: values.fechaFin,
        politicaMenor: values.politicaMenor,
        tieneGrupos: values.tieneGrupos,
        tieneTalleres: values.tieneTalleres,
        tienePrecioPorZona: values.tienePrecioPorZona,
        cupoMaximo: values.cupoMaximo ?? null,
        cbuCvu: values.cbuCvu || undefined,
        aliasCobro: values.aliasCobro || undefined,
        costo: values.costo,
        configFichaMedica: values.configFichaMedica,
        configCertificado: values.configCertificado,
        requiereAutorizacionMenores: values.requiereAutorizacionMenores,
        solicitaContactoEmergencia: values.solicitaContactoEmergencia,
        mostrarEnLanding: values.mostrarEnLanding,
        autorizacionTemplateUrl: values.autorizacionTemplateUrl,
      })

      if (imagenArchivo && orgActiva?.id) {
        try {
          await subirPortadaEvento(imagenArchivo, evento.id, orgActiva.id)
        } catch {
          toast.warning('El evento se actualizó, pero no pudimos subir la imagen de portada.')
        }
      }

      if (values.tienePrecioPorZona) {
        try {
          await sincronizarZonasCosto(evento.id, values.zonasCosto, evento.zonasCosto ?? [])
        } catch {
          toast.warning('El evento se actualizó, pero no pudimos guardar todos los cambios de zonas.')
        }
      }

      // Solo si cambiaron: guardar reemplaza los planes (y sus ids) del evento
      const planesNuevos = values.aceptaCuotas ? values.planesPago.map(planFormAApi) : []
      const planesOriginales = (evento.planesPago ?? []).map((p) => planFormAApi(planApiAForm(p)))
      if (JSON.stringify(planesNuevos) !== JSON.stringify(planesOriginales)) {
        try {
          await guardarPlanesPago(evento.id, planesNuevos)
        } catch (error) {
          toast.warning(getApiErrorMessage(error, 'El evento se actualizó, pero no pudimos guardar los planes de pago.'))
        }
      }

      try {
        await sincronizarCamposForm(evento.id, values.camposForm, camposOriginales)
      } catch (error) {
        toast.warning(getApiErrorMessage(error, 'El evento se actualizó, pero no pudimos guardar todos los cambios del formulario.'))
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
              onClick={form.handleSubmit(onSubmit, (errors) => {
                const campos = Object.keys(errors)
                if (campos.length === 1) {
                  const primerError = Object.values(errors)[0]
                  toast.error(primerError?.message ?? 'Hay un error en el formulario.')
                } else {
                  toast.error(`Hay ${campos.length} campos con errores. Revisá el formulario antes de continuar.`)
                }
              })}
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
              eventoId={evento.id}
            />
            <div className="mt-6">
              <SeccionCamposFormEdicion originales={camposOriginales} />
            </div>
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