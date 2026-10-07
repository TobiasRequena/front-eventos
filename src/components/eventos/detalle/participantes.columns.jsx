import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Trash2 } from 'lucide-react'
import { ReenviarMailDialog } from '@/components/ReenviarMailDialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { parseFechaCalendario } from '@/lib/fechas'
import { textoRespuesta } from '@/lib/respuestasForm'

export const ESTADO_PAGO_CONFIG = {
  no_aplica: { label: 'Sin costo', variant: 'secondary' },
  pendiente: { label: 'Pendiente de pago', variant: 'outline' },
  pendiente_aprobacion: { label: 'Comprobante cargado', variant: 'outline' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '—'
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseFechaCalendario(fechaIso))
}

export function buildColumns({ camposForm, tieneCosto, tieneGrupos, tieneZonas, tieneFicha, tieneAutorizacion, tieneCertificado, onVerDetalle, onEliminar }) {
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
      accessorFn: (row) => row.nacimiento ?? row.fecha_nacimiento,
      header: 'Fecha de nac.',
      enableHiding: false,
      cell: ({ getValue }) => formatearFecha(getValue()),
    },
    {
      id: 'edad',
      header: 'Edad',
      accessorKey: 'edad',
      cell: ({ getValue }) => getValue() != null ? `${getValue()} años` : '—',
    }
  ]

  const columnasOpcionales = [
    {
      id: 'dni',
      accessorKey: 'dni',
      header: 'DNI',
      enableHiding: true,
    },
    ...(tieneFicha ? [{
      id: 'ficha_medica',
      header: 'Ficha médica',
      accessorKey: 'tiene_ficha_medica',
      enableHiding: true,
      cell: ({ getValue }) => getValue()
        ? <Badge variant="default" className="text-xs">Completa</Badge>
        : <Badge variant="outline" className="text-xs">Sin ficha</Badge>,
    }] : []),
    ...(tieneAutorizacion ? [{
      id: 'autorizacion',
      header: 'Autorización',
      accessorKey: 'tiene_autorizacion',
      enableHiding: true,
      cell: ({ getValue }) => getValue()
        ? <Badge variant="default" className="text-xs">Presentada</Badge>
        : <Badge variant="outline" className="text-xs">Pendiente</Badge>,
    }] : []),
    ...(tieneCertificado ? [{
      id: 'certificado',
      header: 'Certificado',
      accessorKey: 'tiene_certificado',
      enableHiding: true,
      cell: ({ getValue }) => getValue()
        ? <Badge variant="default" className="text-xs">Presentado</Badge>
        : <Badge variant="outline" className="text-xs">Pendiente</Badge>,
    }] : []),
    ...(tieneGrupos
      ? [
        {
          id: 'grupo',
          accessorFn: (row) => row.grupo?.nombre ?? '—',
          header: 'Grupo',
          enableHiding: true,
        },
      ]
      : []),
    ...(tieneZonas
      ? [
        {
          id: 'zona',
          accessorFn: (row) => row.zona?.nombre ?? '—',
          header: 'Zona',
          enableHiding: true,
        },
      ]
      : []),
    ...(tieneCosto
      ? [
        {
          id: 'estado_pago',
          accessorKey: 'estado_pago',
          header: 'Pago',
          enableHiding: true,
          cell: ({ getValue, row }) => {
            const config = ESTADO_PAGO_CONFIG[getValue()] ?? ESTADO_PAGO_CONFIG.pendiente
            const { cuotas_total: total, cuotas_aprobadas: aprobadas, cuotas_vencidas: vencidas } = row.original
            return (
              <div className="flex flex-col items-start gap-0.5">
                <Badge variant={config.variant}>{config.label}</Badge>
                {total > 1 && (
                  <span className={vencidas > 0 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                    {aprobadas}/{total} cuotas{vencidas > 0 && ' · vencida'}
                  </span>
                )}
              </div>
            )
          },
        },
      ]
      : []),
    // {
    //   id: 'estado_alta_plataforma',
    //   // header: 'Alta plataforma',
    //   accessorKey: 'estado_alta_plataforma',
    //   enableHiding: true,
    //   cell: ({ getValue }) => {
    //     const valor = getValue()
    //     if (!valor) return null
    //     return valor === 'confirmado'
    //       ? <Badge variant="default">Confirmado</Badge>
    //       : <Badge variant="outline">Pago pendiente org</Badge>
    //   },
    // },
    ...camposForm.map((campo) => ({
      id: `campo_${campo.id}`,
      header: campo.etiqueta,
      enableHiding: true,
      accessorFn: (row) => {
        return textoRespuesta(row.respuestas_form?.[campo.id])
      },
      meta: { esExtra: true },
    })),
  ]

  const columnaAcciones = {
    id: 'acciones',
    header: 'Acciones',
    enableHiding: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onVerDetalle?.(row.original)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Eye className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <ReenviarMailDialog participante={row.original} />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onEliminar?.(row.original)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Eliminar participante</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    ),
  }

  return [...columnasFijas, ...columnasOpcionales, columnaAcciones]
}