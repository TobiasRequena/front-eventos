import { useState, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ChevronDown, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DateTimePicker } from '@/components/DateTimePicker'
import { CodigoInput } from '@/components/eventos/CodigoInput'

const OPCIONES_POLITICA_MENOR = [
  { value: 'no_aplica', label: 'No aplica' },
  { value: 'opcional', label: 'Opcional' },
  { value: 'obligatorio', label: 'Obligatorio' },
]

export function SeccionDatosEvento({ imagenPreview, onCambiarImagen, onQuitarImagen, codigoOriginal }) {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(true)
  const politicaMenor = form.watch('politicaMenor')

  useEffect(() => {
    if (politicaMenor !== 'no_aplica') {
      form.setValue('tieneGrupos', true)
    } else if (politicaMenor === 'no_aplica') {
      form.setValue('tieneGrupos', false)
    }
  }, [politicaMenor])

  return (
    <Card>
      <Collapsible open={abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between p-6">
            <div className="text-left">
              <h2 className="text-base font-semibold text-foreground">Datos del evento</h2>
              <p className="text-sm text-muted-foreground">Nombre, descripción, fechas y cobro.</p>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                abierto && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Imagen de portada */}
            <div>
              <FormLabel className="mb-2 block">Imagen de portada</FormLabel>
              {imagenPreview ? (
                <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                  <img src={imagenPreview} alt="Portada" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={onQuitarImagen}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-40 w-full max-w-sm cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-accent/50">
                  <ImagePlus className="h-6 w-6" />
                  Subir imagen
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onCambiarImagen(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del evento</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Retiro de Jóvenes 2026" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CodigoInput codigoOriginal={codigoOriginal} />
            </div>

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Contales a los participantes de qué se trata el evento"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>Fecha y hora de inicio</FormLabel>
                <Controller
                  control={form.control}
                  name="fechaInicio"
                  render={({ field }) => (
                    <DateTimePicker value={field.value} onChange={field.onChange} />
                  )}
                />
                <FormMessage>{form.formState.errors.fechaInicio?.message}</FormMessage>
              </FormItem>

              <FormItem>
                <FormLabel>Fecha y hora de fin</FormLabel>
                <Controller
                  control={form.control}
                  name="fechaFin"
                  render={({ field }) => (
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      rangoDesde={form.watch('fechaInicio')}
                    />
                  )}
                />
                <FormMessage>{form.formState.errors.fechaFin?.message}</FormMessage>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="politicaMenor"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-1.5">
                    <FormLabel>Política de menores</FormLabel>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-56 text-center">
                          Define si los participantes menores de 18 años necesitan estar
                          vinculados a un adulto responsable para inscribirse.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OPCIONES_POLITICA_MENOR.map((opcion) => (
                        <SelectItem key={opcion.value} value={opcion.value}>
                          {opcion.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.value === 'no_aplica' && (
                    <p className="text-xs text-muted-foreground">
                      Este evento no distingue entre mayores y menores. Cualquier persona puede inscribirse libremente.
                    </p>
                  )}
                  {field.value === 'opcional' && (
                    <p className="text-xs text-muted-foreground">
                      Los menores pueden inscribirse solos o vincularse al grupo de un adulto responsable. La vinculación es voluntaria.
                    </p>
                  )}
                  {field.value === 'obligatorio' && (
                    <p className="text-xs text-muted-foreground">
                      Los menores deben pertenecer al grupo de un adulto responsable para poder inscribirse. En caso de emergencia, se puede ubicar al referente de un menor escaneando su QR.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tieneGrupos"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Inscripción por grupos</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-64 text-center">
                              Permite que los participantes se organicen en grupos con un adulto
                              responsable. El responsable crea el grupo, comparte el código de
                              invitación, y el día del evento representa al grupo en la acreditación.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {politicaMenor !== 'no_aplica'
                          ? 'Requerido por la política de menores.'
                          : field.value
                            ? 'Cada grupo tiene un responsable adulto que gestiona sus integrantes. El día del evento, escaneando el QR del responsable se acredita a todo el grupo de una sola vez.'
                            : 'Permite cargar inscriptos agrupados.'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={politicaMenor !== 'no_aplica'}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tieneTalleres"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <FormLabel>Este evento tiene talleres</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Habilita la sección de talleres más abajo.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="costo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Costo de inscripción</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        {...field}
                        value={field.value !== undefined && field.value !== '' ? field.value : ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                        onFocus={(e) => { if (Number(field.value) === 0) field.onChange('') }}
                        onBlur={(e) => { if (e.target.value === '') field.onChange(0) }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cbuCvu"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CBU/CVU</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aliasCobro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias de cobro</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}