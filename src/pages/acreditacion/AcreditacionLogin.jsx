import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ScanLine } from 'lucide-react'
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
  nombre: z.string().min(1, 'Ingresá tu nombre.'),
  apellido: z.string().min(1, 'Ingresá tu apellido.'),
})

export function AcreditacionLogin({ evento, onLogin, isLoading, error }) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', apellido: '' },
  })

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="hidden bg-muted lg:block" />
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <ScanLine className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Acreditación
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {evento.nombre}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Carlos" autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tu apellido</FormLabel>
                        <FormControl>
                          <Input placeholder="García" autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Iniciando...' : 'Comenzar acreditación'}
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