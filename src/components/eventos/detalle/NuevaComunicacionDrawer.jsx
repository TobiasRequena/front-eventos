import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Paperclip, Trash2 } from 'lucide-react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { enviarComunicacion } from '@/api/comunicaciones.api'

const schema = z.object({
  asunto: z.string().min(1, 'El asunto es obligatorio.').max(200),
  mensaje: z.string().min(1, 'El mensaje es obligatorio.').max(5000),
  destinatarios: z.enum(['inscriptos', 'acreditados']),
})

export function NuevaComunicacionDrawer({ open, onClose, evento, onEnviado }) {
  const [adjuntos, setAdjuntos] = useState([])
  const [filtros, setFiltros] = useState([])
  const [enviando, setEnviando] = useState(false)

  const camposForm = evento.camposForm ?? []

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      asunto: '',
      mensaje: '',
      destinatarios: 'inscriptos',
    },
  })

  function handleAdjuntos(e) {
    const archivos = Array.from(e.target.files)
    const nuevos = [...adjuntos, ...archivos].slice(0, 5)
    setAdjuntos(nuevos)
  }

  function quitarAdjunto(index) {
    setAdjuntos((prev) => prev.filter((_, i) => i !== index))
  }

  function getCampoFiltro(campoFormId) {
    return camposForm.find((campo) => campo.id === campoFormId)
  }

  function agregarFiltro() {
    const camposDisponibles = camposForm.filter(
      (campo) => !filtros.some((filtro) => filtro.campo_form_id === campo.id)
    )

    if (camposDisponibles.length === 0) return

    setFiltros((prev) => [
      ...prev,
      {
        campo_form_id: camposDisponibles[0].id,
        valor: '',
      },
    ])
  }

  function quitarFiltro(index) {
    setFiltros((prev) => prev.filter((_, i) => i !== index))
  }

  function actualizarFiltro(index, key, value) {
    setFiltros((prev) => prev.map((f, i) => i === index ? { ...f, [key]: value } : f))
  }

  async function onSubmit(values) {
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append('asunto', values.asunto)
      formData.append('mensaje', values.mensaje)
      formData.append('destinatarios', values.destinatarios)
      if (filtros.length > 0) {
        formData.append('filtros', JSON.stringify(filtros.filter(f => f.valor)))
      }
      adjuntos.forEach((archivo) => formData.append('adjuntos', archivo))

      const data = await enviarComunicacion(evento.id, formData)
      toast.success(`Comunicación enviada a ${data.totalDestinatarios} destinatarios.`)
      form.reset()
      setAdjuntos([])
      setFiltros([])
      onEnviado?.()
      onClose()
    } catch {
      toast.error('No pudimos enviar la comunicación.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={() => { }} direction="right">
      <DrawerContent
        onInteractOutside={(e) => e.preventDefault()}
        className="h-full w-full sm:w-[50vw] sm:right-0 sm:left-auto overflow-y-auto overflow-x-hidden p-6 fixed inset-y-0 flex flex-col"
      >
        <DrawerHeader className="px-0 py-2">
          <div className="flex items-center justify-between">
            <DrawerTitle>Nueva comunicación</DrawerTitle>

            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DrawerHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-3 space-y-5 flex flex-col flex-1">
          {/* Asunto */}
          <div className="space-y-1.5">
            <Label>Asunto</Label>
            <Input
              {...form.register('asunto')}
              placeholder="Ej. Recordatorio del evento"
            />
            {form.formState.errors.asunto && (
              <p className="text-xs text-destructive">{form.formState.errors.asunto.message}</p>
            )}
          </div>

          {/* Destinatarios */}
          <div className="space-y-1.5">
            <Label>Destinatarios</Label>
            <Controller
              control={form.control}
              name="destinatarios"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inscriptos">Todos los inscriptos</SelectItem>
                    <SelectItem value="acreditados">Solo acreditados</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Filtros */}
          {camposForm.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filtros por campo</Label>
                {filtros.length < camposForm.length && (
                  <button
                    type="button"
                    onClick={agregarFiltro}
                    className="text-xs text-primary underline-offset-4 hover:underline cursor-pointer"
                  >
                    + Agregar filtro
                  </button>
                )}
              </div>
              {filtros.map((filtro, index) => {
                const campoSeleccionado = getCampoFiltro(filtro.campo_form_id)

                const camposDisponibles = camposForm.filter(
                  (campo) =>
                    campo.id === filtro.campo_form_id ||
                    !filtros.some(
                      (otroFiltro, otroIndex) =>
                        otroIndex !== index &&
                        otroFiltro.campo_form_id === campo.id
                    )
                )

                return (
                  <div key={index} className="flex items-center gap-2">
                    {/* Campo */}
                    <Select
                      value={filtro.campo_form_id}
                      onValueChange={(v) => {
                        actualizarFiltro(index, 'campo_form_id', v)
                        actualizarFiltro(index, 'valor', '')
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {camposDisponibles.map((campo) => (
                          <SelectItem key={campo.id} value={campo.id}>
                            {campo.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Valor */}
                    {campoSeleccionado?.tipo === 'seleccion' &&
                      campoSeleccionado.opciones?.length > 0 ? (
                      <Select
                        value={filtro.valor}
                        onValueChange={(v) =>
                          actualizarFiltro(index, 'valor', v)
                        }
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccioná un valor" />
                        </SelectTrigger>

                        <SelectContent>
                          {campoSeleccionado.opciones.map((opcion) => (
                            <SelectItem key={opcion} value={opcion}>
                              {opcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        placeholder="Valor"
                        value={filtro.valor}
                        onChange={(e) =>
                          actualizarFiltro(index, 'valor', e.target.value)
                        }
                        className="flex-1"
                      />
                    )}

                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => quitarFiltro(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Mensaje */}
          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea
              {...form.register('mensaje')}
              placeholder="Escribí el mensaje para los destinatarios..."
              rows={6}
            />
            {form.formState.errors.mensaje && (
              <p className="text-xs text-destructive">{form.formState.errors.mensaje.message}</p>
            )}
          </div>

          {/* Adjuntos */}
          <div className="space-y-2">
            <Label>Adjuntos (hasta 5)</Label>
            {adjuntos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {adjuntos.map((archivo, i) => (
                  <Badge key={i} variant="secondary" className="gap-1.5 pr-1">
                    <Paperclip className="h-3 w-3" />
                    {archivo.name}
                    <button
                      type="button"
                      onClick={() => quitarAdjunto(i)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {adjuntos.length < 5 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors">
                <Paperclip className="h-4 w-4" />
                Adjuntar archivos (PDF o imagen)
                <input
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={handleAdjuntos}
                />
              </label>
            )}
          </div>
          <DrawerFooter className="mt-auto px-0">
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={enviando}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                className="flex-1"
                disabled={enviando}
              >
                {enviando ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}