import { useFormContext } from 'react-hook-form'
import { CheckCircle2, XCircle, Loader2, HelpCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCodigoDisponible } from '@/hooks/useCodigoDisponible'

const ESTADO_CONFIG = {
  checking: { icon: Loader2, className: 'animate-spin text-muted-foreground', texto: 'Verificando...' },
  disponible: { icon: CheckCircle2, className: 'text-success', texto: 'Código disponible' },
  no_disponible: { icon: XCircle, className: 'text-destructive', texto: 'Código ya en uso' },
  error: { icon: XCircle, className: 'text-muted-foreground', texto: 'No se pudo verificar' },
}

export function CodigoInput({ codigoOriginal }) {
  const form = useFormContext()
  const codigo = form.watch('codigo')
  const estadoDisponibilidad = useCodigoDisponible(codigo, codigoOriginal)

  const config = ESTADO_CONFIG[estadoDisponibilidad]

  return (
    <FormField
      control={form.control}
      name="codigo"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1.5">
            <FormLabel>Código</FormLabel>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-56 text-center">
                  Identificador público del evento. Se usa en el link de inscripción y en los QRs
                  de acreditación. Solo letras, números y guiones. Ej: RETIRO2026
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <FormControl>
            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  placeholder="Ej. RETIRO2026"
                  className="uppercase pr-9"
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                />
                {config && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <config.icon className={`h-4 w-4 ${config.className}`} />
                        </TooltipTrigger>
                        <TooltipContent>{config.texto}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              {estadoDisponibilidad === 'disponible' && codigo?.length >= 3 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium break-all">
                    {import.meta.env.VITE_API_URL_FRONT}/inscribirse/{codigo}
                  </span>
                </p>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}