import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { registerStep1Schema, registerStep2Schema } from '@/lib/validators/auth.schemas'
import { getApiErrorMessage } from '@/api/httpClient'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

function RegisterStepOne({ datosIniciales, onContinuar }) {
  const form = useForm({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: datosIniciales,
  })

  return (
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
        <form onSubmit={form.handleSubmit(onContinuar)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Tobías" autoComplete="given-name" {...field} />
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
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Requena" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
                    placeholder="Al menos 8 caracteres"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Continuar
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  )
}

function RegisterStepTwo({ datosIniciales, isSubmitting, onConfirmar, onVolver }) {
  const form = useForm({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: datosIniciales,
  })

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onConfirmar)} className="space-y-4">
          <FormField
            control={form.control}
            name="nombreOrganizacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de tu organización</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Parroquia San Juan" autoFocus {...field} />
                </FormControl>
                <FormDescription>
                  Podés omitir este paso y completarlo más adelante.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onVolver}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </Form>

      <button
        type="button"
        onClick={() => onConfirmar({ nombreOrganizacion: '' })}
        disabled={isSubmitting}
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
      >
        Omitir por ahora
      </button>
    </div>
  )
}

const STEP_CONTENT = {
  1: {
    title: 'Creá tu cuenta',
    description: 'Empezá a organizar tus eventos en minutos.',
  },
  2: {
    title: 'Tu organización',
    description: 'Parroquia, diócesis o movimiento pastoral.',
  },
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [datosPaso1, setDatosPaso1] = useState({
    nombre: '',
    apellido: '',
    email: '',
    contrasena: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleContinuar(valoresPaso1) {
    setDatosPaso1(valoresPaso1)
    setStep(2)
  }

  async function handleConfirmar({ nombreOrganizacion }) {
    setIsSubmitting(true)
    try {
      const nombreOrg = nombreOrganizacion?.trim()
      await register({
        ...datosPaso1,
        // Si no completó el nombre, no mandamos el campo: el back
        // crea una organización implícita automáticamente.
        ...(nombreOrg ? { organizacion: { nombre: nombreOrg } } : {}),
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No pudimos crear tu cuenta.'))
      setIsSubmitting(false)
    }
  }

  const { title, description } = STEP_CONTENT[step]

  return (
    <AuthLayout title={title} description={description}>
      {step === 1 ? (
        <RegisterStepOne datosIniciales={datosPaso1} onContinuar={handleContinuar} />
      ) : (
        <RegisterStepTwo
          datosIniciales={{ nombreOrganizacion: '' }}
          isSubmitting={isSubmitting}
          onConfirmar={handleConfirmar}
          onVolver={() => setStep(1)}
        />
      )}
    </AuthLayout>
  )
}