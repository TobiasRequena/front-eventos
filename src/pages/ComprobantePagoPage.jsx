import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getEventoPorCodigo } from '@/api/inscripcion.api'
import { verificarDni } from '@/api/participantes.api'
import { subirComprobantePublico } from '@/api/archivos.api'
import { InscripcionLayout } from '@/components/inscripcion/InscripcionLayout'
import { cn } from '@/lib/utils'
import { CopyButton } from '@/components/CopyButton'
import { eventoTieneCosto, formatoPesos, formatoVencimiento } from '@/lib/costoEvento'

const ESTADO_CUOTA = {
  aprobado: { label: 'Pagada', className: 'bg-success/10 text-success' },
  en_revision: { label: 'En revisión', className: 'bg-blue-500/10 text-blue-600' },
  rechazado: { label: 'Rechazada', className: 'bg-destructive/10 text-destructive' },
  pendiente: { label: 'Pendiente', className: 'bg-orange-500/10 text-orange-600' },
}

function CuotaItem({ cuota, total, seleccionada, onElegir, onCancelar, archivo, setArchivo, enviando, onEnviar }) {
  const estado = ESTADO_CUOTA[cuota.estado] ?? ESTADO_CUOTA.pendiente
  const vencida = cuota.estado !== 'aprobado' && cuota.vencimiento && new Date(cuota.vencimiento) < new Date()
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            {total > 1 ? `Cuota ${cuota.numero} de ${total}` : 'Pago total'} — {formatoPesos(cuota.monto)}
          </p>
          {cuota.vencimiento && (
            <p className={cn('text-xs', vencida ? 'text-destructive' : 'text-muted-foreground')}>
              {vencida ? 'Venció' : 'Vence'} el {formatoVencimiento(cuota.vencimiento)}
            </p>
          )}
          {cuota.comprobante && (
            <p className="text-xs text-muted-foreground">
              Comprobante cargado el {new Date(cuota.comprobante.subidoEn).toLocaleDateString('es-AR')}
            </p>
          )}
        </div>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', estado.className)}>
          {estado.label}
        </span>
      </div>

      {cuota.estado !== 'aprobado' && !seleccionada && (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={onElegir}>
          <Upload className="h-4 w-4" />
          {cuota.comprobante ? 'Cargar otro comprobante' : 'Subir comprobante'}
        </Button>
      )}

      {seleccionada && (
        <div className="space-y-2">
          {!archivo ? (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-accent/50 transition-colors">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Elegir archivo</p>
              <p className="text-xs text-muted-foreground">JPG, PNG o PDF — hasta 5MB</p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="truncate text-sm text-foreground">{archivo.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onCancelar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={onEnviar} disabled={enviando || !archivo}>
              {enviando ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar comprobante'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ComprobantePagoPage() {
  const { codigoEvento } = useParams()

  const [evento, setEvento] = useState(null)
  const [statusEvento, setStatusEvento] = useState('loading')

  const [dni, setDni] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [participante, setParticipante] = useState(null)
  const [errorDni, setErrorDni] = useState(null)

  const [cuotaId, setCuotaId] = useState(null) // cuota a la que se le sube comprobante
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!codigoEvento) return
    getEventoPorCodigo(codigoEvento)
      .then((data) => { setEvento(data); setStatusEvento('success') })
      .catch(() => setStatusEvento('error'))
  }, [codigoEvento])

  async function buscarParticipante() {
    const data = await verificarDni(dni.trim(), evento.id)
    if (!data.existe) {
      setErrorDni('No encontramos tu inscripción en este evento.')
      return
    }
    setParticipante(data)
  }

  async function handleVerificarDni() {
    if (!dni.trim()) return
    setVerificando(true)
    setParticipante(null)
    setErrorDni(null)
    try {
      await buscarParticipante()
    } catch {
      setErrorDni('No pudimos verificar tu DNI. Intentá de nuevo.')
    } finally {
      setVerificando(false)
    }
  }

  function elegirCuota(id) {
    setCuotaId(id)
    setArchivo(null)
  }

  async function handleEnviar() {
    if (!participante || !archivo || !cuotaId) return
    setEnviando(true)
    try {
      await subirComprobantePublico(archivo, participante.participanteId, evento.id, cuotaId)
      toast.success('¡Comprobante enviado! El organizador lo va a revisar.')
      setCuotaId(null)
      setArchivo(null)
      await buscarParticipante() // refresca la lista de cuotas
    } catch (err) {
      const msg = err?.response?.data?.error?.message ?? 'No pudimos enviar el comprobante.'
      toast.error(msg)
    } finally {
      setEnviando(false)
    }
  }

  if (statusEvento === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (statusEvento === 'error' || !evento) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6 text-center">
        <div>
          <p className="text-base font-medium text-foreground">Evento no encontrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            El link no es válido o el evento ya no está disponible.
          </p>
        </div>
      </div>
    )
  }

  const tieneCosto = eventoTieneCosto(evento)
  const cuotas = participante?.cuotas ?? []
  const monto = cuotas.length > 0
    ? cuotas.reduce((total, c) => total + Number(c.monto), 0)
    : participante?.zona ? parseFloat(participante.zona.costo) : parseFloat(evento.costo ?? 0)
  const todoPagado = cuotas.length > 0 && cuotas.every((c) => c.estado === 'aprobado')

  return (
    <InscripcionLayout>
      <div className="space-y-6">
        {/* Header del evento */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pago de inscripción
          </p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{evento.nombre}</h1>
          {tieneCosto && (!evento.tiene_precio_por_zona || participante) && (
            <>
              {participante?.zona && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Tu zona: {participante.zona.nombre}
                </p>
              )}
              <p className="mt-1 text-2xl font-bold text-foreground">
                ${monto.toLocaleString('es-AR')}
              </p>
            </>
          )}
        </div>

        {/* Datos de pago */}
        {(evento.alias_cobro || evento.cbu_cvu) && (
          <Card>
            <CardContent className="space-y-3 pt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Transferir a
              </p>
              {evento.alias_cobro && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Alias</p>
                    <p className="text-sm font-medium text-foreground">{evento.alias_cobro}</p>
                  </div>
                  <CopyButton texto={evento.alias_cobro} />
                </div>
              )}
              {evento.cbu_cvu && (
                <>
                  {evento.alias_cobro && <Separator />}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">CBU/CVU</p>
                      <p className="text-sm font-medium text-foreground">{evento.cbu_cvu}</p>
                    </div>
                    <CopyButton texto={evento.cbu_cvu} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Verificación de DNI */}
        <div className="space-y-3">
          <Label>Tu DNI</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ej. 12345678"
              inputMode="numeric"
              value={dni}
              onChange={(e) => {
                setDni(e.target.value)
                setParticipante(null)
                setErrorDni(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerificarDni()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleVerificarDni}
              disabled={verificando || !dni.trim()}
              className="shrink-0"
            >
              {verificando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
            </Button>
          </div>
          {participante && (
            <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <p className="font-medium text-foreground">
                {participante.nombre} {participante.apellido}
              </p>
            </div>
          )}
          {errorDni && (
            <p className="text-sm text-destructive">{errorDni}</p>
          )}
        </div>

        {/* Cuotas y comprobantes */}
        {participante && (
          <div className="space-y-3">
            <Label>{cuotas.length > 1 ? 'Tus cuotas' : 'Tu pago'}</Label>
            {todoPagado && (
              <p className="rounded-md bg-success/10 p-3 text-sm text-success">
                Tu pago está completo. No tenés que subir más comprobantes.
              </p>
            )}
            {cuotas.map((cuota) => (
              <CuotaItem
                key={cuota.id}
                cuota={cuota}
                total={cuotas.length}
                seleccionada={cuota.id === cuotaId}
                onElegir={() => elegirCuota(cuota.id)}
                onCancelar={() => elegirCuota(null)}
                archivo={archivo}
                setArchivo={setArchivo}
                enviando={enviando}
                onEnviar={handleEnviar}
              />
            ))}
          </div>
        )}
      </div>
    </InscripcionLayout>
  )
}