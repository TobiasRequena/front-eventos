import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw, Users, UserX, Eye, UserPlus, UserMinus, Loader2, Download, Send, Settings, ArrowRightLeft, Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { SearchInput } from '@/components/ui/search-input'
import { useSearchParamState } from '@/hooks/useSearchParamState'
import { FiltrosBarConectado } from '@/components/ui/filtros-bar-conectado'
import { useFiltrosBar } from '@/hooks/useFiltrosBar'
import { useFiltrosParticipantes } from '@/hooks/useFiltrosParticipantes'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getGrupos, getPendientes, notificarGrupo, agregarAGrupo, quitarDeGrupo, descargarExcelAgrupacion, descargarExcelGrupo, notificarAgrupacion, notificarParticipante, crearGrupo, renombrarGrupo, eliminarGrupo } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { getParticipantePorId } from '@/api/participantes.api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const MOTIVO_CONFIG = {
  excluido_admin: { label: 'Excluido por admin', variant: 'outline' },
  excluido_sistema: { label: 'No cumple filtro', variant: 'secondary' },
  sin_clasificar: { label: 'Sin asignar', variant: 'outline' },
  retirado_manual: { label: 'Retirado manualmente', variant: 'destructive' },
}

// Asigna (o mueve) uno o varios participantes a un grupo.
function AsignarDialog({ participantes, grupos, excluirGrupoId, evento, esquema, onClose, onAsignado }) {
  const [grupoId, setGrupoId] = useState('')
  const [asignando, setAsignando] = useState(false)
  const opciones = grupos.filter((g) => g.id !== excluirGrupoId)

  async function handleConfirmar() {
    if (!grupoId) return
    setAsignando(true)
    try {
      await agregarAGrupo(evento.id, esquema.id, grupoId, participantes.map((p) => p.id))
      toast.success(
        participantes.length === 1
          ? `${participantes[0].nombre} asignado correctamente.`
          : `${participantes.length} participantes asignados.`
      )
      onAsignado(participantes, grupoId)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos asignar al participante.'))
    } finally {
      setAsignando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{excluirGrupoId ? 'Mover a otro grupo' : 'Asignar a grupo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Elegí el grupo para{' '}
            <span className="font-medium text-foreground">
              {participantes.length === 1
                ? `${participantes[0].nombre} ${participantes[0].apellido}`
                : `${participantes.length} participantes`}
            </span>.
          </p>
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elegí un grupo" />
            </SelectTrigger>
            <SelectContent>
              {opciones.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.nombre} ({g.integrantes.length} integrantes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={asignando}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!grupoId || asignando}>
            {asignando ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GrupoCard({ grupo, busquedaIntegrantes, onVerDetalle, onQuitar, quitandoId, onMover, onRenombrado, onEliminar, eventoId, esquemaId }) {
  const [abierto, setAbierto] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [notificandoId, setNotificandoId] = useState(null)
  const [notificandoGrupo, setNotificandoGrupo] = useState(false)
  const [editandoNombre, setEditandoNombre] = useState(null) // null = no editando
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  async function handleGuardarNombre() {
    const nombre = editandoNombre?.trim()
    if (!nombre || nombre === grupo.nombre) { setEditandoNombre(null); return }
    setGuardandoNombre(true)
    try {
      await renombrarGrupo(eventoId, esquemaId, grupo.id, nombre)
      onRenombrado(grupo.id, nombre)
      setEditandoNombre(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos renombrar el grupo.'))
    } finally {
      setGuardandoNombre(false)
    }
  }

  async function handleNotificarGrupo(e) {
    e.stopPropagation()
    setNotificandoGrupo(true)
    try {
      const data = await notificarGrupo(eventoId, esquemaId, grupo.id)
      toast.success(`Mail enviado a ${data.enviados} integrante${data.enviados !== 1 ? 's' : ''}.`)
    } catch {
      toast.error('No pudimos enviar los mails del grupo.')
    } finally {
      setNotificandoGrupo(false)
    }
  }

  async function handleNotificarParticipante(integrante) {
    setNotificandoId(integrante.id)
    try {
      await notificarParticipante(eventoId, esquemaId, integrante.id)
      toast.success(`Mail enviado a ${integrante.nombre}.`)
    } catch (err) {
      toast.error('No pudimos enviar el mail.')
    } finally {
      setNotificandoId(null)
    }
  }

  async function handleDescargar(e) {
    e.stopPropagation()
    setDescargando(true)
    try {
      await descargarExcelGrupo(eventoId, esquemaId, grupo.id, grupo.nombre)
    } catch {
      toast.error('No pudimos generar el Excel.')
    } finally {
      setDescargando(false)
    }
  }

  const integrantesFiltrados = useMemo(() => {
    if (!busquedaIntegrantes) return grupo.integrantes
    const q = busquedaIntegrantes.toLowerCase()

    if (grupo.nombre.toLowerCase().includes(q)) return grupo.integrantes

    return grupo.integrantes.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.apellido.toLowerCase().includes(q) ||
        i.dni.includes(q)
    )
  }, [grupo.integrantes, busquedaIntegrantes, grupo.nombre])

  useEffect(() => {
    if (busquedaIntegrantes && integrantesFiltrados.length > 0) setAbierto(true)
    if (!busquedaIntegrantes) setAbierto(false)
  }, [busquedaIntegrantes, integrantesFiltrados.length])

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-0">
        <div
          role="button"
          tabIndex={0}
          onClick={() => editandoNombre === null && setAbierto((v) => !v)}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors rounded-t-lg"
        >
          {editandoNombre !== null ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                autoFocus
                value={editandoNombre}
                onChange={(e) => setEditandoNombre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGuardarNombre()
                  if (e.key === 'Escape') setEditandoNombre(null)
                }}
                maxLength={100}
                disabled={guardandoNombre}
                className="h-8 w-40"
              />
              <button
                type="button"
                onClick={handleGuardarNombre}
                disabled={guardandoNombre}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              >
                {guardandoNombre ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setEditandoNombre(null)}
                disabled={guardandoNombre}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{grupo.nombre}</p>
              <Badge variant="secondary" className="text-xs">
                {grupo.integrantes.length} integrante{grupo.integrantes.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditandoNombre(grupo.nombre) }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Renombrar grupo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEliminar(grupo) }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Eliminar grupo</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleDescargar}
                    disabled={descargando}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                  >
                    {descargando
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Download className="h-3.5 w-3.5" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent>Descargar Excel del grupo</TooltipContent>
              </Tooltip>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={handleNotificarGrupo}
                      disabled={notificandoGrupo}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                    >
                      {notificandoGrupo
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Send className="h-3.5 w-3.5" />
                      }
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Notificar grupo por mail</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TooltipProvider>
            {abierto
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </div>
      </CardHeader>

      {abierto && (
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="font-medium text-foreground">Nombre</TableHead>
                <TableHead className="font-medium text-foreground">DNI</TableHead>
                <TableHead className="w-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {integrantesFiltrados.map((integrante) => (
                <TableRow key={integrante.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-foreground">
                    {integrante.nombre} {integrante.apellido}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{integrante.dni}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onVerDetalle?.(integrante)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Ver detalle</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => handleNotificarParticipante(integrante)}
                              disabled={notificandoId === integrante.id}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
                            >
                              {notificandoId === integrante.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Send className="h-4 w-4" />
                              }
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Notificar por mail</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onMover(grupo, integrante)}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Mover a otro grupo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onQuitar?.(grupo, integrante)}
                              disabled={quitandoId === integrante.id}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive disabled:opacity-50"
                            >
                              {quitandoId === integrante.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <UserMinus className="h-4 w-4" />
                              }
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Retirar del grupo</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  )
}

function TabGrupos({ grupos, setGrupos, isLoading, onVerDetalle, onQuitar, quitandoId, onAsignado, onGrupoEliminado, evento, esquema }) {
  const [busqueda, setBusqueda] = useSearchParamState('grupo')
  const [aMover, setAMover] = useState(null) // { grupo, integrante }
  const [aEliminar, setAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [creando, setCreando] = useState(false)

  const gruposFiltrados = useMemo(() => {
    if (!busqueda) return grupos
    const q = busqueda.toLowerCase()
    return grupos.filter(
      (g) =>
        g.nombre.toLowerCase().includes(q) ||
        g.integrantes.some(
          (i) =>
            i.nombre.toLowerCase().includes(q) ||
            i.apellido.toLowerCase().includes(q) ||
            i.dni.includes(q)
        )
    )
  }, [grupos, busqueda])

  const esMobile = useIsMobile()
  const columnas = esMobile
    ? [gruposFiltrados]
    : [gruposFiltrados.filter((_, i) => i % 2 === 0), gruposFiltrados.filter((_, i) => i % 2 === 1)]

  async function handleCrear() {
    setCreando(true)
    try {
      const nuevo = await crearGrupo(evento.id, esquema.id)
      setGrupos((prev) => [...prev, nuevo])
      toast.success(`Grupo ${nuevo.nombre} creado.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos crear el grupo.'))
    } finally {
      setCreando(false)
    }
  }

  function handleRenombrado(grupoId, nombre) {
    setGrupos((prev) => prev.map((g) => (g.id === grupoId ? { ...g, nombre } : g)))
  }

  async function handleEliminar() {
    setEliminando(true)
    try {
      await eliminarGrupo(evento.id, esquema.id, aEliminar.id)
      await onGrupoEliminado(aEliminar.id)
      toast.success(`Grupo ${aEliminar.nombre} eliminado.`)
      setAEliminar(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos eliminar el grupo.'))
    } finally {
      setEliminando(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchInput
            placeholder="Buscar grupo o participante..."
            value={busqueda}
            onChange={setBusqueda}
          />
        </div>
        <Button variant="outline" onClick={handleCrear} disabled={creando} className="gap-1.5">
          {creando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Nuevo grupo
        </Button>
      </div>

      {gruposFiltrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No se encontraron grupos.
        </p>
      ) : (
        // Columnas fijas (pares / impares): abrir una card no reacomoda las demás ni deja huecos
        <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
          {columnas.map((columna, idx) => (
            <div key={idx} className="flex flex-col gap-2">
              {columna.map((grupo) => (
                <GrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  busquedaIntegrantes={busqueda}
                  onVerDetalle={onVerDetalle}
                  onQuitar={onQuitar}
                  quitandoId={quitandoId}
                  onMover={(g, integrante) => setAMover({ grupo: g, integrante })}
                  onRenombrado={handleRenombrado}
                  onEliminar={setAEliminar}
                  eventoId={evento.id}
                  esquemaId={esquema.id}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {aMover && (
        <AsignarDialog
          participantes={[aMover.integrante]}
          grupos={grupos}
          excluirGrupoId={aMover.grupo.id}
          evento={evento}
          esquema={esquema}
          onClose={() => setAMover(null)}
          onAsignado={onAsignado}
        />
      )}

      <AlertDialog open={!!aEliminar} onOpenChange={(v) => !v && setAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el grupo {aEliminar?.nombre}?</AlertDialogTitle>
            <AlertDialogDescription>
              {aEliminar?.integrantes.length
                ? `Sus ${aEliminar.integrantes.length} integrante${aEliminar.integrantes.length !== 1 ? 's' : ''} van a quedar sin asignar.`
                : 'El grupo está vacío.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleEliminar() }}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function buscarPendiente(p, q) {
  return p.nombre.toLowerCase().includes(q) ||
    p.apellido.toLowerCase().includes(q) ||
    p.dni.includes(q)
}

function TabPendientes({ pendientes, participantes, grupos, isLoading, evento, esquema, onVerDetalle, onAsignado }) {
  const [aAsignar, setAAsignar] = useState(null) // array de participantes
  const [seleccionados, setSeleccionados] = useState(() => new Set())

  // Los pendientes vienen livianos del back; se completan con los datos del
  // participante (respuestas del form, pago, grupo…) para poder filtrar por ellos.
  const pendientesCompletos = useMemo(() => {
    const porId = new Map(participantes.map((p) => [p.id, p]))
    return pendientes.map((p) => ({ ...porId.get(p.id), ...p }))
  }, [pendientes, participantes])

  const filtrosParticipante = useFiltrosParticipantes({
    data: pendientesCompletos,
    evento,
    camposForm: evento.camposForm ?? [],
  })

  const filtros = useMemo(() => {
    const motivos = [...new Set(pendientes.map((p) => p.motivo))]
    if (motivos.length < 2) return filtrosParticipante
    return [
      {
        key: 'motivo',
        label: 'Motivo',
        opciones: [
          { value: 'todos', label: 'Todos' },
          ...motivos.map((m) => ({ value: m, label: MOTIVO_CONFIG[m]?.label ?? m })),
        ],
        predicate: (p, v) => p.motivo === v,
      },
      ...filtrosParticipante,
    ]
  }, [pendientes, filtrosParticipante])

  const filtrosState = useFiltrosBar({
    data: pendientesCompletos,
    queryParamKey: 'pendiente',
    buscar: buscarPendiente,
    filtros,
  })
  const filtrados = filtrosState.datosFiltrados

  // Solo cuentan los que siguen pendientes (los asignados desaparecen solos)
  const seleccion = pendientes.filter((p) => seleccionados.has(p.id))
  const todosSeleccionados = filtrados.length > 0 && filtrados.every((p) => seleccionados.has(p.id))

  function toggle(id) {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Opera sobre lo filtrado, sin tocar la selección de lo que está oculto
  function toggleTodos() {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      filtrados.forEach((p) => (todosSeleccionados ? next.delete(p.id) : next.add(p.id)))
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (pendientes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay participantes pendientes. ¡Todos quedaron en algún grupo!
      </p>
    )
  }

  return (
    <>
      {/* Flotante: no desplaza la lista al aparecer */}
      {seleccion.length > 0 && (
        <div className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-2.5 shadow-lg sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2">
          <p className="text-sm text-foreground whitespace-nowrap">
            {seleccion.length} seleccionado{seleccion.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => setSeleccionados(new Set())}>
              Limpiar
            </Button>
            <Button size="sm" onClick={() => setAAsignar(seleccion)} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Asignar a grupo
            </Button>
          </div>
        </div>
      )}

      <div className="mb-3">
        <FiltrosBarConectado
          filtrosState={filtrosState}
          filtros={filtros}
          busquedaPlaceholder="Nombre, apellido o DNI..."
        />
      </div>

      {/* Con la barra flotante visible, espacio extra para que no tape la última fila */}
      <Card className={cn('py-0', seleccion.length > 0 && 'mb-20')}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="w-10">
                  <Checkbox checked={todosSeleccionados} onCheckedChange={toggleTodos} aria-label="Seleccionar todos" />
                </TableHead>
                <TableHead className="font-medium text-foreground">Participante</TableHead>
                <TableHead className="font-medium text-foreground">DNI</TableHead>
                <TableHead className="font-medium text-foreground">Motivo</TableHead>
                <TableHead className="w-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No se encontraron participantes.
                  </TableCell>
                </TableRow>
              )}
              {filtrados.map((pendiente) => {
                const motivoConfig = MOTIVO_CONFIG[pendiente.motivo] ?? { label: pendiente.motivo, variant: 'outline' }
                return (
                  <TableRow key={pendiente.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={seleccionados.has(pendiente.id)}
                        onCheckedChange={() => toggle(pendiente.id)}
                        aria-label={`Seleccionar a ${pendiente.nombre}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {pendiente.nombre} {pendiente.apellido}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pendiente.dni}</TableCell>
                    <TableCell>
                      <Badge variant={motivoConfig.variant} className="text-xs">
                        {motivoConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onVerDetalle?.(pendiente)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Ver detalle</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setAAsignar([pendiente])}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Asignar a grupo</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {aAsignar && (
        <AsignarDialog
          participantes={aAsignar}
          grupos={grupos}
          evento={evento}
          esquema={esquema}
          onClose={() => setAAsignar(null)}
          onAsignado={(participantes, grupoId) => {
            onAsignado(participantes, grupoId)
            setSeleccionados(new Set())
          }}
        />
      )}
    </>
  )
}

export function GruposResultado({ evento, esquema, participantes = [], onVolver, onVolverConfiguracion, onRegenerar, cache, setCache }) {
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [quitandoId, setQuitandoId] = useState(null)
  const [descargando, setDescargando] = useState(false)
  const cached = cache[esquema.id]
  const [grupos, setGrupos] = useState(cached?.grupos ?? [])
  const [pendientes, setPendientes] = useState(cached?.pendientes ?? [])
  const [isLoading, setIsLoading] = useState(!cached)
  const [notificando, setNotificando] = useState(false)

  async function handleNotificar() {
    setNotificando(true)
    try {
      const data = await notificarAgrupacion(evento.id, esquema.id)

      if (data.enviados === 0) {
        toast.error(`No se pudo enviar ningún mail. ${data.errores} error${data.errores !== 1 ? 'es' : ''}.`)
      } else if (data.errores > 0) {
        toast.warning(`Mail enviado a ${data.enviados} de ${data.total} participantes. ${data.errores} error${data.errores !== 1 ? 'es' : ''}.`)
      } else {
        toast.success(`Mail enviado a ${data.enviados} participante${data.enviados !== 1 ? 's' : ''}.`)
      }
    } catch (err) {
      const status = err?.response?.status
      if (status === 400) toast.error('El esquema todavía no fue generado.')
      else toast.error(getApiErrorMessage(err, 'No pudimos enviar los mails.'))
    } finally {
      setNotificando(false)
    }
  }

  async function handleDescargar() {
    setDescargando(true)
    try {
      await descargarExcelAgrupacion(evento.id, esquema.id, esquema.nombre)
    } catch {
      toast.error('No pudimos generar el Excel.')
    } finally {
      setDescargando(false)
    }
  }

  useEffect(() => {
    if (cached) return // ya tenemos los datos
    async function cargar() {
      setIsLoading(true)
      try {
        const [gruposData, pendientesData] = await Promise.all([
          getGrupos(evento.id, esquema.id),
          getPendientes(evento.id, esquema.id),
        ])
        setGrupos(gruposData)
        setPendientes(pendientesData)
        setCache((prev) => ({ ...prev, [esquema.id]: { grupos: gruposData, pendientes: pendientesData } }))
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'No pudimos cargar los grupos.'))
      } finally {
        setIsLoading(false)
      }
    }
    cargar()
  }, [evento.id, esquema.id])

  // Mantener el cache sincronizado con las modificaciones locales (asignar / quitar)
  useEffect(() => {
    if (!isLoading && setCache) {
      setCache((prev) => ({
        ...prev,
        [esquema.id]: { grupos, pendientes },
      }))
    }
  }, [grupos, pendientes, isLoading, esquema.id, setCache])

  async function handleVerDetalle(integrante) {
    setDrawerAbierto(true)
    setParticipanteSeleccionado(null)
    setCargandoDetalle(true)
    try {
      const detalle = await getParticipantePorId(integrante.id)
      setParticipanteSeleccionado({
        ...detalle,
        fecha_nacimiento: detalle.nacimiento,
      })
    } catch {
      toast.error('No pudimos cargar el detalle del participante.')
      setDrawerAbierto(false)
    } finally {
      setCargandoDetalle(false)
    }
  }

  // Refleja localmente una asignación/movimiento ya persistido en el back
  function handleAsignado(participantes, grupoId) {
    const ids = new Set(participantes.map((p) => p.id))
    const nuevos = participantes.map(({ id, nombre, apellido, dni }) => ({ id, nombre, apellido, dni }))
    setPendientes((prev) => prev.filter((p) => !ids.has(p.id)))
    setGrupos((prev) =>
      prev.map((g) => {
        const resto = g.integrantes.filter((i) => !ids.has(i.id))
        return { ...g, integrantes: g.id === grupoId ? [...resto, ...nuevos] : resto }
      })
    )
  }

  async function handleGrupoEliminado(grupoId) {
    setGrupos((prev) => prev.filter((g) => g.id !== grupoId))
    setPendientes(await getPendientes(evento.id, esquema.id))
  }

  async function handleQuitar(grupo, integrante) {
    setQuitandoId(integrante.id)
    try {
      await quitarDeGrupo(evento.id, esquema.id, grupo.id, integrante.id)
      setGrupos((prev) =>
        prev.map((g) =>
          g.id === grupo.id
            ? { ...g, integrantes: g.integrantes.filter((i) => i.id !== integrante.id) }
            : g
        )
      )
      // Recargar pendientes desde el back
      const pendientesActualizados = await getPendientes(evento.id, esquema.id)
      setPendientes(pendientesActualizados)
      toast.success(`${integrante.nombre} retirado del grupo.`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos retirar al participante.'))
    } finally {
      setQuitandoId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        {/* Volver + nombre */}
        <div className="flex w-full items-center justify-between sm:w-auto sm:justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={onVolver}
            className="-ml-2 h-8 gap-1.5 text-muted-foreground cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <div className="flex items-center gap-3 sm:ml-3">
            <div className="hidden h-5 w-px bg-border sm:block" />

            <div className="text-right sm:text-left">
              <h3 className="text-lg font-semibold text-foreground">
                {esquema.nombre}
              </h3>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNotificar}
                  disabled={notificando}
                >
                  {notificando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificar a todos por mail</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDescargar}
                  disabled={descargando}
                >
                  {descargando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Descargar Excel completo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onVolverConfiguracion}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Volver a la configuración</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerar}
            className="h-9 flex-1 gap-1.5 sm:flex-none"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grupos">
        <TabsList>
          <TabsTrigger value="grupos" className="gap-2">
            <Users className="h-4 w-4" />
            Grupos
            {!isLoading && (
              <Badge variant="secondary" className="ml-1">{grupos.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="gap-2">
            <UserX className="h-4 w-4" />
            {esquema.asignacion_manual ? 'Sin asignar' : 'Pendientes'}
            {!isLoading && pendientes.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendientes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="mt-4">
          <TabGrupos
            grupos={grupos}
            setGrupos={setGrupos}
            isLoading={isLoading}
            onVerDetalle={handleVerDetalle}
            onQuitar={handleQuitar}
            quitandoId={quitandoId}
            onAsignado={handleAsignado}
            onGrupoEliminado={handleGrupoEliminado}
            evento={evento}
            esquema={esquema}
          />
        </TabsContent>

        <TabsContent value="pendientes" className="mt-4">
          <TabPendientes
            pendientes={pendientes}
            participantes={participantes}
            grupos={grupos}
            isLoading={isLoading}
            evento={evento}
            esquema={esquema}
            onVerDetalle={handleVerDetalle}
            onAsignado={handleAsignado}
          />
        </TabsContent>

        <ParticipanteDrawer
          participante={participanteSeleccionado}
          camposForm={evento.camposForm ?? []}
          evento={evento}
          open={drawerAbierto}
          cargando={cargandoDetalle}
          onClose={() => {
            setDrawerAbierto(false)
            setParticipanteSeleccionado(null)
          }}
        />
      </Tabs>
    </div>
  )
}