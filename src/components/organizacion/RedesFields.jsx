import { Input } from '@/components/ui/input'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { REDES_CAMPOS } from '@/lib/validators/redes.schemas'

export function RedesFields({ control }) {
  return REDES_CAMPOS.map(({ name, label, placeholder, prefijo }) => (
    <FormField
      key={name}
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label} <span className="font-normal text-muted-foreground">(opcional)</span>
          </FormLabel>
          <div className="flex items-center gap-2">
            {prefijo && <span className="text-sm text-muted-foreground">{prefijo}</span>}
            <FormControl>
              <Input placeholder={placeholder} autoComplete="off" {...field} />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  ))
}
