import { X, CreditCard, Calendar, Mail, Users, Hash, User } from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'

const ESTADO_PAGO_CONFIG = {
  no_aplica: { label: 'Sin costo', variant: 'secondary' },
  pendiente: { label: 'Pendiente', variant: 'outline' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  rechazado: { label: 'Rechazado', variant: 'destructive' },
}

function InfoRow({ icon: Icon, label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function ParticipanteDrawer({ participante, camposForm, evento, open, onClose }) {
  if (!participante) return null

  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const estadoPago = ESTADO_PAGO_CONFIG[participante.estado_pago] ?? ESTADO_PAGO_CONFIG.pendiente
  const edad = participante.fecha_nacimiento
    ? differenceInYears(new Date(), new Date(participante.fecha_nacimiento))
    : null

  const camposConRespuesta = camposForm.filter(
    (campo) => participante.respuestas_form?.[campo.id] !== undefined
  )

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="ml-auto h-full w-full max-w-md rounded-l-xl rounded-r-none">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {participante.nombre} {participante.apellido}
            </h2>
            {edad !== null && (
              <p className="text-sm text-muted-foreground">{edad} años</p>
            )}
          </div>
          <DrawerClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="ml-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Datos personales
            </p>
            <InfoRow icon={CreditCard} label="DNI" value={participante.dni} />
            <InfoRow
              icon={Calendar}
              label="Fecha de nacimiento"
              value={
                participante.fecha_nacimiento
                  ? format(new Date(participante.fecha_nacimiento), "d 'de' MMMM, yyyy", { locale: es })
                  : null
              }
            />
            <InfoRow icon={Mail} label="Email" value={participante.email} />
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Inscripción
            </p>

            {tieneCosto && (
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Estado de pago</p>
                  <Badge variant={estadoPago.variant} className="mt-0.5">
                    {estadoPago.label}
                  </Badge>
                </div>
              </div>
            )}

            {tieneGrupos && participante.grupo && (
              <InfoRow icon={Users} label="Grupo" value={participante.grupo.nombre} />
            )}

            <InfoRow
              icon={Calendar}
              label="Fecha de inscripción"
              value={
                participante.creado_en
                  ? format(new Date(participante.creado_en), "d 'de' MMMM, yyyy HH:mm", { locale: es })
                  : null
              }
            />
          </div>

          {camposConRespuesta.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Respuestas del formulario
                </p>
                {camposConRespuesta.map((campo) => {
                  const valor = participante.respuestas_form[campo.id]
                  const valorTexto = typeof valor === 'boolean'
                    ? (valor ? 'Sí' : 'No')
                    : Array.isArray(valor)
                      ? valor.join(', ')
                      : String(valor)

                  return (
                    <div key={campo.id} className="space-y-0.5">
                      <p className="text-xs text-muted-foreground">{campo.etiqueta}</p>
                      <p className="text-sm font-medium text-foreground">{valorTexto}</p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}