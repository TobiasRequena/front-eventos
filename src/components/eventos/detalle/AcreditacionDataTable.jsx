import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FiltrosBarConectado } from '@/components/ui/filtros-bar-conectado'
import { useFiltrosBar } from '@/hooks/useFiltrosBar'

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

function normalizar(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function AcreditacionDataTable({
  columns, data, evento, camposForm = [], mostrarFiltrosCompletos = false,
  initialColumnVisibility = {}, onVerDetalle, onRefresh, refreshing = false,
  acreditadores = [],
}) {
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const camposSeleccion = useMemo(
    () => camposForm.filter((campo) => campo.tipo === 'seleccion' && campo.opciones?.length > 0),
    [camposForm]
  )

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

  const acreditadoresUnicos = useMemo(() => {
    const vistos = new Set()
    return acreditadores.filter((a) => {
      const key = normalizar(`${a.nombre} ${a.apellido}`)
      if (vistos.has(key)) return false
      vistos.add(key)
      return true
    })
  }, [acreditadores])

  const filtrosSelect = useMemo(() => {
    if (!mostrarFiltrosCompletos) return []
    const base = [
      {
        key: 'edad',
        label: 'Edad',
        opciones: OPCIONES_EDAD,
        predicate: (p, v) => v === 'mayores' ? p.es_mayor : !p.es_mayor,
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
    if (tieneGrupos && grupos.length > 0) {
      base.push({
        key: 'grupo',
        label: 'Grupo',
        placeholder: 'Todos los grupos',
        opciones: [
          { value: 'todos', label: 'Todos los grupos' },
          ...grupos.map((grupo) => ({ value: grupo, label: grupo })),
        ],
        predicate: (p, v) => p.grupo?.nombre === v,
      })
    }
    if (acreditadores.length > 0) {
      base.push({
        key: 'acreditador',
        label: 'Acreditador',
        placeholder: 'Todos',
        opciones: [
          { value: 'todos', label: 'Todos' },
          ...acreditadoresUnicos.map((a) => ({
            value: normalizar(`${a.nombre} ${a.apellido}`),
            label: `${a.nombre} ${a.apellido}`,
          })),
        ],
        predicate: (p, v) => normalizar(`${p.acreditador?.nombre ?? ''} ${p.acreditador?.apellido ?? ''}`) === v,
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
  }, [mostrarFiltrosCompletos, tieneCosto, tieneGrupos, grupos, acreditadores, acreditadoresUnicos, camposSeleccion])

  const buscarAcreditado = useMemo(() => (p, q) =>
    p.nombre.toLowerCase().includes(q) ||
    p.apellido.toLowerCase().includes(q) ||
    p.dni.includes(q) ||
    (p.grupo?.nombre?.toLowerCase().includes(q) ?? false), [])

  const filtrosState = useFiltrosBar({
    data,
    queryParamKey: 'acreditado',
    buscar: buscarAcreditado,
    filtros: filtrosSelect,
  })
  const { datosFiltrados } = filtrosState

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
      <FiltrosBarConectado
        filtrosState={filtrosState}
        filtros={filtrosSelect}
        busquedaPlaceholder="Nombre, apellido, DNI o grupo..."
        columnas={{ items: columnasOcultables, onToggle: (column, value) => column.toggleVisibility(value) }}
        acciones={onRefresh ? [
          { key: 'refrescar', icon: RefreshCw, tooltip: 'Refrescar', onClick: onRefresh, disabled: refreshing, spinning: refreshing },
        ] : []}
      />

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
