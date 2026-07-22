import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Search, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPCIONES_ESTADO_PAGO = [
  { value: 'todos', label: 'Todos' },
  { value: 'no_aplica', label: 'Sin costo' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobado', label: 'Aprobado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const OPCIONES_EDAD = [
  { value: 'todos', label: 'Todos' },
  { value: 'mayores', label: 'Solo mayores' },
  { value: 'menores', label: 'Solo menores' },
]

const PAGE_SIZE = 10

export function AcreditacionDataTable({
  columns,
  data,
  evento,
  camposForm = [],
  mostrarFiltrosCompletos = false,
  initialColumnVisibility = {},
  onVerDetalle,
}) {
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const [busqueda, setBusqueda] = useState('')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [filtroEdad, setFiltroEdad] = useState('todos')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initial = { dni: false, ...initialColumnVisibility }
    camposForm.forEach((campo) => {
      initial[`campo_${campo.id}`] = false
    })
    return initial
  })

  const grupos = useMemo(() => {
    const set = new Set()
    data.forEach((p) => { if (p.grupo?.nombre) set.add(p.grupo.nombre) })
    return Array.from(set).sort()
  }, [data])

  const datosFiltrados = useMemo(() => {
    return data.filter((p) => {
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const coincide =
          p.nombre.toLowerCase().includes(q) ||
          p.apellido.toLowerCase().includes(q) ||
          p.dni.includes(q) ||
          (p.grupo?.nombre?.toLowerCase().includes(q) ?? false)
        if (!coincide) return false
      }
      if (mostrarFiltrosCompletos) {
        if (filtroPago !== 'todos' && p.estado_pago !== filtroPago) return false
        if (filtroEdad === 'mayores' && !p.es_mayor) return false
        if (filtroEdad === 'menores' && p.es_mayor) return false
        if (filtroGrupo !== 'todos' && p.grupo?.nombre !== filtroGrupo) return false
      }
      return true
    })
  }, [data, busqueda, filtroPago, filtroEdad, filtroGrupo, mostrarFiltrosCompletos])

  const table = useReactTable({
    data: datosFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnasOcultables = table.getAllColumns().filter((col) => col.getCanHide())

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-48">
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nombre, apellido, DNI o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {mostrarFiltrosCompletos && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Edad</Label>
              <Select value={filtroEdad} onValueChange={setFiltroEdad}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCIONES_EDAD.map((op) => (
                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {tieneCosto && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Estado de pago</Label>
                <Select value={filtroPago} onValueChange={setFiltroPago}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_ESTADO_PAGO.map((op) => (
                      <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tieneGrupos && grupos.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Grupo</Label>
                <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grupos</SelectItem>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        {columnasOcultables.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Columnas</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings2 className="h-4 w-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
          </div>
        )}
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
                  colSpan={columns.length}
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
          {datosFiltrados.length !== data.length && ` (de ${data.length} totales)`}
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
    </div>
  )
}