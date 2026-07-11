import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { GripVertical, ChevronDown, MoreVertical, Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TallerEnBloqueItem } from '@/components/eventos/TallerEnBloqueItem'

function BadgeModoBloque({ cantidadTalleres, cantidadElegible, esObligatorio }) {
  if (cantidadTalleres <= 1) {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        Informativo
      </span>
    )
  }

  const texto = esObligatorio
    ? `Elegí exactamente ${cantidadElegible}`
    : `Elegí hasta ${cantidadElegible}`

  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
      {texto}
    </span>
  )
}

export function BloqueTallerCard({ id, index, onEliminar, onEditar }) {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(true)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `bloquesTaller.${index}.talleres`,
  })

  const nombre = form.watch(`bloquesTaller.${index}.nombre`)
  const cantidadElegible = form.watch(`bloquesTaller.${index}.cantidadElegible`)
  const esObligatorio = form.watch(`bloquesTaller.${index}.esObligatorio`)

  const errorTalleres = form.formState.errors.bloquesTaller?.[index]?.talleres?.root

  function agregarTaller() {
    append({ nombre: '', descripcion: '', inicio: '', fin: '', capacidad: undefined })
  }

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
          onClick={() => setAbierto((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="font-medium text-sm text-foreground">
            {nombre || 'Bloque sin nombre'}
          </span>
          <BadgeModoBloque
            cantidadTalleres={fields.length}
            cantidadElegible={cantidadElegible}
            esObligatorio={esObligatorio}
          />
          <span className="text-xs text-muted-foreground">
            {fields.length} {fields.length === 1 ? 'taller' : 'talleres'}
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEditar}>
              <Pencil className="h-4 w-4" />
              Editar bloque
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEliminar} className="text-destructive focus:text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar bloque
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button type="button" onClick={() => setAbierto((prev) => !prev)}>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              abierto && 'rotate-180'
            )}
          />
        </button>
      </div>

      {abierto && (
        <div className="space-y-2 border-t border-border p-3">
          {fields.map((field, tallerIndex) => (
            <TallerEnBloqueItem
              key={field.id}
              bloqueIndex={index}
              tallerIndex={tallerIndex}
              totalTallersEnBloque={fields.length}
              onEliminar={() => remove(tallerIndex)}
            />
          ))}

          {errorTalleres && (
            <p className="text-xs text-destructive">{errorTalleres.message}</p>
          )}

          <button
            type="button"
            onClick={agregarTaller}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-accent/50"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar taller
          </button>
        </div>
      )}
    </div>
  )
}