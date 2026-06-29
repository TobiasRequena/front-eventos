import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { CampoFormItem } from '@/components/eventos/CampoFormItem'

export function CampoFormList() {
  const form = useFormContext()
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'camposForm',
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const indexActivo = fields.findIndex((f) => f.id === active.id)
    const indexDestino = fields.findIndex((f) => f.id === over.id)
    move(indexActivo, indexDestino)
  }

  function agregarCampo() {
    append({
      etiqueta: '',
      tipo: 'texto',
      multiple: false,
      opciones: [],
      requerido: false,
      orden: fields.length,
    })
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {fields.map((field, index) => (
              <CampoFormItem
                key={field.id}
                id={field.id}
                index={index}
                onEliminar={() => remove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          Todavía no agregaste campos personalizados.
        </p>
      )}

      <button
        type="button"
        onClick={agregarCampo}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:bg-accent/50"
      >
        <Plus className="h-4 w-4" />
        Agregar campo personalizado
      </button>
    </div>
  )
}