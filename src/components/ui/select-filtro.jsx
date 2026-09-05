import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/**
 * Select de filtro con label arriba, en el formato que ya usan
 * Pago/Edad/Grupo. `opciones` es [{ value, label }], value/onChange controlan
 * la opción elegida (incluida la opción "todos" si la pasás en `opciones`).
 */
export function SelectFiltro({ label, value, onChange, opciones, placeholder, className }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label className="text-xs text-muted-foreground">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn('w-full sm:w-40', className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((op) => (
            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
