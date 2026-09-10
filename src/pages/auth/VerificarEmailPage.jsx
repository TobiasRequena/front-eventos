import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { verificarEmail, reenviarVerificacion } from '@/api/auth.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { useAuth } from '@/contexts/AuthContext'
import { verificarEmailSchemaEmail, verificarEmailSchemaCodigo } from '@/lib/validators/auth.schemas'
import { AuthLayout } from '@/pages/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'

const EXPIRACION_SEGUNDOS = 15 * 60

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

export default function VerificarEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, completarSesion } = useAuth()
  const emailInicial = location.state?.email ?? ''
  // Si venimos de un login bloqueado por 403, tenemos la contraseña a mano
  // para loguear automáticamente apenas se verifique el email.
  const contrasena = location.state?.contrasena
  const [paso, setPaso] = useState(emailInicial ? 'codigo' : 'email')
  const [email, setEmail] = useState(emailInicial)
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)

  const { tiempo, expirado } = useCuentaRegresiva(paso === 'codigo')

  const formEmail = useForm({
    resolver: zodResolver(verificarEmailSchemaEmail),
    defaultValues: { email: emailInicial },
  })

  const formCodigo = useForm({
    resolver: zodResolver(verificarEmailSchemaCodigo),
    defaultValues: { codigo: '' },
  })

  async function onSubmitEmail(values) {
    setEnviando(true)
    try {
      await reenviarVerificacion(values.email)
    } finally {
      // Siempre avanzar para no revelar si el email existe.
      setEmail(values.email)
      setPaso('codigo')
      setEnviando(false)
    }
  }

  async function onSubmitCodigo(values) {
    setEnviando(true)
    try {
      const data = await verificarEmail({ email, codigo: values.codigo })
      toast.success(data?.mensaje ?? 'Email verificado correctamente.')
    } catch (error) {
      const status = error?.response?.status
      if (status === 400) {
        formCodigo.setError('codigo', { message: getApiErrorMessage(error, 'Código inválido o expirado.') })
      } else {
        toast.error(getApiErrorMessage(error, 'No pudimos verificar tu email.'))
      }
      setEnviando(false)
      return
    }

    // Email verificado: si teníamos la contraseña (venía de un login
    // bloqueado por 403) logueamos directo; si no (venía de un registro
    // recién hecho, que ya guardó un token válido) solo completamos la
    // sesión con ese token. Si algo falla, mandamos a /login como respaldo.
    try {
      if (contrasena) {
        await login({ email, contrasena })
      } else {
        await completarSesion()
      }
      navigate('/dashboard', { replace: true })
    } catch {
      navigate('/login', { replace: true })
    } finally {
      setEnviando(false)
    }
  }

  async function handleReenviar() {
    setReenviando(true)
    try {
      const data = await reenviarVerificacion(email)
      toast.success(data?.mensaje ?? 'Código reenviado.')
    } catch {
      toast.success('Si el email existe y no fue verificado, recibirás un nuevo código.')
    } finally {
      setReenviando(false)
    }
  }

  return (
    <AuthLayout
      title="Verificá tu email"
      description={
        paso === 'email'
          ? 'Ingresá tu email para reenviarte el código de verificación.'
          : `Revisá tu correo ${email} e ingresá el código de 6 dígitos que te enviamos.`
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
                  {enviando ? 'Verificando...' : 'Verificar email'}
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
