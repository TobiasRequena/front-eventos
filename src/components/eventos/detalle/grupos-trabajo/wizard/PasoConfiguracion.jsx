import { useEffect, useState } from 'react'
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { crearEsquema, patchEsquema, getNombresPresets } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { HelpTooltip } from '../../../../ui/help-tooltip'

const ATRIBUTOS_FIJOS = [
  { value: 'edad', label: 'Edad' },
  { value: 'es_mayor', label: 'Es mayor de edad' },
  { value: 'grupo_inscripcion', label: 'Grupo de inscripción' },
  { value: 'rol_grupo', label: 'Rol en grupo' },
  { value: 'estado_pago', label: 'Estado de pago' },
  { value: 'taller', label: 'Taller' },
]

const OPERADORES = [
  { value: 'igual', label: 'Igual a' },
  { value: 'distinto', label: 'Distinto de' },
  { value: 'mayor_que', label: 'Mayor que' },
  { value: 'menor_que', label: 'Menor que' },
  { value: 'contiene', label: 'Contiene' },
  { value: 'entre', label: 'Entre' },
]

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(100),
  universoBase: z.enum(['inscriptos', 'acreditados']),
  usaTandas: z.boolean().default(false),
  criterioTandaCampo: z.string().optional(),
  criterioTandaOrigen: z.enum(['fijo', 'campo_form']).optional(),
  criterioTandaCampoFormId: z.string().optional(),
  modoTamano: z.enum(['por_cantidad', 'por_tamano']),
  valorTamano: z.number().min(1).int(),
  usaBalanceo: z.boolean().default(false),
  balanceoCampo: z.string().optional(),
  balanceoOrigen: z.enum(['fijo', 'campo_form']).optional(),
  balanceoCampoFormId: z.string().optional(),
  modoNombrado: z.enum(['por_grupo', 'por_tanda']),
  nombresPreset: z.string().default('colores'),
  nombresLista: z.array(z.string()).default([]),
  accionSinNombres: z.enum(['reciclar_numerado', 'bloquear_generacion']).default('reciclar_numerado'),
  filtroElegibilidad: z.array(z.object({
    atributoOrigen: z.enum(['fijo', 'campo_form']),
    atributoCampo: z.string().optional(),
    atributoCampoFormId: z.string().optional(),
    operador: z.string(),
    valor: z.union([z.string(), z.number()]).optional(),
    valor2: z.union([z.string(), z.number()]).optional(),
  })).default([]),
})

function AtributoSelector({ value, onChange, camposForm, label }) {
  const [origen, campo, campoFormId] = value ? [value.origen, value.campo, value.campo_form_id] : ['fijo', '', '']

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        value={origen}
        onValueChange={(v) => onChange({ origen: v, campo: '', campo_form_id: '' })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Origen" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fijo">Campo fijo</SelectItem>
          <SelectItem value="campo_form">Campo del formulario</SelectItem>
        </SelectContent>
      </Select>

      {origen === 'fijo' ? (
        <Select
          value={campo}
          onValueChange={(v) => onChange({ origen: 'fijo', campo: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Campo" />
          </SelectTrigger>
          <SelectContent>
            {ATRIBUTOS_FIJOS.map((a) => (
              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select
          value={campoFormId}
          onValueChange={(v) => onChange({ origen: 'campo_form', campo_form_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Campo del formulario" />
          </SelectTrigger>
          <SelectContent>
            {camposForm.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.etiqueta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}

function FiltroElegibilidadItem({ index, control, camposForm, onEliminar }) {
  const operador = useWatch({ control, name: `filtroElegibilidad.${index}.operador` })
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Filtro {index + 1}</p>
        <button type="button" onClick={onEliminar} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Controller
          control={control}
          name={`filtroElegibilidad.${index}.atributoOrigen`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fijo">Campo fijo</SelectItem>
                <SelectItem value="campo_form">Campo formulario</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          control={control}
          name={`filtroElegibilidad.${index}.atributoCampo`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
              <SelectContent>
                {ATRIBUTOS_FIJOS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className={`grid gap-2 ${operador === 'entre' ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <Controller
          control={control}
          name={`filtroElegibilidad.${index}.operador`}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue placeholder="Operador" /></SelectTrigger>
              <SelectContent>
                {OPERADORES.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          control={control}
          name={`filtroElegibilidad.${index}.valor`}
          render={({ field }) => (
            <Input placeholder="Valor" {...field} />
          )}
        />
        {operador === 'entre' && (
          <Controller
            control={control}
            name={`filtroElegibilidad.${index}.valor2`}
            render={({ field }) => (
              <Input placeholder="Valor 2" {...field} />
            )}
          />
        )}
      </div>
    </div>
  )
}

export function PasoConfiguracion({ evento, esquema, onCreado, onActualizado, onSiguiente }) {
  const [presets, setPresets] = useState([])
  const [guardando, setGuardando] = useState(false)
  const esEdicion = !!esquema
  const esBorrador = !esquema || esquema.estado === 'borrador'

  useEffect(() => {
    getNombresPresets(evento.id).then(setPresets).catch(() => { })
  }, [evento.id])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: esquema ? {
      nombre: esquema.nombre,
      universoBase: esquema.universo_base,
      usaTandas: !!esquema.criterio_tanda_atributo,
      modoTamano: esquema.modo_tamano,
      valorTamano: esquema.valor_tamano,
      usaBalanceo: !!esquema.balanceo_atributo,
      modoNombrado: esquema.modo_nombrado,
      nombresPreset: esquema.nombres_preset ?? 'colores',
      nombresLista: esquema.nombres_lista ?? [],
      accionSinNombres: esquema.accion_sin_nombres ?? 'reciclar_numerado',
      filtroElegibilidad: (esquema.filtro_elegibilidad ?? []).map((f) => ({
        atributoOrigen: f.atributo.origen,
        atributoCampo: f.atributo.campo ?? '',
        atributoCampoFormId: f.atributo.campo_form_id ?? '',
        operador: f.operador,
        valor: f.valor ?? '',
        valor2: f.valor2 ?? '',
      })),
    } : {
      nombre: '',
      universoBase: 'inscriptos',
      usaTandas: false,
      modoTamano: 'por_cantidad',
      valorTamano: 5,
      usaBalanceo: false,
      modoNombrado: 'por_grupo',
      nombresPreset: 'colores',
      nombresLista: [],
      accionSinNombres: 'reciclar_numerado',
      filtroElegibilidad: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'filtroElegibilidad',
  })

  const usaTandas = form.watch('usaTandas')
  const nombresPreset = form.watch('nombresPreset')
  const modoNombrado = form.watch('modoNombrado')

  function armarPayload(values) {
    const payload = {
      nombre: values.nombre,
      universoBase: values.universoBase,
      modoTamano: values.modoTamano,
      valorTamano: values.valorTamano,
      modoNombrado: values.usaTandas ? values.modoNombrado : 'por_grupo',
      nombresPreset: values.nombresPreset,
      nombresLista: values.nombresLista,
      accionSinNombres: values.accionSinNombres,
    }

    if (values.usaTandas && values.criterioTandaCampo) {
      payload.criterioTandaAtributo = values.criterioTandaOrigen === 'fijo'
        ? { origen: 'fijo', campo: values.criterioTandaCampo }
        : { origen: 'campo_form', campo_form_id: values.criterioTandaCampoFormId }
    }

    if (values.usaBalanceo && values.balanceoCampo) {
      payload.balanceoAtributo = values.balanceoOrigen === 'fijo'
        ? { origen: 'fijo', campo: values.balanceoCampo }
        : { origen: 'campo_form', campo_form_id: values.balanceoCampoFormId }
    }

    if (values.filtroElegibilidad.length > 0) {
      payload.filtroElegibilidad = values.filtroElegibilidad
        .filter((f) => f.atributoCampo || f.atributoCampoFormId)
        .map((f) => ({
          atributo: f.atributoOrigen === 'fijo'
            ? { origen: 'fijo', campo: f.atributoCampo }
            : { origen: 'campo_form', campo_form_id: f.atributoCampoFormId },
          operador: f.operador,
          valor: f.valor,
          ...(f.valor2 ? { valor2: f.valor2 } : {}),
        }))
    }

    return payload
  }

  async function onSubmit(values) {
    if (!esBorrador) {
      onSiguiente()
      return
    }

    setGuardando(true)
    try {
      const payload = armarPayload(values)
      if (esEdicion) {
        const actualizado = await patchEsquema(evento.id, esquema.id, payload)
        onActualizado(actualizado)
        toast.success('Esquema actualizado.')
        onSiguiente()
      } else {
        const nuevo = await crearEsquema(evento.id, payload)
        onCreado(nuevo)
        toast.success('Esquema creado.')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos guardar el esquema.'))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {!esBorrador && (
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            El esquema ya fue generado. La configuración no se puede editar — regenerá para aplicar cambios.
          </div>
        )}

        {/* Nombre */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Datos básicos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del esquema</FormLabel>
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
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
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="por_tamano">Por cantidad de integrantes</SelectItem>
                      <SelectItem value="por_cantidad">Por cantidad de grupos</SelectItem>
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
                    {form.watch('modoTamano') === 'por_cantidad'
                      ? 'Cantidad de grupos'
                      : 'Personas por grupo'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      disabled={!esBorrador}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Tandas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm">Criterio de tandas</CardTitle>
                <HelpTooltip>
                  Atributo por el que se separan las tandas. Las condiciones de cada tanda se configuran en el paso siguiente.
                </HelpTooltip>
              </div>
              <FormField
                control={form.control}
                name="usaTandas"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Usar tandas</Label>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!esBorrador}
                      className="h-4 w-4"
                    />
                  </div>
                )}
              />
            </div>
          </CardHeader>
          {usaTandas && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="criterioTandaOrigen"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                      <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fijo">Campo fijo</SelectItem>
                        <SelectItem value="campo_form">Campo formulario</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.watch('criterioTandaOrigen') === 'campo_form' ? (
                  <FormField
                    control={form.control}
                    name="criterioTandaCampoFormId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                        <SelectTrigger><SelectValue placeholder="Campo del formulario" /></SelectTrigger>
                        <SelectContent>
                          {(evento.camposForm ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.etiqueta}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="criterioTandaCampo"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                        <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                        <SelectContent>
                          {ATRIBUTOS_FIJOS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Balanceo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm">Balanceo secundario</CardTitle>
                <HelpTooltip>
                  Distribuye los participantes para que cada grupo tenga la mayor mezcla posible de valores distintos del atributo elegido.
                </HelpTooltip>
              </div>
              <FormField
                control={form.control}
                name="usaBalanceo"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Usar balanceo</Label>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={!esBorrador}
                      className="h-4 w-4"
                    />
                  </div>
                )}
              />
            </div>
          </CardHeader>
          {/* // Criterio de tanda — cuando origen es campo_form */}
          {form.watch('usaBalanceo') && (
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="balanceoOrigen"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                      <SelectTrigger><SelectValue placeholder="Origen" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fijo">Campo fijo</SelectItem>
                        <SelectItem value="campo_form">Campo formulario</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.watch('balanceoOrigen') === 'campo_form' ? (
                  <FormField
                    control={form.control}
                    name="balanceoCampoFormId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                        <SelectTrigger><SelectValue placeholder="Campo del formulario" /></SelectTrigger>
                        <SelectContent>
                          {(evento.camposForm ?? []).map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.etiqueta}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="balanceoCampo"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                        <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                        <SelectContent>
                          {ATRIBUTOS_FIJOS.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Nombrado */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Nombrado de grupos</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {usaTandas && (
              <FormField
                control={form.control}
                name="modoNombrado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modo de nombrado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="por_grupo">Por grupo (Rojo, Azul, Verde...)</SelectItem>
                        <SelectItem value="por_tanda">Por tanda (Jóvenes 1, Jóvenes 2...)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="nombresPreset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lista de nombres</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
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

            <FormField
              control={form.control}
              name="accionSinNombres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuando se agotan los nombres</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!esBorrador}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="reciclar_numerado">Reciclar con número (Rojo 2, Azul 2...)</SelectItem>
                      <SelectItem value="bloquear_generacion">Bloquear generación si no alcanzan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Filtro de elegibilidad */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm">Filtro de elegibilidad</CardTitle>
                <HelpTooltip>
                  Solo participarán en la generación quienes cumplan todas las condiciones. El resto quedará como "excluido por sistema".
                </HelpTooltip>
              </div>
              {esBorrador && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => append({
                    atributoOrigen: 'fijo',
                    atributoCampo: '',
                    operador: 'igual',
                    valor: '',
                  })}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar filtro
                </Button>
              )}
            </div>
          </CardHeader>
          {fields.length > 0 && (
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <FiltroElegibilidadItem
                  key={field.id}
                  index={index}
                  control={form.control}
                  camposForm={evento.camposForm ?? []}
                  onEliminar={() => remove(index)}
                />
              ))}
            </CardContent>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          {esBorrador ? (
            <Button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : esEdicion ? 'Guardar y continuar' : 'Crear esquema'}
            </Button>
          ) : (
            <Button type="button" onClick={onSiguiente}>
              Siguiente
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}