import { useState, useEffect } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { ChevronDown, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { DescripcionEditor } from '@/components/eventos/TextoFormateado'
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
import { DateTimePicker } from '@/components/DateTimePicker'
import { CodigoInput } from '@/components/eventos/CodigoInput'
import { Separator } from '@/components/ui/separator'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { SeccionCostos } from '@/components/eventos/SeccionCostos'
import { PasoConNumero } from '@/components/eventos/EventoStepper'
import { TemplateAutorizacionUploader } from '@/components/eventos/TemplateAutorizacionUploader'

const OPCIONES_POLITICA_MENOR = [
  { value: 'no_aplica', label: 'No aplica' },
  // { value: 'opcional', label: 'Opcional' },
  { value: 'obligatorio', label: 'Obligatorio' },
]

export function SeccionDatosEvento({ imagenPreview, onCambiarImagen, onQuitarImagen, codigoOriginal, eventoId, archivoTemplateRef }) {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(true)
  const [abiertoAdic, setAbiertoAdic] = useState(false)
  const politicaMenor = form.watch('politicaMenor')

  useEffect(() => {
    if (politicaMenor !== 'no_aplica') {
      form.setValue('tieneGrupos', true)
    } else if (politicaMenor === 'no_aplica') {
      form.setValue('tieneGrupos', false)
    }
  }, [politicaMenor])

  return (
    <div className="space-y-4">
      <PasoConNumero id="paso-datos">
        <Card>
          <Collapsible open={abierto} onOpenChange={setAbierto}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between px-4 py-3 cursor-pointer">
                <div className="text-left">
                  <h2 className="text-base font-semibold text-foreground">Datos del evento</h2>
                  <p className="text-sm text-muted-foreground">A continuación podrás completar: portada, nombre, descripción y fechas.</p>
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
              <div className="px-4">
                <Separator />
              </div>
              <CardContent className="space-y-6 pt-6">
              <div>
                <FormLabel className="mb-2 block">Imagen de portada</FormLabel>
                {imagenPreview ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border">
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
                  <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:bg-accent/50">
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
                    <DescripcionEditor
                      field={field}
                      label="Descripción"
                      placeholder="Contales a los participantes de qué se trata el evento"
                    />
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
  
              <div>
                <FormField
                  control={form.control}
                  name="cupoMaximo"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Cupo máximo</FormLabel>
                        <HelpTooltip>
                          Límite de inscriptos. Dejalo vacío para no tener límite.
                        </HelpTooltip>
                      </div>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Sin límite"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="mostrarEnLanding"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Mostrar en la página de Talita Encuentro</FormLabel>
                        <HelpTooltip>
                          Aparece en "Próximos eventos" de la página principal, con el link para inscribirse, mientras la inscripción esté abierta.
                        </HelpTooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {field.value ? 'Cualquiera puede encontrarlo e inscribirse desde la página.' : 'Solo quien tenga el link o el código.'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="shrink-0" />
                    </FormControl>
                  </FormItem>
                )}
              />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </PasoConNumero>
      <SeccionCostos />
      <PasoConNumero id="paso-adicionales">
        <Card>
          <Collapsible open={abiertoAdic} onOpenChange={setAbiertoAdic}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between px-4 py-3 cursor-pointer">
                <div className="text-left">
                  <h2 className="text-base font-semibold text-foreground">Adicionales</h2>
                  <p className="text-sm text-muted-foreground">Cupo, grupos, talleres, requisitos y contacto.</p>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                    abiertoAdic && 'rotate-180'
                  )}
                />
              </button>
            </CollapsibleTrigger>
  
            <CollapsibleContent>
              <div className="px-4">
                <Separator />
              </div>
              <CardContent className="space-y-6 pt-6">
  
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="configFichaMedica"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Ficha médica</FormLabel>
                        <HelpTooltip>
                          Define si los participantes deben completar una ficha médica al inscribirse.
                        </HelpTooltip>
                      </div>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no">No requerida</SelectItem>
                          <SelectItem value="obligatorio_todos">Requerida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="solicitaContactoEmergencia"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <FormLabel>Contacto de emergencia</FormLabel>
                          <HelpTooltip>
                            Se solicita nombre y teléfono. Obligatorio para menores, opcional para mayores.
                          </HelpTooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {field.value ? 'Se solicitará un contacto de emergencia.' : 'No se solicitará.'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="shrink-0" />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormField
                  control={form.control}
                  name="tieneGrupos"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <FormLabel>Inscripción por grupos</FormLabel>
                          <HelpTooltip>
                            Permite que los participantes se organicen en grupos con un adulto
                            responsable. El responsable crea el grupo, comparte el código de
                            invitación, y el día del evento representa al grupo en la acreditación.
                          </HelpTooltip>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="politicaMenor"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Política de menores</FormLabel>
                        <HelpTooltip>
                          Define si los participantes menores de 18 años necesitan estar
                          vinculados a un adulto responsable para inscribirse.
                        </HelpTooltip>
                      </div>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                          Los menores deben pertenecer al grupo de un adulto responsable para poder inscribirse.
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configCertificado"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Certificado de antecedentes</FormLabel>
                        <HelpTooltip>
                          Define si los participantes deben presentar certificado de antecedentes.
                        </HelpTooltip>
                      </div>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no">No requerido</SelectItem>
                          <SelectItem value="obligatorio_mayores">Obligatorio — mayores de edad</SelectItem>
                          <SelectItem value="obligatorio_referentes">Obligatorio — referentes de grupo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="requiereAutorizacionMenores"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <FormLabel>Autorización de menores</FormLabel>
                          <HelpTooltip>
                            Los menores deberán presentar una autorización firmada por su tutor.
                          </HelpTooltip>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {field.value ? 'Se solicitará una autorización firmada.' : 'No se solicitará.'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} className="shrink-0" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground">Template de autorización</p>
                    <HelpTooltip>
                      PDF opcional que los tutores descargan, firman y vuelven a subir.
                    </HelpTooltip>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si no subís ninguno, el participante sube el suyo.
                  </p>
                  <TemplateAutorizacionUploader
                    eventoId={eventoId}
                    urlActual={form.watch('autorizacionTemplateUrl')}
                    onSubido={(url) => form.setValue('autorizacionTemplateUrl', url)}
                    disabled={!form.watch('requiereAutorizacionMenores')}
                    archivoTemplateRef={archivoTemplateRef}
                  />
                </div>
              </div>

              <div>
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
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </PasoConNumero>
    </div>
  )
}
