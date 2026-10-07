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
import { calcularMontosCuotas, formatoPesos } from '@/lib/costoEvento'

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
  const { fields, insert, remove } = useFieldArray({ control: form.control, name: `${base}.cuotas` })
  const cuotas = form.watch(`${base}.cuotas`) ?? []
  const errores = form.formState.errors.planesPago?.[planIndex]

  // Para la previsualización: valores del form → { porcentaje } / { monto }
  const cuotasCalculo = cuotas.map((c) =>
    c.tipo === 'porcentaje' ? { porcentaje: Number(c.valor) || 0 }
      : c.tipo === 'monto' ? { monto: Number(c.valor) || 0 }
        : {}
  )
  const previas = costos.map((c) => ({ ...c, montos: calcularMontosCuotas(c.costo, cuotasCalculo) }))
  const unicoCosto = previas.length === 1 ? previas[0] : null

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
            <div key={field.id} className="flex flex-wrap items-center gap-2">
              <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">Cuota {i + 1}</span>
              {/* Mismo ancho para "%/$ + valor" y "El resto", así las filas quedan parejas */}
              <div className="flex w-44 shrink-0 gap-2">
                {esResto ? (
                  <span className="flex h-9 w-full items-center rounded-md border border-dashed border-border px-3 text-sm text-muted-foreground">
                    El resto
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
              <div className="w-48 shrink-0">
                <Controller
                  control={form.control}
                  name={`${base}.cuotas.${i}.vencimiento`}
                  render={({ field: f }) => <VencimientoPicker value={f.value} onChange={f.onChange} />}
                />
              </div>
              {unicoCosto && (
                <span className="text-xs text-muted-foreground">
                  {unicoCosto.montos ? formatoPesos(unicoCosto.montos[i]) : '—'}
                </span>
              )}
              {!esResto && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-auto shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Quitar cuota ${i + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {errorCuota?.valor && <p className="w-full pl-[4.5rem] text-xs text-destructive">{errorCuota.valor.message}</p>}
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

      {fields.length < 12 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insert(fields.length - 1, { tipo: 'porcentaje', valor: '', vencimiento: '' })}
        >
          <Plus className="mr-1 h-4 w-4" /> Agregar cuota
        </Button>
      )}

      <div className="flex flex-wrap items-center gap-2">
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
                    <SelectItem key={i} value={String(i + 1)}>la cuota {i + 1}</SelectItem>
                  ))}
                  <SelectItem value="completo">el pago completo</SelectItem>
                </SelectContent>
              </Select>
            )
          }}
        />
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
    append({
      nombre: `${fields.length + 2} cuotas`,
      cuotaQr: 'completo',
      cuotas: [
        ...Array.from({ length: fields.length + 1 }, () => ({ tipo: 'porcentaje', valor: '', vencimiento: '' })),
        CUOTA_RESTO,
      ],
    })
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Planes de pago en cuotas</p>
        <p className="text-xs text-muted-foreground">
          El participante siempre puede pagar el total de una vez; además puede elegir uno de estos planes.
          Cada cuota vale un porcentaje o un monto fijo, y la última es lo que falta. El vencimiento es
          opcional: si lo cargás, le avisamos por mail al participante 3 días antes.
        </p>
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
