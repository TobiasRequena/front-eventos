import { useState, useMemo, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ArrowLeft, Search, CheckCircle2, XCircle, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { getInscriptosTaller } from '@/api/participantes.api'
import { descargarInscriptosTaller } from '@/api/participantes.api'
import { Download, Loader2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useParticipanteDrawer } from '@/hooks/useParticipanteDrawer'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { Eye } from 'lucide-react'

const PAGE_SIZE = 10

export function TallerParticipantesPanel({ bloque, taller, evento, onVolver }) {
  const { participante: participanteSeleccionado, drawerAbierto, cargando, abrirDrawer, cerrarDrawer } = useParticipanteDrawer()
  const [busqueda, setBusqueda] = useState('')
  const [columnVisibility, setColumnVisibility] = useState({
    dni: false,
    acreditado: false,
  })
  const [participantes, setParticipantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [descargando, setDescargando] = useState(false)

  const COLUMNAS = useMemo(() => [
    {
      id: 'nombre',
      header: 'Nombre',
      enableHiding: false,
      accessorFn: (row) => `${row.nombre} ${row.apellido}`,
      cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue()}</span>,
    },
    {
      id: 'dni',
      header: 'DNI',
      accessorKey: 'dni',
      enableHiding: true,
    },
    {
      id: 'acreditado',
      header: 'Acreditado',
      accessorKey: 'acreditado',
      enableHiding: true,
      cell: ({ getValue }) => getValue() ? (
        <span className="flex items-center gap-1.5 text-success text-sm">
          <CheckCircle2 className="h-4 w-4" /> Sí
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <XCircle className="h-4 w-4" /> No
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      enableHiding: false,
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => abrirDrawer(row.original.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ], [abrirDrawer])

  async function handleDescargar() {
    setDescargando(true)
    try {
      await descargarInscriptosTaller(taller.id, taller.nombre)
    } catch {
      toast.error('No pudimos generar el Excel.')
    } finally {
      setDescargando(false)
    }
  }

  useEffect(() => {
    if (!taller?.id) return
    setIsLoading(true)
    getInscriptosTaller(taller.id)
      .then((data) => {
        setParticipantes(data.map((p) => ({
          ...p,
          fecha_nacimiento: p.nacimiento ?? p.fecha_nacimiento,
          acreditado: p.acreditado ?? false,
        })))
      })
      .catch(() => setParticipantes([]))
      .finally(() => setIsLoading(false))
  }, [taller?.id])

  const datosFiltrados = useMemo(() => {
    if (!busqueda) return participantes
    const q = busqueda.toLowerCase()
    return participantes.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q)
    )
  }, [participantes, busqueda])

  const table = useReactTable({
    data: datosFiltrados,
    columns: COLUMNAS,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnasOcultables = table.getAllColumns().filter((col) => col.getCanHide())

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onVolver} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            {bloque && <p className="text-xs text-muted-foreground">{bloque.nombre}</p>}
            <h3 className="text-base font-semibold text-foreground">{taller.nombre}</h3>
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onVolver} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div>
          {bloque && <p className="text-xs text-muted-foreground">{bloque.nombre}</p>}
          <h3 className="text-base font-semibold text-foreground">{taller.nombre}</h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Búsqueda */}
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Columnas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Columnas
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {columnasOcultables.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(value)}
              >
                {typeof column.columnDef.header === 'string'
                  ? column.columnDef.header
                  : column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Descargar */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDescargar}
                disabled={descargando}
                className="border-primary/30 text-primary hover:bg-primary/5 hover:text-primary"
              >
                {descargando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>

            <TooltipContent>Descargar Excel</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
                <TableCell
                  colSpan={COLUMNAS.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No se encontraron participantes.
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
          {datosFiltrados.length} participante{datosFiltrados.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </p>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={evento?.camposForm ?? []}
        evento={evento}
        open={drawerAbierto}
        cargando={cargando}
        onClose={cerrarDrawer}
      />
    </div>
  )
}