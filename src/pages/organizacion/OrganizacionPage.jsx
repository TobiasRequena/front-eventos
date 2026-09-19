import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useAuth } from '@/contexts/AuthContext'
import { getOrganizacion, patchOrganizacion } from '@/api/organizaciones.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { RedesFields } from '@/components/organizacion/RedesFields'
import { redesFields, REDES_VACIAS, REDES_CAMPOS } from '@/lib/validators/redes.schemas'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(150),
  ...redesFields,
})

const valoresDe = (org) => ({
  nombre: org?.nombre ?? '',
  sitioWeb: org?.sitio_web ?? '',
  instagram: org?.instagram ?? '',
  twitter: org?.twitter ?? '',
  facebook: org?.facebook ?? '',
})

const URL_RED = {
  instagram: (u) => `https://instagram.com/${u}`,
  twitter: (u) => `https://x.com/${u}`,
  facebook: (u) => `https://facebook.com/${u}`,
}

export default function OrganizacionPage() {
  const { orgActiva } = useAuth()
  const [org, setOrg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  useBreadcrumb([{ label: 'Organización' }])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', ...REDES_VACIAS },
  })

  useEffect(() => {
    if (!orgActiva?.id) return
    setIsLoading(true)
    getOrganizacion(orgActiva.id)
      .then((data) => {
        setOrg(data)
        form.reset(valoresDe(data))
      })
      .finally(() => setIsLoading(false))
  }, [orgActiva?.id])

  async function onSubmit(values) {
    setGuardando(true)
    try {
      const actualizada = await patchOrganizacion(orgActiva.id, values)
      setOrg(actualizada)
      form.reset(valoresDe(actualizada))
      setEditando(false)
      toast.success('Organización actualizada.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos actualizar la organización.'))
    } finally {
      setGuardando(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const actuales = form.watch()
  const originales = valoresDe(org)
  const sinCambios = Object.keys(originales).every(
    (k) => (actuales[k] ?? '').trim() === originales[k]
  )

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Organización
        </h1>
        <p className="text-sm text-muted-foreground">
          Información y configuración de tu organización.
        </p>
      </div>

      {org?.es_implicita && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu organización todavía no tiene nombre. Completalo para poder invitar miembros y aprovechar todas las funciones.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Datos de la organización</CardTitle>
          {!editando && (
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {editando ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Parroquia San José" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <RedesFields control={form.control} />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditando(false)
                      form.reset(valoresDe(org))
                    }}
                    disabled={guardando}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={guardando || sinCambios}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Nombre</p>
                <p className="text-sm font-medium text-foreground">
                  {org?.es_implicita ? (
                    <span className="text-muted-foreground italic">Sin nombre</span>
                  ) : (
                    org?.nombre
                  )}
                </p>
              </div>
              {REDES_CAMPOS.map(({ name, label }) => {
                const valor = org?.[name === 'sitioWeb' ? 'sitio_web' : name]
                if (!valor) return null
                const href = name === 'sitioWeb' ? valor : URL_RED[name](valor)
                return (
                  <div key={name}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">
                      {/^https?:\/\//i.test(href) ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="underline-offset-4 hover:underline"
                        >
                          {name === 'sitioWeb' || name === 'facebook' ? valor : `@${valor}`}
                        </a>
                      ) : (
                        valor
                      )}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}