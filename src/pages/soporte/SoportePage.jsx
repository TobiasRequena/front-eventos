import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { HelpCircle, CheckCircle2 } from 'lucide-react'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { enviarContacto } from '@/api/soporte.api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  nombre: z.string().min(1, 'Ingresá tu nombre.').max(100),
  email: z.string().min(1, 'Ingresá tu email.').email('Email inválido.'),
  asunto: z.string().min(1, 'Ingresá el asunto.').max(150),
  mensaje: z.string().min(10, 'El mensaje es muy corto.').max(2000),
})

export default function SoportePage() {
  const [enviado, setEnviado] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useBreadcrumb([{ label: 'Soporte' }])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', asunto: '', mensaje: '' },
  })

  async function onSubmit(values) {
    setEnviando(true)
    try {
      await enviarContacto(values)
      setEnviado(true)
    } catch {
      toast.error('No pudimos enviar tu mensaje. Intentá de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

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
          {enviado ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">¡Mensaje enviado!</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recibimos tu consulta y te responderemos a la brevedad.
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => { setEnviado(false); form.reset() }}
              >
                Enviar otra consulta
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="juan@mail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="asunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="¿En qué podemos ayudarte?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mensaje"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensaje</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describí tu consulta o problema con el mayor detalle posible..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar consulta'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}