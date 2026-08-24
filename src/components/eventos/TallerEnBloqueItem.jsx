import { useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { Trash2, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export function TallerEnBloqueItem({ bloqueIndex, tallerIndex, totalTallersEnBloque, onEliminar, fieldArrayName = 'bloquesTaller' }) {
  const form = useFormContext()
  const base = `${fieldArrayName}.${bloqueIndex}.talleres.${tallerIndex}`
  const errores = form.formState.errors[fieldArrayName]?.[bloqueIndex]?.talleres?.[tallerIndex]
  const esInformativo = totalTallersEnBloque === 1
  const nombre = form.watch(`${base}.nombre`)
  const [abierto, setAbierto] = useState(true)

  return (
    <div className="rounded-md border border-border bg-background">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <span className="text-xs font-medium text-muted-foreground">
          {nombre || `Taller ${tallerIndex + 1}`}
          {esInformativo && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Informativo
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEliminar() }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', abierto && 'rotate-180')} />
        </div>
      </button>

      {abierto && (
        <div className="space-y-3 border-t border-border p-3">
          <div className={esInformativo ? '' : 'grid gap-3 sm:grid-cols-[1fr_110px]'}>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre</label>
              <Controller
                control={form.control}
                name={`${base}.nombre`}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="Ej. Oratoria"
                    className="h-9 text-sm"
                  />
                )}
              />
            </div>
            {!esInformativo && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Capacidad</label>
                <Controller
                  control={form.control}
                  name={`${base}.capacidad`}
                  render={({ field }) => (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Opcional"
                      className="h-9 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  )}
                />
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Descripción (opcional)</label>
            <Controller
              control={form.control}
              name={`${base}.descripcion`}
              render={({ field }) => (
                <Textarea
                  {...field}
                  placeholder="De qué se trata este taller"
                  rows={2}
                  className="text-sm"
                />
              )}
            />
          </div>
          {errores && (
            <div className="space-y-0.5">
              {errores.nombre?.message && <p className="text-xs text-destructive">{errores.nombre.message}</p>}
              {errores.capacidad?.message && <p className="text-xs text-destructive">{errores.capacidad.message}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}