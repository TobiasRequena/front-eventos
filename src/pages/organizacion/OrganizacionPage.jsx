import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useAuth } from '@/contexts/AuthContext'
import { getOrganizacion, patchOrganizacion } from '@/api/organizaciones.api'
import { subirLogoOrganizacion } from '@/api/landing.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { AlertTriangle, ImageUp } from 'lucide-react'
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

// Cambios que se guardan al instante (logo y switch), sin pasar por "Editar"
function useGuardarAlInstante(org, onActualizada) {
  const [guardando, setGuardando] = useState(false)

  async function guardar(accion, mensajeError) {
    setGuardando(true)
    try {
      const actualizada = await accion()
      onActualizada({ ...actualizada, rol: org.rol })
    } catch (err) {
      toast.error(getApiErrorMessage(err, mensajeError))
    } finally {
      setGuardando(false)
    }
  }

  return { guardando, guardar }
}

function LogoOrganizacion({ org, conBoton, guardando, guardar }) {
  function elegirLogo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (archivo) guardar(() => subirLogoOrganizacion(org.id, archivo), 'No pudimos subir el logo.')
  }

  return (
    <div className="flex items-center gap-4">
      {org.logo_url ? (
        <img src={org.logo_url} alt="Logo de la organización" className="size-20 shrink-0 rounded-full border border-border bg-background object-contain" />
      ) : (
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ImageUp className="size-7" />
        </div>
      )}
      {conBoton && (
        <div className="space-y-1">
          <Button asChild variant="outline" size="sm" disabled={guardando}>
            <label className={guardando ? 'pointer-events-none opacity-50' : 'cursor-pointer'}>
              {org.logo_url ? 'Cambiar logo' : 'Subir logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={elegirLogo} disabled={guardando} />
            </label>
          </Button>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WebP, hasta 5 MB. Mejor si es cuadrado. Se guarda al elegirlo.
          </p>
        </div>
      )}
    </div>
  )
}

function SwitchGraciasPorElegirnos({ org, esAdmin, guardando, guardar }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="space-y-0.5">
        <Label htmlFor="mostrar-en-landing">Aparecer en “Gracias por elegirnos”</Label>
        <p className="text-xs text-muted-foreground">
          Mostramos tu logo (o tus iniciales) y tu nombre en la página de Talita Encuentro.
        </p>
      </div>
      <Switch
        id="mostrar-en-landing"
        checked={org.mostrar_en_landing ?? false}
        disabled={!esAdmin || guardando}
        onCheckedChange={(v) =>
          guardar(() => patchOrganizacion(org.id, { nombre: org.nombre, mostrarEnLanding: v }), 'No pudimos guardar el cambio.')
        }
        className="shrink-0"
      />
    </div>
  )
}

function SeccionEdicion({ titulo, children }) {
  return (
    <section className="space-y-3 border-t border-border pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      {children}
    </section>
  )
}

export default function OrganizacionPage() {
  const { orgActiva } = useAuth()
  const [org, setOrg] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const alInstante = useGuardarAlInstante(org ?? {}, setOrg)
  const esAdmin = org?.rol === 'admin'

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
          <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Datos de la organización
          </CardTitle>
          {!editando && (
            <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {editando ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <SeccionEdicion titulo="Logo">
                  <LogoOrganizacion org={org} conBoton={esAdmin} {...alInstante} />
                </SeccionEdicion>
                <SeccionEdicion titulo="Nombre">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="sr-only">Nombre</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Parroquia San José" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </SeccionEdicion>
                <SeccionEdicion titulo="Redes">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <RedesFields control={form.control} />
                  </div>
                </SeccionEdicion>
                <div className="flex justify-end gap-2 border-t border-border pt-5">
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
            <>
              <div className="flex items-center gap-5">
                <LogoOrganizacion org={org} />
                <p className="min-w-0 text-2xl font-semibold tracking-tight break-words text-foreground">
                  {org?.es_implicita ? <span className="text-muted-foreground italic">Sin nombre</span> : org?.nombre}
                </p>
              </div>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {REDES_CAMPOS.map(({ name, label }) => {
                  const valor = org?.[name === 'sitioWeb' ? 'sitio_web' : name]
                  if (!valor) return null
                  const href = name === 'sitioWeb' ? valor : URL_RED[name](valor)
                  const texto = name === 'sitioWeb' || name === 'facebook' ? valor : `@${valor}`
                  return (
                    <li key={name} className="text-sm">
                      <span className="text-muted-foreground">{label}: </span>
                      {/^https?:\/\//i.test(href) ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {texto}
                        </a>
                      ) : (
                        <span className="font-medium text-foreground">{valor}</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          {/* Una organización implícita no aparece en la página (y el PATCH la formalizaría) */}
          {org && !org.es_implicita && <SwitchGraciasPorElegirnos org={org} esAdmin={esAdmin} {...alInstante} />}
        </CardContent>
      </Card>
    </div>
  )
}