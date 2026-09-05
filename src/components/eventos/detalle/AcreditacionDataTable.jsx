import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Settings2, RefreshCw, Loader2 } from 'lucide-react'
import { SearchInput } from '@/components/ui/search-input'
import { SelectFiltro } from '@/components/ui/select-filtro'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useSearchParamState } from '@/hooks/useSearchParamState'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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
  columns, data, evento, camposForm = [], mostrarFiltrosCompletos = false,
  initialColumnVisibility = {}, onVerDetalle, onRefresh, refreshing = false,
  acreditadores = [],
}) {
  const [filtroAcreditador, setFiltroAcreditador] = useState('todos')
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const [busqueda, setBusqueda] = useSearchParamState('acreditado')
  const [filtroPago, setFiltroPago] = useState('todos')
  const [filtroEdad, setFiltroEdad] = useState('todos')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')
  const [filtrosCampos, setFiltrosCampos] = useState({})

  const camposSeleccion = useMemo(
    () => camposForm.filter((campo) => campo.tipo === 'seleccion' && campo.opciones?.length > 0),
    [camposForm]
  )

  function setFiltroCampo(campoId, valor) {
    setFiltrosCampos((prev) => ({ ...prev, [campoId]: valor }))
  }
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
        if (filtroAcreditador !== 'todos') {
          const nombreAcreditador = normalizar(`${p.acreditador?.nombre ?? ''} ${p.acreditador?.apellido ?? ''}`)
          if (nombreAcreditador !== filtroAcreditador) return false
        }
        if (filtroPago !== 'todos' && p.estado_pago !== filtroPago) return false
        if (filtroEdad === 'mayores' && !p.es_mayor) return false
        if (filtroEdad === 'menores' && p.es_mayor) return false
        if (filtroGrupo !== 'todos' && p.grupo?.nombre !== filtroGrupo) return false
        for (const campo of camposSeleccion) {
          const valor = filtrosCampos[campo.id] ?? 'todos'
          if (valor !== 'todos' && String(p.respuestas_form?.[campo.id] ?? '') !== valor) return false
        }
      }
      return true
    })
  }, [data, busqueda, filtroPago, filtroEdad, filtroGrupo, mostrarFiltrosCompletos, camposSeleccion, filtrosCampos])

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

  function normalizar(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  const acreditadoresUnicos = useMemo(() => {
    const vistos = new Set()
    return acreditadores.filter((a) => {
      const key = normalizar(`${a.nombre} ${a.apellido}`)
      if (vistos.has(key)) return false
      vistos.add(key)
      return true
    })
  }, [acreditadores])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-48">
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <SearchInput
            placeholder="Nombre, apellido, DNI o grupo..."
            value={busqueda}
            onChange={setBusqueda}
          />
        </div>

        {mostrarFiltrosCompletos && (
          <>
            <SelectFiltro
              label="Edad"
              value={filtroEdad}
              onChange={setFiltroEdad}
              opciones={OPCIONES_EDAD}
              className="w-36"
            />

            {tieneCosto && (
              <SelectFiltro
                label="Estado de pago"
                value={filtroPago}
                onChange={setFiltroPago}
                opciones={OPCIONES_ESTADO_PAGO}
              />
            )}

            {tieneGrupos && grupos.length > 0 && (
              <SelectFiltro
                label="Grupo"
                value={filtroGrupo}
                onChange={setFiltroGrupo}
                placeholder="Todos los grupos"
                className="w-44"
                opciones={[
                  { value: 'todos', label: 'Todos los grupos' },
                  ...grupos.map((grupo) => ({ value: grupo, label: grupo })),
                ]}
              />
            )}

            {acreditadores.length > 0 && (
              <SelectFiltro
                label="Acreditador"
                value={filtroAcreditador}
                onChange={setFiltroAcreditador}
                placeholder="Todos"
                className="w-44"
                opciones={[
                  { value: 'todos', label: 'Todos' },
                  ...acreditadoresUnicos.map((a) => ({
                    value: normalizar(`${a.nombre} ${a.apellido}`),
                    label: `${a.nombre} ${a.apellido}`,
                  })),
                ]}
              />
            )}

            {camposSeleccion.map((campo) => (
              <SelectFiltro
                key={campo.id}
                label={campo.etiqueta}
                value={filtrosCampos[campo.id] ?? 'todos'}
                onChange={(valor) => setFiltroCampo(campo.id, valor)}
                className="w-44"
                opciones={[
                  { value: 'todos', label: 'Todos' },
                  ...campo.opciones.map((op) => ({ value: op, label: op })),
                ]}
              />
            ))}
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
        {onRefresh && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={refreshing}
                >
                  {refreshing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <RefreshCw className="h-4 w-4" />
                  }
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refrescar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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