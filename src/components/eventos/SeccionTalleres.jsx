import { useEffect, useState } from 'react'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'
import { ChevronDown, Plus, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TallerItem } from '@/components/eventos/TallerItem'
import { cn } from '@/lib/utils'

const OPCIONES_MODO_TALLER = [
  { value: 'paralelos', label: 'Paralelos' },
  { value: 'secuenciales', label: 'Secuenciales' },
]

export function SeccionTalleres() {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(false)

  const tieneTalleres = form.watch('tieneTalleres')

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'talleres',
  })

  useEffect(() => {
    if (tieneTalleres && form.getValues('modoTaller') === 'ninguno') {
      form.setValue('modoTaller', 'paralelos')
    }
    if (!tieneTalleres) {
      form.setValue('modoTaller', 'ninguno')
      setAbierto(false)
    }
  }, [tieneTalleres, form])

  function agregarTaller() {
    append({ nombre: '', descripcion: '', inicio: '', fin: '', capacidad: 30 })
  }

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
                Actividades dentro del evento con horario propio.
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
          <CardContent className="space-y-4 pt-0">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Modo de talleres
              </label>
              <Controller
                control={form.control}
                name="modoTaller"
                render={({ field }) => (
                  <Select
                    value={field.value === 'ninguno' ? 'paralelos' : field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCIONES_MODO_TALLER.map((opcion) => (
                        <SelectItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <TallerItem key={field.id} index={index} onEliminar={() => remove(index)} />
              ))}
            </div>

            {fields.length === 0 && (
              <p className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                Todavía no agregaste talleres.
              </p>
            )}

            <button
              type="button"
              onClick={agregarTaller}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:bg-accent/50"
            >
              <Plus className="h-4 w-4" />
              Agregar taller
            </button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}