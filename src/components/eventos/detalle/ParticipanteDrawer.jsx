import { X, CreditCard, Calendar, Mail, Users, Hash } from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer'
import { ComprobanteButton, ArchivoButton } from '@/components/ComprobanteButton'
import { useState, useEffect } from 'react'
import { getFichaMedica } from '@/api/participantes.api'
import { ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { patchEstadoPago } from '@/api/participantes.api'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const ESTADO_PAGO_CONFIG = {
  no_aplica: { label: 'Sin costo', variant: 'secondary' },
  pendiente: { label: 'Pendiente de pago', variant: 'outline' },
  pendiente_aprobacion: { label: 'Comprobante cargado', variant: 'outline' },
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

function formatFechaSafely(fechaStr, formatPattern) {
  if (!fechaStr) return null
  try {
    const d = new Date(fechaStr)
    if (isNaN(d.getTime())) return null
    return format(d, formatPattern, { locale: es })
  } catch {
    return null
  }
}

function FichaMedicaDrawer({ participanteId, open, onClose }) {
  const [ficha, setFicha] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !participanteId) return
    setIsLoading(true)
    getFichaMedica(participanteId)
      .then(setFicha)
      .catch(() => setFicha(null))
      .finally(() => setIsLoading(false))
  }, [open, participanteId])

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="ml-auto flex h-full w-full max-w-md flex-col rounded-l-xl rounded-r-none font-sans">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Ficha médica</h2>
          <DrawerClose asChild>
            <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </DrawerClose>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
            </div>
          ) : !ficha ? (
            <p className="text-sm text-muted-foreground">Este participante no tiene ficha médica cargada.</p>
          ) : (
            <div className="space-y-4 text-sm">
              {ficha.obra_social && <div><p className="text-xs text-muted-foreground">Obra social</p><p className="font-medium text-foreground">{ficha.obra_social}</p></div>}
              {ficha.tipo_sangre !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Tipo de sangre</p>
                  <p className="font-medium text-foreground">
                    {ficha.tipo_sangre ?? 'No lo sabe'}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Condiciones</p>
                {['tiene_diabetes', 'tiene_asma', 'tiene_epilepsia', 'tiene_cardiopatia'].map((campo) => ficha[campo] && (
                  <Badge key={campo} variant="outline" className="mr-1 text-xs">
                    {campo.replace('tiene_', '').charAt(0).toUpperCase() + campo.replace('tiene_', '').slice(1)}
                  </Badge>
                ))}
                {!ficha.tiene_diabetes && !ficha.tiene_asma && !ficha.tiene_epilepsia && !ficha.tiene_cardiopatia && (
                  <p className="text-foreground">Sin condiciones registradas</p>
                )}
              </div>

              {ficha.otras_condiciones && <div><p className="text-xs text-muted-foreground">Otras condiciones</p><p className="font-medium text-foreground">{ficha.otras_condiciones}</p></div>}
              {ficha.alergias && <div><p className="text-xs text-muted-foreground">Alergias</p><p className="font-medium text-foreground">{ficha.alergias}</p></div>}
              {ficha.restricciones_alimentarias && <div><p className="text-xs text-muted-foreground">Restricciones alimentarias</p><p className="font-medium text-foreground">{ficha.restricciones_alimentarias}</p></div>}

              {ficha.medicacion?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Medicación</p>
                  <div className="space-y-1">
                    {ficha.medicacion.map((med, i) => (
                      <p key={i} className="font-medium text-foreground">
                        {med.nombre} — {med.dosis} ({med.horario})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {ficha.tiene_discapacidad && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Adaptaciones</p>
                  {ficha.adaptaciones && Object.entries(ficha.adaptaciones)
                    .filter(([k, v]) => v && k !== 'otra')
                    .map(([k]) => (
                      <Badge key={k} variant="outline" className="mr-1 text-xs">{k}</Badge>
                    ))
                  }
                  {ficha.adaptaciones?.otra && <p className="mt-1 text-foreground">{ficha.adaptaciones.otra}</p>}
                </div>
              )}

              {ficha.recomendaciones && <div><p className="text-xs text-muted-foreground">Recomendaciones</p><p className="font-medium text-foreground">{ficha.recomendaciones}</p></div>}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function ParticipanteDrawer({ participante, camposForm = [], evento, open, onClose, cargando, onActualizar }) {
  const [fichaMedicaAbierta, setFichaMedicaAbierta] = useState(false)
  const [actualizandoPago, setActualizandoPago] = useState(false)
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const estadoPago = participante?.estado_pago
    ? (ESTADO_PAGO_CONFIG[participante.estado_pago] ?? ESTADO_PAGO_CONFIG.pendiente)
    : ESTADO_PAGO_CONFIG.pendiente

  const edad = participante?.edad ?? null

  const camposConRespuesta = (camposForm || []).filter(
    (campo) => participante?.respuestas_form?.[campo.id] !== undefined
  )

  async function handleCambiarEstadoPago(estadoPago) {
    setActualizandoPago(true)
    try {
      await patchEstadoPago(participante.id, estadoPago)
      toast.success(estadoPago === 'aprobado' ? 'Pago aprobado.' : 'Pago rechazado.')
      onActualizar?.()
      onClose()
    } catch {
      toast.error('No pudimos actualizar el estado de pago.')
    } finally {
      setActualizandoPago(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()} direction="right">
      <DrawerContent className="ml-auto flex h-full w-full max-w-md flex-col rounded-l-xl rounded-r-none font-sans">
        {cargando ? (
          <div className="space-y-4 p-5">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : participante ? (
          <>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    {participante.nombre} {participante.apellido}
                  </h2>
                  {participante.rol_grupo === 'responsable' && (
                    <Badge variant="secondary" className="text-xs">Referente</Badge>
                  )}
                </div>
                {edad !== null && (
                  <p className="text-sm text-muted-foreground">{edad} años</p>
                )}
              </div>
              <DrawerClose asChild>
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-4 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Datos personales
                </p>
                <InfoRow icon={CreditCard} label="DNI" value={participante.dni} />
                <InfoRow
                  icon={Calendar}
                  label="Fecha de nacimiento"
                  value={formatFechaSafely(participante.nacimiento ?? participante.fecha_nacimiento, "d 'de' MMMM, yyyy")}
                />
                <InfoRow icon={Mail} label="Email" value={participante.email} />
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Inscripción
                </p>

                {tieneCosto && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Estado de pago</p>
                        <Badge variant={estadoPago.variant} className="mt-0.5">
                          {estadoPago.label}
                        </Badge>
                      </div>
                    </div>
                    {participante.id && <ComprobanteButton
                      participanteId={participante.id}
                      estadoPago={participante.estado_pago}
                      onCambiarEstado={handleCambiarEstadoPago}
                    />}
                  </div>
                )}

                {tieneGrupos && participante.grupo && (
                  <InfoRow icon={Users} label="Grupo" value={participante.grupo.nombre} />
                )}

                <InfoRow
                  icon={Calendar}
                  label="Fecha de inscripción"
                  value={formatFechaSafely(participante.creado_en, "d 'de' MMMM, yyyy HH:mm")}
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

              {(participante?.tiene_ficha_medica || participante?.tiene_autorizacion || participante?.tiene_certificado) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Documentación
                    </p>
                    {participante?.tiene_ficha_medica && (
                      <button
                        type="button"
                        onClick={() => setFichaMedicaAbierta(true)}
                        className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                      >
                        <ClipboardList className="h-4 w-4" />
                        Ver ficha médica
                      </button>
                    )}
                    {participante?.tiene_autorizacion && participante?.autorizacion_url && (
                      <ArchivoButton
                        url={participante.autorizacion_url}
                        label="Ver autorización"
                        titulo="Autorización de menor"
                      />
                    )}
                    {participante?.tiene_certificado && participante?.certificado_url && (
                      <ArchivoButton
                        url={participante.certificado_url}
                        label="Ver certificado"
                        titulo="Certificado de antecedentes"
                      />
                    )}
                  </div>
                </>
              )}

              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Acreditación
                  </p>

                  {participante.acreditado ? (
                    <Badge variant="default">Acreditado</Badge>
                  ) : (
                    <Badge variant="outline">Sin acreditar</Badge>
                  )}
                </div>

                {participante.acreditado && (
                  <>
                    {participante.acreditado_en && (
                      <InfoRow
                        icon={Calendar}
                        label="Fecha de acreditación"
                        value={formatFechaSafely(
                          participante.acreditado_en,
                          "d 'de' MMMM, yyyy HH:mm"
                        )}
                      />
                    )}

                    {participante.acreditador && (
                      <InfoRow
                        icon={Users}
                        label="Acreditado por"
                        value={`${participante.acreditador.nombre} ${participante.acreditador.apellido}`}
                      />
                    )}
                  </>
                )}
              </div>

              <FichaMedicaDrawer
                participanteId={participante?.id}
                open={fichaMedicaAbierta}
                onClose={() => setFichaMedicaAbierta(false)}
              />
            </div>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
