import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { toast } from 'sonner'
import { CheckCircle2, ChevronLeft, ChevronRight, Download, Eye, Loader2, Mail, RotateCcw, Undo2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { eventoTieneCosto } from '@/lib/costoEvento'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { FiltrosBarConectado } from '@/components/ui/filtros-bar-conectado'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { useFiltrosBar } from '@/hooks/useFiltrosBar'
import { OPCIONES_ESTADO_PAGO, OPCIONES_EDAD } from '@/components/eventos/detalle/ParticipantesDataTable'
import { ESTADO_PAGO_CONFIG } from '@/components/eventos/detalle/participantes.columns'
import { enviarMailAusentes } from '@/api/comunicaciones.api'
import { descargarListaAsistenciaPdf } from '@/api/participantes.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { cn } from '@/lib/utils'

const MENSAJE_MAX_LENGTH = 2000

const OPCIONES_ESTADO_ASISTENCIA = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'presente', label: 'Presente' },
  { value: 'ausente', label: 'Ausente' },
]

const PAGE_SIZE = 10

const buscarParticipante = (p, q) =>
  p.nombre.toLowerCase().includes(q) ||
  p.apellido.toLowerCase().includes(q) ||
  String(p.dni ?? '').includes(q)

function EstadoAsistenciaBadge({ estado }) {
  if (estado === 'presente') return <Badge className="bg-emerald-600 text-white">Presente</Badge>
  if (estado === 'ausente') return <Badge variant="destructive">Ausente</Badge>
  return <Badge variant="outline">Pendiente</Badge>
}

function ParticipanteCard({ participante, className }) {
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="flex flex-col items-center gap-1 py-6 text-center">
        <p className="text-lg font-medium text-foreground">
          {participante.nombre} {participante.apellido}
        </p>
        <p className="text-sm text-muted-foreground">DNI {participante.dni}</p>
      </CardContent>
    </Card>
  )
}

function PasarListaDialog({ open, onOpenChange, pendientes, total, contados, onMarcar, onDeshacer, puedeDeshacer, repasando }) {
  const cardActual = pendientes[0]
  const siguientes = pendientes.slice(1, 3)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pasar lista</DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">
          {contados}/{total} contados
        </p>

        {cardActual ? (
          <>
            <div className="relative mx-auto w-full max-w-xs pb-2">
              {siguientes.map((p, i) => (
                <div
                  key={p.id}
                  className="pointer-events-none absolute inset-x-0 top-0 -z-10"
                  style={{
                    transform: `translateY(${(i + 1) * 8}px) scale(${1 - (i + 1) * 0.04})`,
                    opacity: 0.6 - i * 0.2,
                  }}
                >
                  <ParticipanteCard participante={p} />
                </div>
              ))}
              <ParticipanteCard participante={cardActual} className="relative" />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className={cn(
                  'h-12 flex-1 cursor-pointer gap-2 text-base text-destructive',
                  repasando && cardActual._estadoAsistencia === 'ausente' && 'bg-destructive/5'
                )}
                onClick={() => onMarcar(cardActual.id, 'ausente')}
              >
                <XCircle className="h-5 w-5" />
                Ausente
              </Button>
              <Button
                variant="outline"
                className={cn(
                  'h-12 flex-1 cursor-pointer gap-2 text-base text-emerald-600',
                  repasando && cardActual._estadoAsistencia === 'presente' && 'bg-emerald-600/5'
                )}
                onClick={() => onMarcar(cardActual.id, 'presente')}
              >
                <CheckCircle2 className="h-5 w-5" />
                Presente
              </Button>
            </div>

            {puedeDeshacer && (
              <Button variant="ghost" size="sm" className="mx-auto gap-1.5 text-muted-foreground" onClick={onDeshacer}>
                <Undo2 className="h-3.5 w-3.5" />
                Deshacer
              </Button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            <p className="text-sm font-medium text-foreground">¡Lista completa!</p>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EnviarMailAusentesDialog({ open, onOpenChange, ausentes, eventoId, onEnviado }) {
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  const mensajeValido = mensaje.trim().length > 0 && mensaje.length <= MENSAJE_MAX_LENGTH

  async function handleEnviar() {
    setEnviando(true)
    try {
      const { enviados, total } = await enviarMailAusentes(eventoId, {
        participanteIds: ausentes.map((p) => p.id),
        mensaje: mensaje.trim(),
      })
      toast.success(`Se enviaron ${enviados} de ${total} mails.`)
      setMensaje('')
      onOpenChange(false)
      onEnviado?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos enviar los mails.'))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !enviando && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar mail a ausentes</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Se va a enviar a {ausentes.length} participante{ausentes.length !== 1 ? 's' : ''} marcado{ausentes.length !== 1 ? 's' : ''} como ausente.
        </p>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">Mensaje</Label>
          <Textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Escribí el mensaje que va a recibir cada ausente..."
            maxLength={MENSAJE_MAX_LENGTH}
            rows={5}
            disabled={enviando}
          />
          <p className="text-right text-xs text-muted-foreground">
            {mensaje.length}/{MENSAJE_MAX_LENGTH}
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={!mensajeValido || enviando}>
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function PasarListaTab({ evento, participantes, camposForm = [], participantesCargando }) {
  const [asistencia, setAsistencia] = useState({})
  const [orden, setOrden] = useState([])
  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [confirmReiniciar, setConfirmReiniciar] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({})
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [envioAbierto, setEnvioAbierto] = useState(false)
  const [repasando, setRepasando] = useState(false)
  const [colaRepaso, setColaRepaso] = useState([])
  const [descargando, setDescargando] = useState(false)

  const tieneCosto = eventoTieneCosto(evento)
  const tieneGrupos = evento?.tiene_grupos ?? false

  const camposSeleccion = useMemo(
    () => camposForm.filter((campo) => campo.tipo === 'seleccion' && campo.opciones?.length > 0),
    [camposForm]
  )

  const dataConEstado = useMemo(
    () => participantes.map((p) => ({ ...p, _estadoAsistencia: asistencia[p.id] ?? 'pendiente' })),
    [participantes, asistencia]
  )

  const grupos = useMemo(() => {
    const set = new Set()
    participantes.forEach((p) => { if (p.grupo?.nombre) set.add(p.grupo.nombre) })
    return Array.from(set).sort()
  }, [participantes])

  const filtrosSelect = useMemo(() => {
    const base = [
      {
        key: 'universo',
        label: 'Universo',
        opciones: [
          { value: 'todos', label: 'Inscriptos' },
          { value: 'acreditados', label: 'Acreditados' },
        ],
        predicate: (p, v) => v === 'acreditados' ? !!p.acreditado : true,
      },
      {
        key: 'checkin',
        label: 'Estado',
        opciones: OPCIONES_ESTADO_ASISTENCIA,
        predicate: (p, v) => p._estadoAsistencia === v,
      },
    ]
    if (tieneCosto) {
      base.push({
        key: 'pago',
        label: 'Estado de pago',
        opciones: OPCIONES_ESTADO_PAGO,
        predicate: (p, v) => p.estado_pago === v,
      })
    }
    base.push({
      key: 'edad',
      label: 'Edad',
      opciones: OPCIONES_EDAD,
      predicate: (p, v) => v === 'mayores' ? p.es_mayor : !p.es_mayor,
    })
    if (tieneGrupos && grupos.length > 0) {
      base.push({
        key: 'grupo',
        label: 'Grupo',
        placeholder: 'Todos los grupos',
        opciones: [
          { value: 'todos', label: 'Todos los grupos' },
          { value: 'sin_grupo', label: 'Sin grupo' },
          ...grupos.map((grupo) => ({ value: grupo, label: grupo })),
        ],
        predicate: (p, v) => v === 'sin_grupo' ? !p.grupo?.nombre : p.grupo?.nombre === v,
      })
    }
    camposSeleccion.forEach((campo) => {
      base.push({
        key: `campo_${campo.id}`,
        label: campo.etiqueta,
        opciones: [
          { value: 'todos', label: 'Todos' },
          ...campo.opciones.map((op) => ({ value: op, label: op })),
        ],
        predicate: (p, v) => String(p.respuestas_form?.[campo.id] ?? '') === v,
      })
    })
    return base
  }, [tieneCosto, tieneGrupos, grupos, camposSeleccion])

  const filtrosState = useFiltrosBar({
    data: dataConEstado,
    queryParamKey: 'pasarLista_q',
    buscar: buscarParticipante,
    filtros: filtrosSelect,
  })
  const { datosFiltrados: filtrados } = filtrosState

  const pendientes = useMemo(
    () => filtrados.filter((p) => p._estadoAsistencia === 'pendiente'),
    [filtrados]
  )
  const presentesCount = filtrados.filter((p) => p._estadoAsistencia === 'presente').length
  const ausentesCount = filtrados.filter((p) => p._estadoAsistencia === 'ausente').length
  const totalFiltrados = filtrados.length
  const yaComenzo = Object.keys(asistencia).length > 0
  const listaCompleta = participantes.length > 0 && participantes.every((p) => !!asistencia[p.id])
  const ausentesGlobal = useMemo(
    () => participantes.filter((p) => asistencia[p.id] === 'ausente'),
    [participantes, asistencia]
  )

  async function descargarPdf() {
    const registros = filtrados
      .filter((p) => p._estadoAsistencia !== 'pendiente')
      .map((p) => ({ participanteId: p.id, estado: p._estadoAsistencia }))

    if (registros.length === 0) {
      toast.error('No hay participantes contados para descargar con ese filtro.')
      return
    }

    const filtrosTexto = Object.fromEntries(
      filtrosState.filtrosActivos
        .filter((f) => f.key !== '__busqueda')
        .map((f) => [f.key, f.label.split(': ').slice(1).join(': ')])
    )

    setDescargando(true)
    try {
      await descargarListaAsistenciaPdf(evento.id, { registros, filtros: filtrosTexto }, evento?.codigo)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'No pudimos generar el PDF.'))
    } finally {
      setDescargando(false)
    }
  }

  function marcarDesdeDialog(id, estado) {
    setAsistencia((prev) => ({ ...prev, [id]: estado }))
    setOrden((prev) => [...prev, id])
    if (repasando) setColaRepaso((prev) => prev.slice(1))
  }

  function deshacerUltimo() {
    setOrden((prev) => {
      if (prev.length === 0) return prev
      const ultimoId = prev[prev.length - 1]
      setAsistencia((asis) => {
        const resto = { ...asis }
        delete resto[ultimoId]
        return resto
      })
      return prev.slice(0, -1)
    })
  }

  function alternarDesdeGrilla(id, estadoClicked) {
    setAsistencia((prev) => {
      if (prev[id] === estadoClicked) {
        const resto = { ...prev }
        delete resto[id]
        return resto
      }
      return { ...prev, [id]: estadoClicked }
    })
  }

  function reiniciar() {
    setAsistencia({})
    setOrden([])
    setConfirmReiniciar(false)
  }

  const columns = useMemo(() => {
    const cols = [
      {
        id: 'nombre',
        accessorFn: (row) => `${row.nombre} ${row.apellido}`,
        header: 'Nombre',
        enableHiding: false,
        cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue()}</span>,
      },
      {
        id: 'dni',
        accessorKey: 'dni',
        header: 'DNI',
        enableHiding: false,
      },
      {
        id: 'edad',
        accessorKey: 'edad',
        header: 'Edad',
        enableHiding: true,
        cell: ({ getValue }) => getValue() != null ? `${getValue()} años` : '—',
      },
      ...(tieneGrupos ? [{
        id: 'grupo',
        accessorFn: (row) => row.grupo?.nombre ?? '—',
        header: 'Grupo',
        enableHiding: true,
      }] : []),
      ...(tieneCosto ? [{
        id: 'estado_pago',
        accessorKey: 'estado_pago',
        header: 'Pago',
        enableHiding: true,
        cell: ({ getValue }) => {
          const config = ESTADO_PAGO_CONFIG[getValue()] ?? ESTADO_PAGO_CONFIG.pendiente
          return <Badge variant={config.variant}>{config.label}</Badge>
        },
      }] : []),
      ...camposForm.map((campo) => ({
        id: `campo_${campo.id}`,
        header: campo.etiqueta,
        enableHiding: true,
        accessorFn: (row) => {
          const valor = row.respuestas_form?.[campo.id]
          if (valor === undefined || valor === null) return '—'
          if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
          return String(valor)
        },
      })),
      {
        id: 'estado_asistencia',
        header: 'Estado',
        enableHiding: false,
        cell: ({ row }) => <EstadoAsistenciaBadge estado={row.original._estadoAsistencia} />,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        enableHiding: false,
        cell: ({ row }) => {
          const p = row.original
          const estado = p._estadoAsistencia
          return (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        setParticipanteSeleccionado(p)
                        setDrawerAbierto(true)
                      }}
                      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
                      onClick={() => alternarDesdeGrilla(p.id, 'presente')}
                      className={cn(
                        'cursor-pointer rounded-md p-1.5 transition-colors',
                        estado === 'presente'
                          ? 'bg-emerald-600/10 text-emerald-600'
                          : 'text-muted-foreground hover:bg-accent hover:text-emerald-600'
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{estado === 'presente' ? 'Quitar presente' : 'Marcar presente'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => alternarDesdeGrilla(p.id, 'ausente')}
                      className={cn(
                        'cursor-pointer rounded-md p-1.5 transition-colors',
                        estado === 'ausente'
                          ? 'bg-destructive/10 text-destructive'
                          : 'text-muted-foreground hover:bg-accent hover:text-destructive'
                      )}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{estado === 'ausente' ? 'Quitar ausente' : 'Marcar ausente'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )
        },
      },
    ]
    return cols
  }, [tieneGrupos, tieneCosto, camposForm])

  const table = useReactTable({
    data: filtrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnasOcultables = table.getAllColumns().filter((col) => col.getCanHide())

  if (participantesCargando) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <FiltrosBarConectado
        filtrosState={filtrosState}
        filtros={filtrosSelect}
        busquedaPlaceholder={listaCompleta ? 'Nombre, apellido o DNI...' : 'Se habilita al terminar de pasar lista'}
        busquedaDisabled={!listaCompleta}
        columnas={yaComenzo ? { items: columnasOcultables, onToggle: (column, value) => column.toggleVisibility(value) } : undefined}
        acciones={[
          {
            key: 'descargar',
            icon: Download,
            tooltip: 'Descargar lista (PDF)',
            onClick: descargarPdf,
            disabled: descargando,
            loading: descargando,
          },
          {
            key: 'reiniciar',
            icon: RotateCcw,
            tooltip: 'Reiniciar lista',
            onClick: () => setConfirmReiniciar(true),
            disabled: !yaComenzo,
          },
        ]}
      />

      {!yaComenzo ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-base font-medium text-foreground">¿Listo para pasar lista?</p>
            <Button
              size="lg"
              className="gap-2"
              disabled={totalFiltrados === 0}
              onClick={() => setDialogAbierto(true)}
            >
              Comenzar
            </Button>
            <p className="text-sm text-muted-foreground">
              {totalFiltrados === 0
                ? 'No hay participantes con ese filtro.'
                : `(${totalFiltrados} participante${totalFiltrados !== 1 ? 's' : ''})`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-600 text-white">Presentes: {presentesCount}</Badge>
            <Badge variant="destructive">Ausentes: {ausentesCount}</Badge>
            <Badge variant="outline">
              Contados: {presentesCount + ausentesCount}/{totalFiltrados}
            </Badge>

            {pendientes.length > 0 && (
              <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => { setRepasando(false); setDialogAbierto(true) }}>
                Continuar pasando lista
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => { setColaRepaso(filtrados); setRepasando(true); setDialogAbierto(true) }}
            >
              Repasar todos
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer"
              disabled={ausentesGlobal.length === 0}
              onClick={() => setEnvioAbierto(true)}
            >
              <Mail className="h-3.5 w-3.5" />
              Enviar mail a ausentes
            </Button>
          </div>

          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted hover:bg-muted">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap font-medium text-foreground">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                      No se encontraron participantes con esos filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalFiltrados} participante{totalFiltrados !== 1 ? 's' : ''}
              {totalFiltrados !== participantes.length && ` (de ${participantes.length} totales)`}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Página {table.getState().pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())}
              </p>
              <Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={camposForm}
        evento={evento}
        open={drawerAbierto}
        onClose={() => {
          setDrawerAbierto(false)
          setParticipanteSeleccionado(null)
        }}
      />

      <EnviarMailAusentesDialog
        open={envioAbierto}
        onOpenChange={setEnvioAbierto}
        ausentes={ausentesGlobal}
        eventoId={evento?.id}
      />

      <PasarListaDialog
        open={dialogAbierto}
        onOpenChange={(v) => { setDialogAbierto(v); if (!v) setRepasando(false) }}
        pendientes={repasando ? colaRepaso : pendientes}
        total={totalFiltrados}
        contados={presentesCount + ausentesCount}
        onMarcar={marcarDesdeDialog}
        onDeshacer={deshacerUltimo}
        puedeDeshacer={!repasando && orden.length > 0}
        repasando={repasando}
      />

      <AlertDialog open={confirmReiniciar} onOpenChange={setConfirmReiniciar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reiniciar lista?</AlertDialogTitle>
            <AlertDialogDescription>
              Se van a borrar todas las marcas de presente/ausente hechas hasta ahora.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={reiniciar}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
