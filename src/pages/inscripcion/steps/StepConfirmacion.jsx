import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, QrCode, Users, Calendar, Copy, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { inscribirParticipante, crearGrupo } from '@/api/inscripcion.api'
import { subirComprobantePago } from '@/api/archivos.api'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'

function armarRespuestasForm(talleresSeleccionados) {
  const talleres = []
  Object.entries(talleresSeleccionados ?? {}).forEach(([, valor]) => {
    if (Array.isArray(valor)) talleres.push(...valor)
    else if (valor) talleres.push(valor)
  })
  return talleres
}

function armarPayload(evento, datosWizard) {
  const {
    nombre, apellido, email, dni, nacimiento,
    rolGrupo, grupoId, respuestasForm,
    talleresSeleccionados,
  } = datosWizard

  // Talleres informativos (1 solo taller en el bloque) → van automáticamente
  const tallerIds = []

  const bloquesTaller = evento.bloquesTaller ?? []
  bloquesTaller.forEach((bloque) => {
    const esInformativo = bloque.talleres.length === 1
    if (esInformativo) {
      tallerIds.push(bloque.talleres[0].id)
    } else {
      const seleccionados = talleresSeleccionados?.[bloque.id]
      if (Array.isArray(seleccionados)) {
        tallerIds.push(...seleccionados)
      } else if (seleccionados) {
        tallerIds.push(seleccionados)
      }
    }
  })

  const tieneCosto = parseFloat(evento.costo ?? 0) > 0
  const subiendoComprobante = tieneCosto && datosWizard.comprobantePago && !datosWizard.pagoPostergado

  return {
    nombre: datosWizard.nombre,
    apellido: datosWizard.apellido,
    email: datosWizard.email,
    dni: datosWizard.dni,
    nacimiento: datosWizard.nacimiento,
    eventoId: evento.id,
    rolGrupo: datosWizard.rolGrupo,
    grupoId: datosWizard.grupoId ?? null,
    responsableId: null,
    respuestasForm: datosWizard.respuestasForm ?? {},
    ...(tallerIds.length > 0 ? { tallerIds } : {}),
    ...(tieneCosto ? { estadoPago: subiendoComprobante ? 'aprobado' : 'pendiente' } : {}),
  }
}

function QrDisplay({ qrPersonal }) {
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(qrPersonal)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-muted">
        <QrCode className="h-16 w-16 text-muted-foreground/50" />
      </div>
      <p className="text-xs text-muted-foreground">
        Tu QR personal llegará por email a <strong>{ }</strong>
      </p>
      <button
        type="button"
        onClick={copiar}
        className="flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        {copiado
          ? <><Check className="h-3.5 w-3.5 text-success" /> Copiado</>
          : <><Copy className="h-3.5 w-3.5" /> Copiar código QR</>
        }
      </button>
    </div>
  )
}

function ResumenInscripcion({ datosWizard, evento, grupoCreado }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Nombre</span>
        <span className="font-medium text-foreground">
          {datosWizard.nombre} {datosWizard.apellido}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Email</span>
        <span className="font-medium text-foreground">{datosWizard.email}</span>
      </div>
      {datosWizard.grupoSeleccionado && (
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Grupo</span>
          <span className="font-medium text-foreground">
            {datosWizard.grupoSeleccionado.nombre}
          </span>
        </div>
      )}
      {grupoCreado && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Grupo creado</span>
            <span className="font-medium text-foreground">{grupoCreado.nombre}</span>
          </div>
          <div className="rounded-md bg-muted/50 p-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              Código de invitación para tu grupo:
            </p>
            <p className="text-lg font-semibold tracking-widest text-foreground">
              {grupoCreado.codigo_inv}
            </p>
            <p className="text-xs text-muted-foreground">
              Compartí este código con los integrantes de tu grupo para que puedan unirse.
            </p>
          </div>
        </>
      )}
      {datosWizard.pagoPostergado && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Tu pago quedó pendiente. Recordá abonar antes del evento, o al llegar al mismo.
          </p>
        </div>
      )}
    </div>
  )
}

export default function StepConfirmacion({ evento, wizard }) {
  const { datosWizard, actualizarDatos } = wizard
  const [status, setStatus] = useState('idle')
  const [errorMensaje, setErrorMensaje] = useState(null)
  const [participante, setParticipante] = useState(datosWizard.participanteCreado ?? null)
  const [grupoCreado, setGrupoCreado] = useState(datosWizard.grupoCreado ?? null)
  const yaEjecutado = useRef(false)

  async function procesar() {
    if (yaEjecutado.current) return
    yaEjecutado.current = true
    setStatus('loading')
    setErrorMensaje(null)

    try {
      const payload = armarPayload(evento, datosWizard)

      const participanteCreado = await inscribirParticipante(payload)
      setParticipante(participanteCreado)

      let grupoCreadoLocal = null
      if (datosWizard.rolGrupo === 'responsable' && datosWizard.datosGrupoNuevo) {
        grupoCreadoLocal = await crearGrupo({
          ...datosWizard.datosGrupoNuevo,
          eventoId: evento.id,
          responsableId: participanteCreado.id,
        })
        setGrupoCreado(grupoCreadoLocal)
      }

      if (datosWizard.comprobantePago && !datosWizard.pagoPostergado) {
        try {
          await subirComprobantePago(
            datosWizard.comprobantePago,
            participanteCreado.id,
            evento.org_id
          )
        } catch {
          toast.warning('Tu inscripción se completó, pero no pudimos subir el comprobante.')
        }
      }

      actualizarDatos({ participanteCreado, grupoCreado: grupoCreadoLocal })
      setStatus('success')
    } catch (error) {
      yaEjecutado.current = false
      const mensaje =
        error?.response?.data?.error?.message ??
        error?.response?.data?.error ??
        'No pudimos completar tu inscripción. Revisá tu conexión e intentá de nuevo.'
      setErrorMensaje(mensaje)
      toast.error('Algo salió mal con tu inscripción.')
      setStatus('error')
    }
  }

  useEffect(() => {
    if (datosWizard.participanteCreado) {
      setStatus('success')
      return
    }
    procesar()
  }, [])

  if (status === 'loading') {
    return (
      <InscripcionStepLayout evento={evento} titulo="Procesando tu inscripción...">
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Estamos registrando tu inscripción
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Por favor no cerrés esta ventana...
            </p>
          </div>
        </div>
      </InscripcionStepLayout>
    )
  }

  if (status === 'error') {
    return (
      <InscripcionStepLayout evento={evento} titulo="Algo salió mal">
        <div className="space-y-4">
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              No pudimos completar tu inscripción
            </p>
            {errorMensaje && (
              <p className="mt-1 text-sm text-muted-foreground">{errorMensaje}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Si el problema persiste, contactá al organizador del evento.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              // variant="outline"
              className="flex-1"
              onClick={procesar}
            >
              Reenviar
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Reiniciar
            </Button>
          </div>
        </div>
      </InscripcionStepLayout>
    )
  }

  return (
    <InscripcionStepLayout evento={evento} titulo="¡Inscripción completada!">
      <div className="space-y-5 pt-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            ¡Inscripción completada!
          </h2>
          <p className="text-sm text-muted-foreground">
            Te enviamos un email a <strong>{datosWizard.email}</strong> con tu QR personal.
          </p>
        </div>

        <QrDisplay qrPersonal={participante?.qr_personal} />

        <Separator />

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resumen de tu inscripción
          </p>
          <ResumenInscripcion
            datosWizard={datosWizard}
            evento={evento}
            grupoCreado={grupoCreado}
          />
        </div>
      </div>

      <Separator />
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        Realizar otra inscripción
      </button>
    </InscripcionStepLayout>
  )
}