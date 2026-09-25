import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import { FormularioContacto } from '@/components/soporte/FormularioContacto'

export default function SoportePage() {
  useBreadcrumb([{ label: 'Soporte' }])

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Soporte</h1>
        <p className="text-sm text-muted-foreground">
          ¿Tenés algún problema o consulta? Completá el formulario y te respondemos a la brevedad.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <FormularioContacto />
        </CardContent>
      </Card>
    </div>
  )
}
