import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Trash2, GripVertical, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DateTimePicker } from '@/components/DateTimePicker'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'

export function TallerSueltoItem({ id, index, numeroTaller, onEliminar, fieldArrayName = 'seccionTalleres' }) {
  const form = useFormContext()
  const base = `${fieldArrayName}.${index}`
  const errores = form.formState.errors[fieldArrayName]?.[index]
  const inicioTaller = form.watch(`${base}.inicio`)
  const finTaller = form.watch(`${base}.fin`)
  const fechaInicioEvento = form.watch('fechaInicio')
  const fechaFinEvento = form.watch('fechaFin')

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const nombre = form.watch(`${base}.nombre`)
  const [abierto, setAbierto] = useState(true)

  useEffect(() => {
    form.trigger(`${base}.inicio`)
    form.trigger(`${base}.fin`)
  }, [inicioTaller, finTaller, fechaInicioEvento, fechaFinEvento])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('rounded-lg border border-border bg-card', isDragging && 'opacity-50')}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/50 active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-sm font-medium text-foreground">
            {nombre || `Taller ${numeroTaller}`}
          </span>
          <span className="text-xs text-muted-foreground">Taller suelto</span>
        </button>
        <button
          type="button"
          onClick={onEliminar}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="text-muted-foreground"
        >
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', abierto && 'rotate-180')}
          />
        </button>
      </div>
      {abierto && (
        <div className="space-y-3 border-t border-border bg-muted/70 p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_110px] ">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/75">Nombre</label>
              <Input
                {...form.register(`${base}.nombre`)}
                placeholder="Ej. Charla de apertura"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/75">Capacidad</label>
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
            <label className="mb-1.5 block text-xs font-medium text-foreground/75">
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
              <label className="mb-1.5 block text-xs font-medium text-foreground/75">Inicio</label>
              <Controller
                control={form.control}
                name={`${base}.inicio`}
                render={({ field }) => (
                  <DateTimePicker value={field.value} onChange={field.onChange} />
                )}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/75">Fin</label>
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

          <label className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-xs font-medium text-foreground/75">Obligatorio</p>
              <p className="text-xs text-foreground/50">
                Los participantes son anotados automáticamente.
              </p>
            </div>
            <Controller
              control={form.control}
              name={`${base}.esObligatorio`}
              render={({ field }) => (
                <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
              )}
            />
          </label>

          {errores && (
            <div className="space-y-0.5">
              {errores.nombre?.message && (
                <p className="text-sm font-medium text-destructive">{errores.nombre.message}</p>
              )}
              {errores?.inicio?.message &&
                <p className="text-sm font-medium text-destructive">
                  {errores.inicio.message}
                </p>
              }
              {errores?.fin?.message &&
                <p className="text-sm font-medium text-destructive">
                  {errores.fin.message}
                </p>
              }

            </div>
          )}
        </div>
      )}
    </div>
  )
}