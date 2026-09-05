import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
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

export function ParticipantesDataTable({ columns, data, evento, camposForm = [], onDescargar, descargando = false, onRefresh, refreshing = false, extraAcciones }) {
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false
  const tieneFicha = evento?.config_ficha_medica !== 'no'
  const tieneAutorizacion = evento?.requiere_autorizacion_menores ?? false
  const tieneCertificado = evento?.config_certificado !== 'no'

  const camposSeleccion = useMemo(
    () => camposForm.filter((campo) => campo.tipo === 'seleccion' && campo.opciones?.length > 0),
    [camposForm]
  )

  const [columnVisibility, setColumnVisibility] = useState(() => {
    const initial = { dni: false }
    if (tieneGrupos) initial.grupo = false
    if (tieneCosto) initial.estado_pago = false
    camposForm.forEach((campo) => {
      initial[`campo_${campo.id}`] = false
    })
    if (tieneFicha) initial['ficha_medica'] = false
    else initial['ficha_medica'] = false  // ocultar siempre si no aplica
    if (tieneAutorizacion) initial['autorizacion'] = false
    else initial['autorizacion'] = false
    if (tieneCertificado) initial['certificado'] = false
    else initial['certificado'] = false
    return initial
  })

  const grupos = useMemo(() => {
    const set = new Set()
    data.forEach((p) => { if (p.grupo?.nombre) set.add(p.grupo.nombre) })
    return Array.from(set).sort()
  }, [data])

  const filtrosSelect = useMemo(() => {
    const base = []
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

  const buscarParticipante = useMemo(() => (p, q) =>
    p.nombre.toLowerCase().includes(q) ||
    p.apellido.toLowerCase().includes(q) ||
    p.dni.includes(q) ||
    (p.grupo?.nombre?.toLowerCase().includes(q) ?? false), [])

  const filtrosState = useFiltrosBar({
    data,
    queryParamKey: 'participante',
    buscar: buscarParticipante,
    filtros: filtrosSelect,
  })
  const { datosFiltrados } = filtrosState

  const table = useReactTable({
    data: datosFiltrados,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
  })

  const columnasOcultables = table
    .getAllColumns()
    .filter((col) => col.getCanHide())

  return (
    <div className="space-y-4">
      <FiltrosBarConectado
        filtrosState={filtrosState}
        filtros={filtrosSelect}
        busquedaPlaceholder="Nombre, apellido, DNI o grupo..."
        columnas={{ items: columnasOcultables, onToggle: (column, value) => column.toggleVisibility(value) }}
        acciones={[
          { key: 'refrescar', icon: RefreshCw, tooltip: 'Refrescar', onClick: onRefresh, disabled: refreshing, spinning: refreshing },
          { key: 'descargar', icon: Download, tooltip: 'Descargar Excel', onClick: onDescargar, disabled: descargando, loading: descargando, className: 'border-primary/30 text-primary hover:bg-primary/5 hover:text-primary' },
        ]}
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
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {datosFiltrados.length} participante{datosFiltrados.length !== 1 ? 's' : ''}
            {datosFiltrados.length !== data.length && ` (de ${data.length} totales)`}
          </p>
          {extraAcciones}
        </div>
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
