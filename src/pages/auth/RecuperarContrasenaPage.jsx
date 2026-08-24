import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { recuperarContrasena, resetContrasena } from '@/api/auth.api'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

const EXPIRACION_SEGUNDOS = 15 * 60

const schemaEmail = z.object({
  email: z.string().min(1, 'Ingresá tu email.').email('Email inválido.'),
})

const schemaCodigo = z.object({
  codigo: z.string().length(6, 'El código tiene 6 dígitos.').regex(/^\d+$/, 'Solo números.'),
  nuevaContrasena: z.string().min(8, 'Mínimo 8 caracteres.'),
  confirmar: z.string().min(1, 'Confirmá la contraseña.'),
}).refine((d) => d.nuevaContrasena === d.confirmar, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmar'],
})

function useCuentaRegresiva(activo) {
  const [segundos, setSegundos] = useState(EXPIRACION_SEGUNDOS)

  useEffect(() => {
    if (!activo) return
    setSegundos(EXPIRACION_SEGUNDOS)
    const interval = setInterval(() => {
      setSegundos((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [activo])

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')
  return { tiempo: `${mm}:${ss}`, expirado: segundos === 0 }
}

export default function RecuperarContrasenaPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState('email') // 'email' | 'codigo'
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)

  const { tiempo, expirado } = useCuentaRegresiva(paso === 'codigo')

  const formEmail = useForm({
    resolver: zodResolver(schemaEmail),
    defaultValues: { email: '' },
  })

  const formCodigo = useForm({
    resolver: zodResolver(schemaCodigo),
    defaultValues: { codigo: '', nuevaContrasena: '', confirmar: '' },
  })

  async function onSubmitEmail(values) {
    setEnviando(true)
    try {
      await recuperarContrasena(values.email)
      setEmail(values.email)
      setPaso('codigo')
    } catch {
      // Siempre avanzar para no revelar si el email existe
      setEmail(values.email)
      setPaso('codigo')
    } finally {
      setEnviando(false)
    }
  }

  async function onSubmitCodigo(values) {
    setEnviando(true)
    try {
      await resetContrasena({
        email,
        codigo: values.codigo,
        nuevaContrasena: values.nuevaContrasena,
      })
      toast.success('Contraseña actualizada correctamente.')
      navigate('/login')
    } catch (err) {
      const status = err?.response?.status
      if (status === 400) {
        formCodigo.setError('codigo', { message: 'Código inválido o expirado.' })
      } else {
        toast.error('No pudimos restablecer la contraseña.')
      }
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviar() {
    setReenviando(true)
    try {
      await recuperarContrasena(email)
      toast.success('Código reenviado.')
    } catch {
      toast.success('Código reenviado.')
    } finally {
      setReenviando(false)
    }
  }
  return (
    <AuthLayout
      title={paso === 'email' ? 'Recuperar contraseña' : 'Ingresá el código'}
      description={
        paso === 'email'
          ? 'Te enviaremos un código de 6 dígitos a tu email.'
          : `Revisá tu correo ${email} e ingresá el código que te enviamos.`
      }
    >
      <Card className="overflow-visible">
        <CardContent className="pt-6">
          {paso === 'email' ? (
            <Form {...formEmail}>
              <form onSubmit={formEmail.handleSubmit(onSubmitEmail)} className="space-y-4">
                <FormField
                  control={formEmail.control}
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
                <Button type="submit" className="w-full" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar código'}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Volver al login
                  </Link>
                </p>
              </form>
            </Form>
          ) : (
            <Form {...formCodigo}>
              <form onSubmit={formCodigo.handleSubmit(onSubmitCodigo)} className="space-y-4">
                <FormField
                  control={formCodigo.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex w-full justify-center">
                        Código de 6 dígitos
                      </FormLabel>

                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formCodigo.control}
                  name="nuevaContrasena"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Mínimo 8 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={formCodigo.control}
                  name="confirmar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar contraseña</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Repetí la contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {expirado ? (
                    <span className="text-destructive">Código expirado</span>
                  ) : (
                    <span className="tabular-nums">Expira en {tiempo}</span>
                  )}
                  <button
                    type="button"
                    onClick={handleReenviar}
                    disabled={reenviando}
                    className="underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    {reenviando ? 'Enviando...' : 'Reenviar código'}
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={enviando || expirado}>
                  {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
                </Button>

                <button
                  type="button"
                  onClick={() => setPaso('email')}
                  className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Usar otro email
                </button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}