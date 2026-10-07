import { useState, useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ZonasCostoCampos } from '@/components/eventos/SeccionZonasCosto'
import { PlanesPagoCampos } from '@/components/eventos/SeccionPlanesPago'
import { PasoConNumero } from '@/components/eventos/EventoStepper'

export function SeccionCostos() {
  const form = useFormContext()
  const [abierto, setAbierto] = useState(false)
  const tienePrecioPorZona = form.watch('tienePrecioPorZona')
  const costo = form.watch('costo')
  const aceptaCuotas = form.watch('aceptaCuotas')
  const zonas = form.watch('zonasCosto') ?? []
  const tieneCosto = tienePrecioPorZona ? zonas.some((z) => Number(z.costo) > 0) : Number(costo) > 0

  // Si el costo pasa a ser por zona, el costo general no se usa — lo reseteamos
  // para no mandar un valor viejo que el back va a ignorar de todos modos.
  useEffect(() => {
    if (tienePrecioPorZona) form.setValue('costo', 0)
  }, [tienePrecioPorZona])

  return (
    <PasoConNumero id="paso-costos">
      <Card>
        <Collapsible open={abierto} onOpenChange={setAbierto}>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between px-4 py-3 cursor-pointer">
              <div className="text-left">
                <h2 className="text-base font-semibold text-foreground">Costos y cobro</h2>
                <p className="text-sm text-muted-foreground">Costo de inscripción, zonas, datos para transferir y planes en cuotas.</p>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', abierto && 'rotate-180')}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4">
              <Separator />
            </div>
            <CardContent className="space-y-6 pt-6">
              <FormField
                control={form.control}
                name="tienePrecioPorZona"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Costo diferido por zona</FormLabel>
                        <HelpTooltip>
                          En vez de un costo único, cada participante elige su zona al
                          inscribirse y paga el monto de esa zona. Configurá las zonas
                          debajo.
                        </HelpTooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {field.value ? 'El costo se define por zona.' : 'Costo único para todos los participantes.'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="shrink-0" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {tienePrecioPorZona && <ZonasCostoCampos />}

              <div className={cn('grid gap-4', tienePrecioPorZona ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
                {tienePrecioPorZona ? null : (
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
                            onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                            onFocus={() => { if (Number(field.value) === 0) field.onChange('') }}
                            onBlur={(e) => { if (e.target.value === '') field.onChange(0) }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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

              <FormField
                control={form.control}
                name="aceptaCuotas"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <FormLabel>Pago en cuotas</FormLabel>
                        <HelpTooltip>
                          Además de pagar el total, el participante puede elegir uno de los
                          planes en cuotas que armes. Configurá los planes debajo.
                        </HelpTooltip>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {field.value ? 'Se puede pagar en cuotas.' : 'Solo pago total.'}
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="shrink-0" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {aceptaCuotas && (tieneCosto ? (
                <PlanesPagoCampos />
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Cargá el costo de inscripción {tienePrecioPorZona ? '(o el de cada zona) ' : ''}para armar los planes en cuotas.
                </p>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </PasoConNumero>
  )
}
