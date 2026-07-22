import { useEffect, useState, useMemo } from 'react'
import { LogOut, CheckCircle2, XCircle, CalendarRange, Link2, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getIntegrantes, getSolicitudes, responderSolicitud } from '@/api/panelGrupo.api'
import { cn } from '@/lib/utils'

function formatearFecha(fechaIso) {
  if (!fechaIso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(fechaIso))
}

function formatearFechaNac(fechaIso) {
  if (!fechaIso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date(fechaIso))
}

function EventoHeader({ evento, grupo }) {
  const [copiado, setCopiado] = useState(false)
  const linkGrupo = `${import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'}/inscribirse/${evento.codigo}?grupo=${grupo.codigoInv}`

  function copiarLink() {
    navigator.clipboard.writeText(linkGrupo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {evento.imagenUrl && (
        <AspectRatio ratio={16 / 6} className="bg-muted">
          <img src={evento.imagenUrl} alt={evento.nombre} className="h-full w-full object-cover" />
        </AspectRatio>
      )}
      <CardContent className="space-y-3 p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{evento.nombre}</h2>
          {evento.descripcion && (
            <p className="mt-1 text-sm text-muted-foreground">{evento.descripcion}</p>
          )}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarRange className="h-3.5 w-3.5" />
            {formatearFecha(evento.fechaInicio)}
            {' — '}
            {formatearFecha(evento.fechaFin)}
          </div>
        </div>
        <Separator />
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Link de inscripción para tu grupo
          </p>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
            <p className="flex-1 truncate text-xs text-foreground">{linkGrupo}</p>
            <button
              type="button"
              onClick={copiarLink}
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              {copiado
                ? <Check className="h-3.5 w-3.5 text-success" />
                : <Link2 className="h-3.5 w-3.5" />
              }
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TablaParticipantes({ participantes, loading, acciones }) {
  const columns = useMemo(() => {
    const cols = [
      {
        id: 'nombre',
        header: 'Nombre',
        accessorFn: (row) => `${row.nombre} ${row.apellido}`,
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{getValue()}</span>
            {row.original.rol_grupo === 'responsable' && (
              <Badge variant="secondary" className="text-xs">Responsable</Badge>
            )}
          </div>
        ),
      },
      {
        id: 'nacimiento',
        header: 'Fecha de nac.',
        accessorFn: (row) => row.nacimiento ?? row.fecha_nacimiento,
        cell: ({ getValue }) => formatearFechaNac(getValue()),
      },
      {
        id: 'es_mayor',
        header: 'Edad',
        accessorKey: 'es_mayor',
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">
            {getValue() ? 'Mayor' : 'Menor'}
          </span>
        ),
      },
      {
        id: 'estado_pago',
        header: 'Pago',
        accessorKey: 'estado_pago',
        cell: ({ getValue }) => {
          const config = {
            no_aplica: { label: 'Sin costo', variant: 'secondary' },
            pendiente: { label: 'Pendiente', variant: 'outline' },
            aprobado: { label: 'Aprobado', variant: 'default' },
            rechazado: { label: 'Rechazado', variant: 'destructive' },
          }[getValue()] ?? { label: getValue(), variant: 'secondary' }
          return <Badge variant={config.variant}>{config.label}</Badge>
        },
      },
    ]
    if (acciones) {
      cols.push({
        id: 'acciones',
        header: '',
        cell: ({ row }) => acciones(row.original),
      })
    }
    return cols
  }, [acciones])

  const table = useReactTable({
    data: participantes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (participantes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay participantes para mostrar.
      </p>
    )
  }

  return (
    <div className="rounded-md border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id} className="bg-muted hover:bg-muted">
              {hg.headers.map((header) => (
                <TableHead key={header.id} className="whitespace-nowrap font-medium text-foreground">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="hover:bg-muted/50">
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function PanelGrupoPanel({ sesion, onLogout }) {
  const { token, grupo, responsable, evento } = sesion
  const [integrantes, setIntegrantes] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(true)
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [procesando, setProcesando] = useState({})

  useEffect(() => {
    getIntegrantes(grupo.id, token)
      .then(setIntegrantes)
      .catch(() => toast.error('No pudimos cargar los integrantes.'))
      .finally(() => setLoadingIntegrantes(false))

    getSolicitudes(grupo.id, token)
      .then(setSolicitudes)
      .catch(() => toast.error('No pudimos cargar las solicitudes.'))
      .finally(() => setLoadingSolicitudes(false))
  }, [grupo.id, token])

  function onTokenExpirado() {
    toast.error('Tu sesión expiró. Ingresá de nuevo.')
    onLogout()
  }

  async function cargarDatos() {
    setLoadingIntegrantes(true)
    setLoadingSolicitudes(true)
    try {
      const [ints, sols] = await Promise.all([
        getIntegrantes(grupo.id, token, onTokenExpirado),
        getSolicitudes(grupo.id, token, onTokenExpirado),
      ])
      setIntegrantes(ints.filter((p) => p.estado_vinculo !== 'pendiente'))
      setSolicitudes(sols)
    } catch {
      // si fue 401, onTokenExpirado ya manejó el logout
    } finally {
      setLoadingIntegrantes(false)
      setLoadingSolicitudes(false)
    }
  }

  async function handleResponder(participanteId, estado) {
    setProcesando((prev) => ({ ...prev, [participanteId]: true }))
    try {
      await responderSolicitud(participanteId, estado, token, onTokenExpirado)
      toast.success(estado === 'aceptado' ? 'Solicitud aceptada.' : 'Solicitud rechazada.')
      await cargarDatos()
    } catch {
      // si fue 401, onTokenExpirado ya manejó el logout
      setProcesando((prev) => ({ ...prev, [participanteId]: false }))
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [grupo.id, token])

  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Hola, <span className="font-medium text-foreground">{responsable.nombre}</span>
            </p>
            <h1 className="text-xl font-semibold text-foreground">{grupo.nombre}</h1>
            {(grupo.parroquia || grupo.localidad) && (
              <p className="text-xs text-muted-foreground">
                {[grupo.parroquia, grupo.localidad].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cargarDatos}
              disabled={loadingIntegrantes || loadingSolicitudes}
              className="gap-2"
            >
              <RefreshCw className={cn(
                'h-4 w-4',
                (loadingIntegrantes || loadingSolicitudes) && 'animate-spin'
              )} />
              Actualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Salir
            </Button>
          </div>
        </div>

        <EventoHeader evento={evento} grupo={grupo} />

        <Tabs defaultValue="integrantes">
          <TabsList>
            <TabsTrigger value="integrantes">
              Integrantes
              {!loadingIntegrantes && (
                <Badge variant="secondary" className="ml-2">{integrantes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="solicitudes">
              Solicitudes pendientes
              {!loadingSolicitudes && solicitudes.length > 0 && (
                <Badge variant="destructive" className="ml-2">{solicitudes.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="integrantes" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <TablaParticipantes
                  participantes={integrantes}
                  loading={loadingIntegrantes}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="solicitudes" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <TablaParticipantes
                  participantes={solicitudes}
                  loading={loadingSolicitudes}
                  acciones={(solicitud) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={procesando[solicitud.id]}
                        onClick={() => handleResponder(solicitud.id, 'aceptado')}
                        className="gap-1.5 text-success border-success/30 hover:bg-success/10"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aceptar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={procesando[solicitud.id]}
                        onClick={() => handleResponder(solicitud.id, 'rechazado')}
                        className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}