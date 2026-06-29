import { Controller, useFormContext } from 'react-hook-form'
import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/DateTimePicker'

export function TallerItem({ index, onEliminar }) {
  const form = useFormContext()

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Taller {index + 1}</span>
        <button type="button" onClick={onEliminar} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre</label>
          <Input
            {...form.register(`talleres.${index}.nombre`)}
            placeholder="Ej. Taller de liderazgo"
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
            {...form.register(`talleres.${index}.capacidad`, { valueAsNumber: true })}
            placeholder="30"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Descripción (opcional)
        </label>
        <Textarea
          {...form.register(`talleres.${index}.descripcion`)}
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
            name={`talleres.${index}.inicio`}
            render={({ field }) => (
              <DateTimePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Fin</label>
          <Controller
            control={form.control}
            name={`talleres.${index}.fin`}
            render={({ field }) => (
              <DateTimePicker
                value={field.value}
                onChange={field.onChange}
                rangoDesde={form.watch(`talleres.${index}.inicio`)}
              />
            )}
          />
        </div>
      </div>

      {form.formState.errors.talleres?.[index] && (
        <p className="text-xs text-destructive">
          {form.formState.errors.talleres[index]?.inicio?.message ||
            form.formState.errors.talleres[index]?.fin?.message ||
            form.formState.errors.talleres[index]?.nombre?.message ||
            form.formState.errors.talleres[index]?.capacidad?.message}
        </p>
      )}
    </div>
  )
}