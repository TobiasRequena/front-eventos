import { useState, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { GripVertical, ChevronDown, MoreVertical, Plus, Pencil, Trash2, Clock } from 'lucide-react'
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
    ? `Elegí ${cantidadElegible}`
    : `Elegí hasta ${cantidadElegible}`

  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
      {texto}
    </span>
  )
}

export function BloqueTallerCard({ id, index, onEliminar, onEditar, fieldArrayName = 'bloquesTaller' }) {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(true)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }

  const talleres = form.watch(`${fieldArrayName}.${index}.talleres`) ?? []
  const nombre = form.watch(`${fieldArrayName}.${index}.nombre`)
  const cantidadElegible = form.watch(`${fieldArrayName}.${index}.cantidadElegible`)
  const esObligatorio = form.watch(`${fieldArrayName}.${index}.esObligatorio`)
  const errorTalleres = form.formState.errors[fieldArrayName]?.[index]?.talleres?.root
  const erroresBloque = form.formState.errors[fieldArrayName]?.[index]
  const inicio = form.watch(`${fieldArrayName}.${index}.inicio`)
  const fin = form.watch(`${fieldArrayName}.${index}.fin`)

  function agregarTaller() {
    const current = form.getValues(`${fieldArrayName}.${index}.talleres`) ?? []
    form.setValue(
      `${fieldArrayName}.${index}.talleres`,
      [...current, { nombre: '', descripcion: '', capacidad: undefined }],
      { shouldValidate: false, shouldDirty: true }
    )
  }

  function eliminarTaller(tallerIndex) {
    const current = form.getValues(`${fieldArrayName}.${index}.talleres`) ?? []
    form.setValue(
      `${fieldArrayName}.${index}.talleres`,
      current.filter((_, i) => i !== tallerIndex),
      { shouldValidate: false, shouldDirty: true }
    )
  }

  useEffect(() => {
    form.trigger(`${fieldArrayName}.${index}.inicio`)
    form.trigger(`${fieldArrayName}.${index}.fin`)
  }, [inicio, fin])

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
            cantidadTalleres={talleres.length}
            cantidadElegible={cantidadElegible}
            esObligatorio={esObligatorio}
          />
          {inicio && fin && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(inicio))}
              {' — '}
              {new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(fin))}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {talleres.length} {talleres.length === 1 ? 'taller' : 'talleres'}
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

      {(erroresBloque?.inicio?.message || erroresBloque?.fin?.message) && (
        <div className="px-3 pb-2 space-y-0.5">
          {erroresBloque?.inicio?.message && <p className="text-sm font-medium text-destructive">{erroresBloque.inicio.message}</p>}
          {erroresBloque?.fin?.message && <p className="text-sm font-medium text-destructive">{erroresBloque.fin.message}</p>}
        </div>
      )}

      {abierto && (
        <div className="space-y-2 border-t border-border bg-muted/70 p-3">
          {talleres.map((_, tallerIndex) => (
            <TallerEnBloqueItem
              key={tallerIndex}
              bloqueIndex={index}
              tallerIndex={tallerIndex}
              totalTallersEnBloque={talleres.length}
              onEliminar={() => eliminarTaller(tallerIndex)}
              fieldArrayName={fieldArrayName}
            />
          ))}

          {errorTalleres && (
            <p className="text-sm font-medium text-destructive">{errorTalleres.message}</p>
          )}

          <button
            type="button"
            onClick={agregarTaller}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-primary/30 bg-muted/5 py-2 text-sm text-primary transition-colors hover:bg-primary/10"          >
            <Plus className="h-3.5 w-3.5" />
            Agregar taller
          </button>
        </div>
      )}
    </div>
  )
}