import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Upload, X, Copy, Check } from 'lucide-react'
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

function CopyButton({ texto }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className="ml-1.5 shrink-0 text-muted-foreground hover:text-foreground"
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
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

  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    if (!codigoEvento) return
    getEventoPorCodigo(codigoEvento)
      .then((data) => { setEvento(data); setStatusEvento('success') })
      .catch(() => setStatusEvento('error'))
  }, [codigoEvento])

  async function handleVerificarDni() {
    if (!dni.trim()) return
    setVerificando(true)
    setParticipante(null)
    setErrorDni(null)
    try {
      const data = await verificarDni(dni.trim(), evento.id)
      if (data.existe) {
        if (data.estadoPago === 'aprobado') {
          setErrorDni('Tu pago ya fue aprobado. No es necesario subir un comprobante.')
          return
        }
        setParticipante(data)
      } else {
        setErrorDni('No encontramos tu inscripción en este evento.')
      }
    } catch {
      setErrorDni('No pudimos verificar tu DNI. Intentá de nuevo.')
    } finally {
      setVerificando(false)
    }
  }

  async function handleEnviar() {
    if (!participante || !archivo) return
    setEnviando(true)
    try {
      await subirComprobantePublico(archivo, participante.participanteId, evento.id)
      setEnviado(true)
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

  const tieneCosto = parseFloat(evento.costo ?? 0) > 0

  if (enviado) {
    return (
      <InscripcionLayout>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <CheckCircle2 className="h-7 w-7 text-success" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">¡Comprobante enviado!</p>
            <p className="mt-1 text-sm text-muted-foreground">
              El organizador lo revisará y confirmará tu pago a la brevedad.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEnviado(false)
              setArchivo(null)
              setParticipante(null)
              setDni('')
            }}
            className="text-sm text-primary underline underline-offset-4 cursor-pointer hover:opacity-70"
          >
            Cargar otro comprobante
          </button>
        </div>
      </InscripcionLayout>
    )
  }

  return (
    <InscripcionLayout>
      <div className="space-y-6">
        {/* Header del evento */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pago de inscripción
          </p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{evento.nombre}</h1>
          {tieneCosto && (
            <p className="mt-1 text-2xl font-bold text-foreground">
              ${parseFloat(evento.costo).toLocaleString('es-AR')}
            </p>
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
            <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                <p className="font-medium text-foreground">
                  {participante.nombre} {participante.apellido}
                </p>
              </div>
              {participante.estadoPago === 'pendiente' && (
                <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-medium text-orange-600">
                  Pago pendiente
                </span>
              )}
              {participante.estadoPago === 'rechazado' && (
                <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  Rechazado
                </span>
              )}
            </div>
          )}
          {errorDni && (
            <p className="text-sm text-destructive">{errorDni}</p>
          )}
        </div>

        {/* Subir comprobante */}
        {participante && (
          <div className="space-y-3">
            <Label>Comprobante de pago</Label>
            {!archivo ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Subir comprobante</p>
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
                <div className="flex items-center gap-2 min-w-0">
                  <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm text-foreground">{archivo.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setArchivo(null)}
                  className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              onClick={handleEnviar}
              disabled={enviando || !archivo}
            >
              {enviando
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                : 'Enviar comprobante'
              }
            </Button>
          </div>
        )}
      </div>
    </InscripcionLayout>
  )
}