import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { crearAgrupacion, patchAgrupacion, getNombresPresets } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'

function toTitleCase(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, (c) => c)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .normalize('NFC')
}

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
  universoBase: z.enum(['inscriptos', 'acreditados']),
  modoTamano: z.enum(['por_cantidad', 'por_tamano']),
  valorTamano: z.number().min(1).int(),
  mantenerGruposInscripcion: z.boolean().default(false),
  nombresPreset: z.string().default('colores'),
  nombresLista: z.array(z.string()).default([]),
  accionSinNombres: z.enum(['reciclar_numerado', 'bloquear_generacion']).default('reciclar_numerado'),
})

export function PasoConfiguracion({ evento, agrupacion, onCreada, onActualizada, onSiguiente }) {
  const [presets, setPresets] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')

  const esEdicion = !!agrupacion
  const esBorrador = !agrupacion || agrupacion.estado === 'borrador'

  useEffect(() => {
    getNombresPresets(evento.id).then(setPresets).catch(() => { })
  }, [evento.id])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: agrupacion ? {
      nombre: agrupacion.nombre,
      universoBase: agrupacion.universo_base,
      modoTamano: agrupacion.modo_tamano,
      valorTamano: agrupacion.valor_tamano,
      mantenerGruposInscripcion: agrupacion.mantener_grupos_inscripcion ?? false,
      nombresPreset: agrupacion.nombres_preset ?? 'colores',
      nombresLista: agrupacion.nombres_lista ?? [],
      accionSinNombres: agrupacion.accion_sin_nombres ?? 'reciclar_numerado',
    } : {
      nombre: '',
      universoBase: 'inscriptos',
      modoTamano: 'por_cantidad',
      valorTamano: 5,
      mantenerGruposInscripcion: false,
      nombresPreset: 'colores',
      nombresLista: [],
      accionSinNombres: 'reciclar_numerado',
    },
  })

  const nombresPreset = form.watch('nombresPreset')
  const nombresLista = form.watch('nombresLista')
  const mantenerGrupos = form.watch('mantenerGruposInscripcion')

  function agregarNombre() {
    const valor = toTitleCase(nuevoNombre.trim())
    if (!valor) return
    const lista = form.getValues('nombresLista')
    if (lista.includes(valor)) {
      toast.error('Ese nombre ya está en la lista.')
      return
    }
    form.setValue('nombresLista', [...lista, valor])
    setNuevoNombre('')
  }

  function quitarNombre(index) {
    const lista = form.getValues('nombresLista')
    form.setValue('nombresLista', lista.filter((_, i) => i !== index))
  }

  async function onSubmit(values) {
    if (!esBorrador) { onSiguiente(); return }
    if (values.nombresPreset === 'custom' && values.nombresLista.length === 0) {
      toast.error('Agregá al menos un nombre personalizado.')
      return
    }
    setGuardando(true)
    try {
      const payload = {
        nombre: values.nombre,
        universoBase: values.universoBase,
        modoTamano: values.modoTamano,
        valorTamano: values.valorTamano,
        mantenerGruposInscripcion: values.mantenerGruposInscripcion,
        nombresPreset: values.nombresPreset,
        nombresLista: values.nombresPreset === 'custom' ? values.nombresLista : [],
        accionSinNombres: values.accionSinNombres,
      }
      if (esEdicion) {
        const actualizada = await patchAgrupacion(evento.id, agrupacion.id, payload)
        onActualizada(actualizada)
        toast.success('Agrupación actualizada.')
      } else {
        const nueva = await crearAgrupacion(evento.id, payload)
        onCreada(nueva)
        toast.success('Agrupación creada.')
      }
      onSiguiente()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos guardar la agrupación.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {!esBorrador && (
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            La agrupación ya fue generada. La configuración no se puede editar — regenerá para aplicar cambios.
          </div>
        )}

        {/* Datos básicos */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Datos básicos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la agrupación</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Grupos por edad" disabled={!esBorrador} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="universoBase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Universo base</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="inscriptos">Todos los inscriptos</SelectItem>
                      <SelectItem value="acreditados">Solo acreditados</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tamaño */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Tamaño de grupos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="modoTamano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="por_cantidad">Por cantidad de grupos</SelectItem>
                      <SelectItem value="por_tamano">Por cantidad de integrantes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valorTamano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {form.watch('modoTamano') === 'por_cantidad' ? 'Cantidad de grupos' : 'Personas por grupo'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      disabled={!esBorrador}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Grupos de inscripción */}
        {evento.tiene_grupos && (
          <Card>
            <CardContent >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mantener grupos de inscripción</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Los participantes que se inscribieron juntos quedarán en el mismo grupo de trabajo.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="mantenerGruposInscripcion"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!esBorrador}
                    />
                  )}
                />
              </div>
              {mantenerGrupos && (
                <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Los participantes sin grupo de inscripción se distribuirán aleatoriamente entre los grupos de trabajo.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Nombrado */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Nombrado de grupos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nombresPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lista de nombres</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {presets.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.key.charAt(0).toUpperCase() + p.key.slice(1)} ({p.valores.slice(0, 3).join(', ')}...)
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {nombresPreset !== 'custom' && presets.find((p) => p.key === nombresPreset) && (
              <div className="flex flex-wrap gap-1.5">
                {presets.find((p) => p.key === nombresPreset)?.valores.slice(0, 8).map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                ))}
                <Badge variant="outline" className="text-xs">...</Badge>
              </div>
            )}

            {nombresPreset === 'custom' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ej. Equipo Norte"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarNombre())}
                    disabled={!esBorrador}
                  />
                  <Button type="button" variant="outline" onClick={agregarNombre} disabled={!esBorrador || !nuevoNombre.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {nombresLista.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {nombresLista.map((nombre, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {nombre}
                        {esBorrador && (
                          <button type="button" onClick={() => quitarNombre(i)} className="ml-1 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Agregá al menos un nombre.</p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="accionSinNombres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuando se agotan los nombres</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="reciclar_numerado">Reciclar con número (Rojo 2, Azul 2...)</SelectItem>
                      <SelectItem value="bloquear_generacion">Bloquear si no alcanzan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={guardando} className="gap-2">
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {guardando ? 'Guardando...' : esBorrador ? (esEdicion ? 'Guardar y continuar' : 'Crear agrupación') : 'Siguiente'}
          </Button>
        </div>
      </form>
    </Form>
  )
}