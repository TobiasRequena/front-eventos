import { useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/DateTimePicker'

export function TallerEnBloqueItem({ bloqueIndex, tallerIndex, onEliminar }) {
  const form = useFormContext()
  const base = `bloquesTaller.${bloqueIndex}.talleres.${tallerIndex}`

  const errores = form.formState.errors.bloquesTaller?.[bloqueIndex]?.talleres?.[tallerIndex]

  // Valores necesarios para la validación cruzada con las fechas del evento
  const inicioTaller = form.watch(`${base}.inicio`)
  const finTaller = form.watch(`${base}.fin`)
  const fechaInicioEvento = form.watch('fechaInicio')
  const fechaFinEvento = form.watch('fechaFin')

  // El superRefine del eventoSchema no propaga automáticamente a arrays anidados
  // antes del primer submit. Forzamos el trigger explícitamente.
  useEffect(() => {
    if (inicioTaller) form.trigger(`${base}.inicio`)
    if (finTaller) form.trigger(`${base}.fin`)
  }, [inicioTaller, finTaller, fechaInicioEvento, fechaFinEvento])


  return (
    <div className="space-y-3 rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Taller {tallerIndex + 1}
        </span>
        <button
          type="button"
          onClick={onEliminar}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Nombre
          </label>
          <Input
            {...form.register(`${base}.nombre`)}
            placeholder="Ej. Oratoria"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Capacidad
          </label>
          <Input
            type="number"
            min="1"
            {...form.register(`${base}.capacidad`, { valueAsNumber: true })}
            placeholder="Opcional"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Descripción (opcional)
        </label>
        <Textarea
          {...form.register(`${base}.descripcion`)}
          placeholder="De qué se trata este taller"
          rows={2}
          className="text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Inicio</label>
          <Controller
            control={form.control}
            name={`${base}.inicio`}
            render={({ field }) => (
              <DateTimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fin</label>
          <Controller
            control={form.control}
            name={`${base}.fin`}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                rangoDesde={form.watch(`${base}.inicio`)}
              />
            )}
          />
        </div>
      </div>

      {errores && (
        <div className="space-y-0.5">
          {errores.nombre?.message && (
            <p className="text-xs text-destructive">{errores.nombre.message}</p>
          )}
          {errores.inicio?.message && (
            <p className="text-xs text-destructive">{errores.inicio.message}</p>
          )}
          {errores.fin?.message && (
            <p className="text-xs text-destructive">{errores.fin.message}</p>
          )}
          {errores.capacidad?.message && (
            <p className="text-xs text-destructive">{errores.capacidad.message}</p>
          )}
        </div>
      )}
    </div>
  )
}