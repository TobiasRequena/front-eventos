import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { UserPlus, Trash2 } from 'lucide-react'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'
import { useAuth } from '@/contexts/AuthContext'
import { getMiembros, invitarMiembro, eliminarMiembro } from '@/api/organizaciones.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { cambiarRolMiembro, salirOrganizacion } from '@/api/organizaciones.api'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const invitarSchema = z.object({
  email: z.string().min(1, 'Ingresá el email.').email('Email inválido.'),
})

export default function MiembrosPage() {
  const { orgActiva, usuario } = useAuth()
  const [miembros, setMiembros] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogInvitar, setDialogInvitar] = useState(false)
  const [miembroAEliminar, setMiembroAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  const navigate = useNavigate()
  const [confirmandoSalir, setConfirmandoSalir] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const [cambiandoRol, setCambiandoRol] = useState({})

  async function handleCambiarRol(miembro, nuevoRol) {
    setCambiandoRol((prev) => ({ ...prev, [miembro.id]: true }))
    try {
      await cambiarRolMiembro(orgActiva.id, miembro.id, nuevoRol)
      setMiembros((prev) =>
        prev.map((m) => m.id === miembro.id ? { ...m, rol: nuevoRol } : m)
      )
      toast.success('Rol actualizado.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos cambiar el rol.'))
    } finally {
      setCambiandoRol((prev) => ({ ...prev, [miembro.id]: false }))
    }
  }

  async function handleSalir() {
    setSaliendo(true)
    try {
      await salirOrganizacion(orgActiva.id)
      toast.success('Saliste de la organización.')
      navigate('/dashboard')
    } catch (err) {
      const status = err?.response?.status
      if (status === 409) {
        toast.error('Sos el único admin. Promové a otro miembro antes de salir.')
      } else {
        toast.error(getApiErrorMessage(err, 'No pudimos procesar tu salida.'))
      }
      setSaliendo(false)
    } finally {
      setConfirmandoSalir(false)
    }
  }

  useBreadcrumb([
    { label: 'Organización', to: '/organizacion' },
    { label: 'Miembros' },
  ])

  const form = useForm({
    resolver: zodResolver(invitarSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    if (!orgActiva?.id) return
    cargarMiembros()
  }, [orgActiva?.id])

  async function cargarMiembros() {
    setIsLoading(true)
    getMiembros(orgActiva.id)
      .then(setMiembros)
      .finally(() => setIsLoading(false))
  }

  async function onInvitar(values) {
    try {
      await invitarMiembro(orgActiva.id, { email: values.email })
      toast.success('Miembro invitado correctamente.')
      form.reset()
      setDialogInvitar(false)
      cargarMiembros()
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) toast.error('No existe ningún usuario con ese email.')
      else if (status === 409) toast.error('El usuario ya pertenece a esta organización.')
      else toast.error(getApiErrorMessage(err, 'No pudimos invitar al miembro.'))
    }
  }

  async function handleEliminar() {
    if (!miembroAEliminar) return
    setEliminando(true)
    try {
      await eliminarMiembro(orgActiva.id, miembroAEliminar.id)
      toast.success('Miembro eliminado.')
      setMiembros((prev) => prev.filter((m) => m.id !== miembroAEliminar.id))
      setMiembroAEliminar(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar al miembro.'))
    } finally {
      setEliminando(false)
    }
  }

  const esAdmin = orgActiva?.rol === 'admin'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Miembros
          </h1>
          <p className="text-sm text-muted-foreground">
            Administradores de tu organización.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setConfirmandoSalir(true)}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
          {esAdmin && (
            <Button onClick={() => setDialogInvitar(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invitar miembro
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : miembros.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay miembros en esta organización.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {miembros.map((miembro) => (
                <div key={miembro.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {miembro.nombre} {miembro.apellido}
                      </p>
                      {miembro.email === usuario?.email && (
                        <Badge variant="outline" className="text-xs">Yo</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{miembro.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {esAdmin && miembro.id !== orgActiva?.usuarioId ? (
                      <Select
                        value={miembro.rol}
                        onValueChange={(nuevoRol) => handleCambiarRol(miembro, nuevoRol)}
                        disabled={cambiandoRol[miembro.id]}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="invitado">Invitado</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary">
                        {miembro.rol.charAt(0).toUpperCase() + miembro.rol.slice(1)}
                      </Badge>
                    )}
                    {esAdmin && miembro.id !== orgActiva?.usuarioId && (
                      <button
                        type="button"
                        onClick={() => setMiembroAEliminar(miembro)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog invitar */}
      <Dialog open={dialogInvitar} onOpenChange={setDialogInvitar}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Invitar miembro</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onInvitar)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email del usuario</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="usuario@mail.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <p className="text-xs text-muted-foreground">
                El usuario debe tener una cuenta en la plataforma.
              </p>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogInvitar(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Invitar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog eliminar */}
      <AlertDialog
        open={!!miembroAEliminar}
        onOpenChange={(v) => !v && setMiembroAEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
            <AlertDialogDescription>
              {miembroAEliminar?.nombre} {miembroAEliminar?.apellido} perderá acceso a
              esta organización y a todos sus eventos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmandoSalir} onOpenChange={setConfirmandoSalir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de la organización?</AlertDialogTitle>
            <AlertDialogDescription>
              Perderás acceso a todos los eventos y datos de esta organización.
              Si sos el único admin, tenés que promover a otro miembro antes de salir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saliendo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSalir}
              disabled={saliendo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saliendo ? 'Saliendo...' : 'Sí, salir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}