import { useState } from 'react'
import { ChevronDown, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { CampoFormList } from '@/components/eventos/CampoFormList'
import { CAMPOS_BASE_INSCRIPCION } from '@/lib/constants/camposBase'
import { cn } from '@/lib/utils'

export function SeccionFormularioInscripcion() {
  const [abierto, setAbierto] = useState(false)

  return (
    <Card>
      <Collapsible open={abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between p-6">
            <div className="text-left">
              <h2 className="text-base font-semibold text-foreground">
                Formulario de inscripción
              </h2>
              <p className="text-sm text-muted-foreground">
                Campos que va a completar cada participante.
              </p>
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
          <CardContent className="space-y-5 pt-0">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Campos base (siempre incluidos)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CAMPOS_BASE_INSCRIPCION.map((campo) => (
                  <span
                    key={campo.id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Lock className="h-3 w-3" />
                    {campo.label}
                  </span>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Campos personalizados
              </p>
              <CampoFormList />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}