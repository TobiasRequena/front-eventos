import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  dni: z.string().min(7, 'DNI inválido.').max(8).regex(/^\d+$/, 'Solo números.'),
  codigoGrupo: z.string().min(1, 'Ingresá el código de grupo.'),
})

export function PanelGrupoLogin({ codigoGrupo, onLogin, isLoading, error }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { dni: '', codigoGrupo: codigoGrupo ?? '' },
  })

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="hidden bg-muted lg:block" />

      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Panel de referente
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ingresá con tu DNI y el código de tu grupo.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DNI</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigoGrupo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código de grupo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="AB3K9XZ2"
                            className="uppercase"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}