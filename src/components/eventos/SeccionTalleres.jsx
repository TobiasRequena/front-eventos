import { useEffect, useState } from 'react'
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
import { ChevronDown, Lock, Plus, CalendarX2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { BloqueTallerCard } from '@/components/eventos/BloqueTallerCard'
import { BloqueTallerFormDialog } from '@/components/eventos/BloqueTallerFormDialog'
import { cn } from '@/lib/utils'

export function SeccionTalleres() {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(false)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [indiceEditando, setIndiceEditando] = useState(null)

  const tieneTalleres = form.watch('tieneTalleres')

  const { fields, append, remove, move, update } = useFieldArray({
    control: form.control,
    name: 'bloquesTaller',
  })

  useEffect(() => {
    if (!tieneTalleres) setAbierto(false)
  }, [tieneTalleres])

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

  function abrirDialogoCrear() {
    setIndiceEditando(null)
    setDialogoAbierto(true)
  }

  function abrirDialogoEditar(index) {
    setIndiceEditando(index)
    setDialogoAbierto(true)
  }

  function handleConfirmarDialogo(valores) {
    if (indiceEditando === null) {
      append({
        nombre: valores.nombre,
        cantidadElegible: valores.cantidadElegible,
        esObligatorio: valores.esObligatorio,
        orden: fields.length,
        talleres: [],
      })
    } else {
      const bloqueActual = form.getValues(`bloquesTaller.${indiceEditando}`)
      update(indiceEditando, { ...bloqueActual, ...valores })
    }
  }

  const valoresIniciales =
    indiceEditando !== null ? form.getValues(`bloquesTaller.${indiceEditando}`) : null

  return (
    <Card className={cn(!tieneTalleres && 'opacity-60')}>
      <Collapsible open={tieneTalleres && abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger asChild disabled={!tieneTalleres}>
          <button
            type="button"
            disabled={!tieneTalleres}
            className="flex w-full items-center justify-between p-6 disabled:cursor-not-allowed"
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">Talleres</h2>
                {!tieneTalleres && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground">
                Actividades dentro del evento con horario propio. Organizá los talleres en bloques con su propia regla de selección.
              </p>
              {
                !tieneTalleres ?
                  <p className="text-sm text-muted-foreground">
                    Activá "Este evento tiene talleres" para habilitar esta sección.
                  </p>
                  : null
              }
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                abierto && tieneTalleres && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-3 pt-0">
            {fields.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
                <CalendarX2 className="h-7 w-7 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">
                  Todavía no agregaste talleres
                </p>
                <p className="text-sm text-muted-foreground">
                  Creá un bloque para empezar a agregar talleres.
                </p>
              </div>
            )}

            {fields.length > 0 && (
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
                      <BloqueTallerCard
                        key={field.id}
                        id={field.id}
                        index={index}
                        onEliminar={() => remove(index)}
                        onEditar={() => abrirDialogoEditar(index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <button
              type="button"
              onClick={abrirDialogoCrear}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:bg-accent/50"
            >
              <Plus className="h-4 w-4" />
              Agregar bloque
            </button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <BloqueTallerFormDialog
        open={dialogoAbierto}
        onOpenChange={setDialogoAbierto}
        valoresIniciales={valoresIniciales}
        onConfirmar={handleConfirmarDialogo}
      />
    </Card>
  )
}