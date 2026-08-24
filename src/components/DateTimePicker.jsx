import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function combinarFechaYHora(fecha, horaStr) {
  if (!fecha) return null
  const [horas, minutos] = (horaStr || '00:00').split(':').map(Number)
  const resultado = new Date(fecha)
  resultado.setHours(horas || 0, minutos || 0, 0, 0)
  return resultado
}

/**
 * @param {string} value - fecha/hora en ISO
 * @param {(iso: string) => void} onChange
 * @param {string} [rangoDesde] - fecha ISO desde la cual pintar el rango visual
 *   (ej. fechaInicio), solo para resaltar el período entre medio. No cambia
 *   el modo de selección, que sigue siendo de un solo día por click.
 */
export function DateTimePicker({ value, onChange, placeholder = 'Elegí fecha y hora', rangoDesde, soloFecha = false }) {
  const fechaActual = value ? new Date(value) : null
  const [horaInput, setHoraInput] = useState(
    fechaActual ? format(fechaActual, 'HH:mm') : '09:00'
  )

  function handleSeleccionarDia(dia) {
    const combinado = combinarFechaYHora(dia, horaInput)
    onChange(combinado ? combinado.toISOString() : '')
  }

  function handleCambiarHora(event) {
    const nuevaHora = event.target.value
    setHoraInput(nuevaHora)
    if (fechaActual) {
      const combinado = combinarFechaYHora(fechaActual, nuevaHora)
      onChange(combinado.toISOString())
    }
  }

  const inicioRango = rangoDesde ? new Date(rangoDesde) : null
  const mostrarRango = inicioRango && fechaActual && fechaActual > inicioRango

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'min-w-0 flex-1 justify-start text-left font-normal',
              !fechaActual && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="h-4 w-4 shrink-0" />

            <span className="min-w-0 truncate">
              {fechaActual
                ? format(fechaActual, "d 'de' MMMM, yyyy", { locale: es })
                : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={fechaActual ?? undefined}
            onSelect={handleSeleccionarDia}
            locale={es}
            modifiers={mostrarRango ? { enRango: { from: inicioRango, to: fechaActual } } : undefined}
            modifiersClassNames={mostrarRango ? { enRango: 'bg-accent text-accent-foreground' } : undefined}
          />
        </PopoverContent>
      </Popover>
      {!soloFecha && (
        <Input
          type="text"
          inputMode="numeric"
          placeholder="HH:mm"
          value={horaInput}
          onChange={(e) => {
            let valor = e.target.value.replace(/\D/g, '').slice(0, 4)

            if (valor.length >= 1 && Number(valor[0]) > 2) {
              valor = ''
            }

            if (valor.length >= 2 && Number(valor.slice(0, 2)) > 23) {
              valor = valor.slice(0, 1)
            }

            if (valor.length >= 3 && Number(valor[2]) > 5) {
              valor = valor.slice(0, 2)
            }

            if (valor.length >= 4 && Number(valor.slice(2, 4)) > 59) {
              valor = valor.slice(0, 3)
            }

            if (valor.length >= 3) {
              valor = `${valor.slice(0, 2)}:${valor.slice(2)}`
            }

            setHoraInput(valor)

            if (valor.length === 5 && fechaActual) {
              const combinado = combinarFechaYHora(fechaActual, valor)
              onChange(combinado.toISOString())
            }
          }}
          className="w-20 shrink-0 sm:w-28"
        />
      )}
    </div>
  )
}