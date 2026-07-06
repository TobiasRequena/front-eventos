import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle } from 'lucide-react'

const ESTADO_PAGO_CONFIG = {
  no_aplica: { label: 'Sin costo', variant: 'secondary' },
  pendiente: { label: 'Pendiente', variant: 'outline' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(fechaIso))
}

export function buildAcreditacionColumns({ camposForm, tieneCosto, tieneGrupos, mostrarAcreditado, acreditadoOculto = false }) {
  const columnasFijas = [
    {
      id: 'nombre',
      accessorFn: (row) => `${row.nombre} ${row.apellido}`,
      header: 'Nombre',
      enableHiding: false,
      cell: ({ getValue }) => (
        <span className="font-medium text-foreground">{getValue()}</span>
      ),
    },
    {
      id: 'fecha_nacimiento',
      accessorKey: 'fecha_nacimiento',
      header: 'Fecha de nac.',
      enableHiding: false,
      cell: ({ getValue }) => formatearFecha(getValue()),
    },
  ]

  const columnasOpcionales = [
    {
      id: 'dni',
      accessorKey: 'dni',
      header: 'DNI',
      enableHiding: true,
    },
    ...(tieneGrupos
      ? [{
        id: 'grupo',
        accessorFn: (row) => row.grupo?.nombre ?? '—',
        header: 'Grupo',
        enableHiding: true,
      }]
      : []),
    ...(tieneCosto
      ? [{
        id: 'estado_pago',
        accessorKey: 'estado_pago',
        header: 'Pago',
        enableHiding: true,
        cell: ({ getValue }) => {
          const config = ESTADO_PAGO_CONFIG[getValue()] ?? ESTADO_PAGO_CONFIG.pendiente
          return <Badge variant={config.variant}>{config.label}</Badge>
        },
      }]
      : []),
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
      meta: { esExtra: true },
    })),
    ...(mostrarAcreditado
      ? [{
        id: 'acreditado',
        header: 'Acreditado',
        accessorKey: 'acreditado',
        enableHiding: acreditadoOculto,
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="flex items-center gap-1.5 text-success text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Sí
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <XCircle className="h-4 w-4" />
              No
            </span>
          ),
      }]
      : []),
  ]

  return [...columnasFijas, ...columnasOpcionales]
}