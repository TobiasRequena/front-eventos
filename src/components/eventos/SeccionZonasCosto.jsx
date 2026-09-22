import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function ZonasCostoCampos() {
  const form = useFormContext()

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'zonasCosto',
  })

  const errores = form.formState.errors.zonasCosto

  function agregarZona() {
    append({ nombre: '', costo: '' })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Zonas de costo</p>
        <p className="text-xs text-muted-foreground">
          Cada participante elige su zona al inscribirse y paga el costo correspondiente.
        </p>
      </div>
      {fields.length === 0 && (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste zonas de costo.
        </div>
      )}

      {typeof errores?.message === 'string' && (
        <p className="text-sm text-destructive">{errores.message}</p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 rounded-lg border border-border p-3">
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Nombre
                </label>
                <Input
                  {...form.register(`zonasCosto.${index}.nombre`)}
                  placeholder='Ej. "Zona 1 (hasta 80km)"'
                  className="h-9 text-sm"
                />
                {errores?.[index]?.nombre && (
                  <p className="mt-1 text-xs text-destructive">{errores[index].nombre.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Costo
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  {...form.register(`zonasCosto.${index}.costo`, { valueAsNumber: true })}
                  className="h-9 text-sm"
                />
                {errores?.[index]?.costo && (
                  <p className="mt-1 text-xs text-destructive">{errores[index].costo.message}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={agregarZona}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:bg-accent/50"
      >
        <Plus className="h-4 w-4" />
        Agregar zona
      </button>
    </div>
  )
}
