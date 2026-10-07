import { useEffect } from 'react'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from '@/components/DateTimePicker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { calcularMontosCuotas, cuotasDelForm, formatoPesos, repartirCuotas } from '@/lib/costoEvento'
import { HelpTooltip } from '@/components/ui/help-tooltip'

const CUOTA_RESTO = { tipo: 'resto', valor: '', vencimiento: '' }

function TipoCuotaToggle({ value, onChange }) {
  return (
    <div className="inline-flex h-9 shrink-0 overflow-hidden rounded-md border border-border text-sm">
      {[['porcentaje', '%'], ['monto', '$']].map(([tipo, label]) => (
        <button
          key={tipo}
          type="button"
          onClick={() => onChange(tipo)}
          className={cn(
            'w-9',
            value === tipo ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// El vencimiento se guarda como 'YYYY-MM-DD'; el picker trabaja con ISO
function VencimientoPicker({ value, onChange }) {
  return (
    <DateTimePicker
      soloFecha
      placeholder="Vencimiento"
      value={value ? `${value}T12:00:00` : ''}
      onChange={(iso) => onChange(iso ? format(new Date(iso), 'yyyy-MM-dd') : '')}
    />
  )
}

function PlanCampos({ planIndex, onEliminar, costos }) {
  const form = useFormContext()
  const base = `planesPago.${planIndex}`
  const { fields, replace } = useFieldArray({ control: form.control, name: `${base}.cuotas` })
  const cuotas = form.watch(`${base}.cuotas`) ?? []
  const errores = form.formState.errors.planesPago?.[planIndex]

  // Si el plan quedó con errores (al intentar guardar), cualquier cambio lo vuelve a
  // validar entero: cambiar %/$ o el costo no pasa por el input que tenía el error.
  const firma = JSON.stringify([cuotas, costos])
  const tieneErrores = Boolean(errores)
  useEffect(() => {
    if (tieneErrores) form.trigger(base)
  }, [firma]) // eslint-disable-line react-hooks/exhaustive-deps

  const previas = costos.map((c) => ({ ...c, montos: calcularMontosCuotas(c.costo, cuotasDelForm(cuotas)) }))
  const unicoCosto = previas.length === 1 ? previas[0] : null

  // Al agregar o quitar cuotas se vuelve a repartir parejo; después el organizador ajusta
  function rearmar(nuevas) {
    replace(repartirCuotas(nuevas, unicoCosto?.costo ?? 0))
  }
  const agregarCuota = () =>
    rearmar([...cuotas.slice(0, -1), { tipo: 'monto', valor: '', vencimiento: '' }, cuotas[cuotas.length - 1]])
  const quitarCuota = (i) => rearmar(cuotas.filter((_, j) => j !== i))

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nombre del plan</label>
          <Input
            {...form.register(`${base}.nombre`)}
            placeholder='Ej. "3 cuotas"'
            className="h-9 text-sm"
          />
          {errores?.nombre && <p className="mt-1 text-xs text-destructive">{errores.nombre.message}</p>}
        </div>
        <button
          type="button"
          onClick={onEliminar}
          className="mb-2 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label="Eliminar plan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        {fields.map((field, i) => {
          const cuota = cuotas[i] ?? {}
          const esResto = cuota.tipo === 'resto'
          const errorCuota = errores?.cuotas?.[i]
          return (
            <div key={field.id}>
            <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
              <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Cuota {i + 1}</span>
              {/* Mismo ancho para "%/$ + valor" y "El resto", así las filas quedan parejas */}
              <div className="flex min-w-0 flex-1 basis-40 gap-2">
                {esResto ? (
                  <span className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                    El resto
                    {unicoCosto?.montos && (
                      <span className="font-medium text-foreground">{formatoPesos(unicoCosto.montos[i])}</span>
                    )}
                  </span>
                ) : (
                  <>
                    <TipoCuotaToggle
                      value={cuota.tipo}
                      onChange={(tipo) => form.setValue(`${base}.cuotas.${i}.tipo`, tipo, { shouldDirty: true })}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={cuota.tipo === 'porcentaje' ? '50' : '20000'}
                      {...form.register(`${base}.cuotas.${i}.valor`, { valueAsNumber: true })}
                      className="h-9 min-w-0 flex-1 text-sm"
                    />
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1 basis-44">
                <Controller
                  control={form.control}
                  name={`${base}.cuotas.${i}.vencimiento`}
                  render={({ field: f }) => <VencimientoPicker value={f.value} onChange={f.onChange} />}
                />
              </div>
              {unicoCosto && (
                <span className="w-24 shrink-0 text-right text-xs text-muted-foreground">
                  {esResto ? '' : unicoCosto.montos ? formatoPesos(unicoCosto.montos[i]) : '—'}
                </span>
              )}
              <div className="w-4 shrink-0">
                {!esResto && (
                  <button
                    type="button"
                    onClick={() => quitarCuota(i)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Quitar cuota ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            {/* El error va debajo de la fila: adentro le quitaba ancho a los campos */}
            {errorCuota?.valor && <p className="mt-1 pl-[4.5rem] text-xs text-destructive">{errorCuota.valor.message}</p>}
            </div>
          )
        })}
      </div>

      {typeof errores?.cuotas?.message === 'string' && (
        <p className="text-xs text-destructive">{errores.cuotas.message}</p>
      )}
      {typeof errores?.cuotas?.root?.message === 'string' && (
        <p className="text-xs text-destructive">{errores.cuotas.root.message}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {fields.length < 12 ? (
          <Button type="button" variant="ghost" size="sm" onClick={agregarCuota}>
            <Plus className="mr-1 h-4 w-4" /> Agregar cuota
          </Button>
        ) : <span />}
        <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Enviar la credencial (QR) al aprobar</span>
        <Controller
          control={form.control}
          name={`${base}.cuotaQr`}
          render={({ field: f }) => {
            // Si se borraron cuotas y la elegida ya no existe, vuelve a "al completar"
            const valor = Number(f.value) >= 1 && Number(f.value) < fields.length ? f.value : 'completo'
            return (
              <Select value={valor} onValueChange={f.onChange}>
                <SelectTrigger className="h-9 w-auto text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fields.slice(0, -1).map((_, i) => (
                    <SelectItem key={i} value={String(i + 1)}>Cuota {i + 1}</SelectItem>
                  ))}
                  <SelectItem value="completo">Pago completo</SelectItem>
                </SelectContent>
              </Select>
            )
          }}
        />
        </div>
      </div>

      {!unicoCosto && previas.length > 0 && (
        <div className="space-y-1 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
          {previas.map((p, i) => (
            <p key={i}>
              <span className="font-medium text-foreground">{p.nombre || `Zona ${i + 1}`}:</span>{' '}
              {p.montos ? p.montos.map(formatoPesos).join(' + ') : 'no disponible (los montos fijos superan el costo de la zona)'}
            </p>
          ))}
        </div>
      )}
      {unicoCosto && !unicoCosto.montos && unicoCosto.costo > 0 && (
        <p className="text-xs text-destructive">Los montos fijos superan el costo del evento.</p>
      )}
    </div>
  )
}

export function PlanesPagoCampos() {
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'planesPago' })

  const tienePrecioPorZona = form.watch('tienePrecioPorZona')
  const zonas = form.watch('zonasCosto') ?? []
  const costo = form.watch('costo')
  const costos = tienePrecioPorZona
    ? zonas.map((z) => ({ nombre: z.nombre, costo: Number(z.costo) || 0 }))
    : [{ nombre: null, costo: Number(costo) || 0 }]

  function agregarPlan() {
    const cantidad = fields.length + 2
    append({
      nombre: `${cantidad} cuotas`,
      cuotaQr: 'completo',
      // Reparto parejo como ayuda: con costo único en pesos, con zonas en porcentaje
      cuotas: repartirCuotas(
        Array.from({ length: cantidad }, () => ({ ...CUOTA_RESTO })),
        tienePrecioPorZona ? 0 : Number(costo) || 0
      ),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-medium text-foreground">Planes de pago en cuotas</p>
        <HelpTooltip>
          El participante siempre puede pagar el total de una vez; además puede elegir uno de estos planes.
          Cada cuota vale un porcentaje o un monto fijo, y la última es lo que falta. El vencimiento es
          opcional: si lo cargás, le avisamos por mail al participante 3 días antes.
        </HelpTooltip>
      </div>

      {fields.map((field, index) => (
        <PlanCampos key={field.id} planIndex={index} onEliminar={() => remove(index)} costos={costos} />
      ))}

      {fields.length < 10 && (
        <Button type="button" variant="outline" size="sm" onClick={agregarPlan}>
          <Plus className="mr-1 h-4 w-4" /> Agregar plan en cuotas
        </Button>
      )}
    </div>
  )
}
