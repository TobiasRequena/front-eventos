import { Controller } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

/**
 * Renderiza el input correspondiente a un campo de formulario según su tipo
 * (texto, numero, fecha, seleccion ─única o múltiple─, booleano).
 *
 * Dos modos de uso:
 * - Preview (creador de evento): pasale `campo` con los datos y `preview={true}`.
 *   Todos los inputs quedan deshabilitados, solo es una vista previa visual.
 * - Real (formulario de inscripción del participante): pasale `campo`,
 *   `control` y `name` (de react-hook-form) para que el input sea editable
 *   y esté conectado al formulario real.
 */
export function CampoFormInput({ campo, preview = false, control, name }) {
  const etiqueta = campo.etiqueta || 'Campo sin nombre'

  function renderInput(valor, onChange) {
    if (campo.tipo === 'texto') {
      return (
        <Input
          disabled={preview}
          value={valor ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Respuesta de texto"
        />
      )
    }

    if (campo.tipo === 'numero') {
      return (
        <Input
          disabled={preview}
          type="number"
          value={valor ?? ''}
          onChange={(e) => onChange?.(e.target.valueAsNumber)}
          placeholder="0"
        />
      )
    }

    if (campo.tipo === 'fecha') {
      return (
        <Input
          disabled={preview}
          type="date"
          value={valor ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    }

    if (campo.tipo === 'booleano') {
      return (
        <div className="flex items-center gap-2 pt-1">
          <Switch disabled={preview} checked={!!valor} onCheckedChange={onChange} />
          <span className="text-sm text-muted-foreground">Sí / No</span>
        </div>
      )
    }

    if (campo.tipo === 'seleccion' && campo.multiple) {
      const seleccionadas = Array.isArray(valor) ? valor : []
      const opciones = campo.opciones?.length ? campo.opciones : ['Opción']

      function toggleOpcion(opcion) {
        const yaEsta = seleccionadas.includes(opcion)
        onChange?.(
          yaEsta ? seleccionadas.filter((o) => o !== opcion) : [...seleccionadas, opcion]
        )
      }

      return (
        <div className="space-y-2 pt-1">
          {opciones.map((opcion, i) => (
            <div key={`${opcion}-${i}`} className="flex items-center gap-2">
              <Checkbox
                disabled={preview}
                checked={seleccionadas.includes(opcion)}
                onCheckedChange={() => toggleOpcion(opcion)}
              />
              <span className="text-sm text-muted-foreground">{opcion}</span>
            </div>
          ))}
        </div>
      )
    }

    if (campo.tipo === 'seleccion' && !campo.multiple) {
      const opciones = campo.opciones?.length ? campo.opciones : ['Opción']
      return (
        <Select disabled={preview} value={valor ?? undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Elegí una opción" />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opcion, i) => (
              <SelectItem key={`${opcion}-${i}`} value={opcion || `opcion-${i}`}>
                {opcion}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    return null
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {etiqueta}
        {campo.requerido && <span className="text-destructive"> *</span>}
      </Label>

      {preview || !control ? (
        renderInput(undefined, undefined)
      ) : (
        <Controller
          control={control}
          name={name}
          render={({ field }) => renderInput(field.value, field.onChange)}
        />
      )}
    </div>
  )
}