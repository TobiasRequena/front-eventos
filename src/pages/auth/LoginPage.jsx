import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { loginSchema } from '@/lib/validators/auth.schemas'
import { getApiErrorMessage } from '@/api/httpClient'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', contrasena: '' },
  })

  async function onSubmit(values) {
    setIsSubmitting(true)
    try {
      await login(values)
      const destino = location.state?.from?.pathname ?? '/dashboard'
      navigate(destino, { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No pudimos iniciar sesión.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Iniciá sesión"
      description="Gestioná tus eventos desde un solo lugar."
    >
      <div className="space-y-6">
        {/* <GoogleAuthButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">o continuá con email</span>
          </div>
        </div> */}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contrasena"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Creá una organización
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}