import { useEffect, useState, useMemo } from 'react'
import { ArrowLeft, Search, ChevronDown, ChevronUp, RefreshCw, Users, UserX, Eye, UserPlus, UserMinus, Loader2, Download, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { getGrupos, getPendientes } from '@/api/gruposTrabajo.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { getParticipantePorId } from '@/api/participantes.api'
import { agregarAGrupo } from '@/api/gruposTrabajo.api'
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
import { quitarDeGrupo } from '@/api/gruposTrabajo.api'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { descargarExcelEsquema, descargarExcelGrupo } from '@/api/gruposTrabajo.api'
import { notificarEsquema, notificarParticipante } from '@/api/gruposTrabajo.api'

const MOTIVO_CONFIG = {
  excluido_admin: { label: 'Excluido por admin', variant: 'outline' },
  excluido_sistema: { label: 'No cumple filtro', variant: 'secondary' },
  sin_clasificar: { label: 'Sin clasificar', variant: 'outline' },
  retirado_manual: { label: 'Retirado manualmente', variant: 'destructive' },
}

function AsignarDialog({ pendiente, grupos, evento, esquema, open, onClose, onAsignado }) {
  const [grupoId, setGrupoId] = useState('')
  const [asignando, setAsignando] = useState(false)

  async function handleConfirmar() {
    if (!grupoId) return
    setAsignando(true)
    try {
      await agregarAGrupo(evento.id, esquema.id, grupoId, pendiente.id)
      toast.success(`${pendiente.nombre} asignado correctamente.`)
      onAsignado(pendiente.id, grupoId, pendiente)
      onClose()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos asignar al participante.'))
    } finally {
      setAsignando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar a grupo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Elegí el grupo al que querés asignar a{' '}
            <span className="font-medium text-foreground">
              {pendiente?.nombre} {pendiente?.apellido}
            </span>.
          </p>
          <Select value={grupoId} onValueChange={setGrupoId}>
            <SelectTrigger>
              <SelectValue placeholder="Elegí un grupo" />
            </SelectTrigger>
            <SelectContent>
              {grupos.map((g) => (
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

function GrupoCard({ grupo, busquedaIntegrantes, onVerDetalle, onQuitar, quitandoId, eventoId, esquemaId }) {
  const [abierto, setAbierto] = useState(false)
  const [descargando, setDescargando] = useState(false)
  const [notificandoId, setNotificandoId] = useState(null)

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
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{grupo.nombre}</p>
            <Badge variant="secondary" className="text-xs">
              {grupo.integrantes.length} integrante{grupo.integrantes.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
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
            </TooltipProvider>
            {abierto
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        </button>
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

function TabGrupos({ grupos, isLoading, onVerDetalle, onQuitar, quitandoId, eventoId, esquemaId }) {
  const [busqueda, setBusqueda] = useState('')

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
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar grupo o participante..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-8"
        />
      </div>

      {gruposFiltrados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No se encontraron grupos.
        </p>
      ) : (
        <div className="columns-2 gap-2 space-y-2">
          {gruposFiltrados.map((grupo) => (
            <GrupoCard
              key={grupo.id}
              grupo={grupo}
              busquedaIntegrantes={busqueda}
              onVerDetalle={onVerDetalle}
              onQuitar={onQuitar}
              quitandoId={quitandoId}
              eventoId={eventoId}
              esquemaId={esquemaId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TabPendientes({ pendientes, setPendientes, grupos, setGrupos, isLoading, evento, esquema, onVerDetalle }) {
  const [pendienteAAsignar, setPendienteAAsignar] = useState(null)

  function handleAsignado(pendienteId, grupoId, pendiente) {
    // Sacar de pendientes
    setPendientes((prev) => prev.filter((p) => p.id !== pendienteId))
    // Agregar al grupo correspondiente
    setGrupos((prev) =>
      prev.map((g) =>
        g.id === grupoId
          ? {
            ...g,
            integrantes: [
              ...g.integrantes,
              {
                id: pendiente.participante_id,
                nombre: pendiente.nombre,
                apellido: pendiente.apellido,
                dni: pendiente.dni,
              },
            ],
          }
          : g
      )
    )
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
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="font-medium text-foreground">Participante</TableHead>
                <TableHead className="font-medium text-foreground">DNI</TableHead>
                <TableHead className="font-medium text-foreground">Motivo</TableHead>
                <TableHead className="w-10">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendientes.map((pendiente) => {
                const motivoConfig = MOTIVO_CONFIG[pendiente.motivo] ?? { label: pendiente.motivo, variant: 'outline' }
                return (
                  <TableRow key={pendiente.id} className="hover:bg-muted/50">
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
                                onClick={() => setPendienteAAsignar(pendiente)}
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

      {pendienteAAsignar && (
        <AsignarDialog
          pendiente={pendienteAAsignar}
          grupos={grupos}
          evento={evento}
          esquema={esquema}
          open={!!pendienteAAsignar}
          onClose={() => setPendienteAAsignar(null)}
          onAsignado={handleAsignado}
        />
      )}
    </>
  )
}

export function GruposResultado({ evento, esquema, onVolver, onRegenerar, cache, setCache }) {
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
      const data = await notificarEsquema(evento.id, esquema.id)

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
      await descargarExcelEsquema(evento.id, esquema.id, esquema.nombre)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVolver} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver al wizard
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">Resultado</p>
            <h3 className="text-base font-semibold text-foreground">{esquema.nombre}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleNotificar} disabled={notificando}>
                  {notificando
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificar a todos por mail</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDescargar} disabled={descargando}>
                  {descargando
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Download className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>Descargar Excel completo</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button variant="outline" size="sm" onClick={onRegenerar} className="gap-1.5">
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
            Pendientes
            {!isLoading && pendientes.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendientes.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="mt-4">
          <TabGrupos
            grupos={grupos}
            isLoading={isLoading}
            onVerDetalle={handleVerDetalle}
            onQuitar={handleQuitar}
            quitandoId={quitandoId}
            eventoId={evento.id}
            esquemaId={esquema.id}
          />
        </TabsContent>

        <TabsContent value="pendientes" className="mt-4">
          <TabPendientes
            pendientes={pendientes}
            setPendientes={setPendientes}
            grupos={grupos}
            setGrupos={setGrupos}
            isLoading={isLoading}
            evento={evento}
            esquema={esquema}
            onVerDetalle={handleVerDetalle}
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