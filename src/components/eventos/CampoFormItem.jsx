import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Controller, useFormContext } from 'react-hook-form'
import { GripVertical, ChevronDown, Trash2, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TIPOS_CAMPO_FORM } from '@/lib/constants/tiposCampoForm'

function OpcionesEditor({ opciones, onChange }) {
  const [nuevaOpcion, setNuevaOpcion] = useState('')

  function agregarOpcion() {
    const valor = nuevaOpcion.trim()
    if (!valor) return
    onChange([...opciones, valor])
    setNuevaOpcion('')
  }

  function quitarOpcion(index) {
    onChange(opciones.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Opciones</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {opciones.map((opcion, index) => (
          <span
            key={`${opcion}-${index}`}
            className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
          >
            {opcion}
            <button type="button" onClick={() => quitarOpcion(index)}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </span>
        ))}
        {opciones.length === 0 && (
          <span className="text-xs text-muted-foreground">Todavía no agregaste opciones.</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={nuevaOpcion}
          onChange={(e) => setNuevaOpcion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              agregarOpcion()
            }
          }}
          placeholder="Ej. S, M, L"
          className="h-8 text-sm"
        />
        <button
          type="button"
          onClick={agregarOpcion}
          className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-input px-2.5 text-xs hover:bg-accent"
        >
          <Plus className="h-3.5 w-3.5" />
          Opción
        </button>
      </div>
    </div>
  )
}

export function CampoFormItem({ id, index, onEliminar }) {
  const form = useFormContext()
  const [expandido, setExpandido] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const tipo = form.watch(`camposForm.${index}.tipo`)
  const etiqueta = form.watch(`camposForm.${index}.etiqueta`)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border border-border bg-card',
        isDragging && 'opacity-50'
      )}
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
          onClick={() => setExpandido((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="flex-1 truncate text-sm">
            {etiqueta || <span className="text-muted-foreground">Campo sin nombre</span>}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {TIPOS_CAMPO_FORM.find((t) => t.value === tipo)?.label}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              expandido && 'rotate-180'
            )}
          />
        </button>

        <button type="button" onClick={onEliminar} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expandido && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Etiqueta
              </label>
              <Input
                {...form.register(`camposForm.${index}.etiqueta`)}
                placeholder="Ej. Talla de remera"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Tipo
              </label>
              <Controller
                control={form.control}
                name={`camposForm.${index}.tipo`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CAMPO_FORM.map((opcion) => (
                        <SelectItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {tipo === 'seleccion' && (
            <>
              <Controller
                control={form.control}
                name={`camposForm.${index}.opciones`}
                render={({ field }) => (
                  <OpcionesEditor opciones={field.value ?? []} onChange={field.onChange} />
                )}
              />
              <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">
                  Permitir elegir más de una opción
                </span>
                <Controller
                  control={form.control}
                  name={`camposForm.${index}.multiple`}
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Campo obligatorio</span>
            <Controller
              control={form.control}
              name={`camposForm.${index}.requerido`}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </div>
      )}
    </div>
  )
}