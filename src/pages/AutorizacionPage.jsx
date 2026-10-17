import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { getEventoPorCodigo } from '@/api/inscripcion.api'
import { verificarDni, subirAutorizacion } from '@/api/participantes.api'
import { InscripcionLayout } from '@/components/inscripcion/InscripcionLayout'
import { ACCEPT_DOCUMENTO, elegirDocumento } from '@/lib/archivos'

export default function AutorizacionPage() {
  const { codigoEvento } = useParams()

  const [evento, setEvento] = useState(null)
  const [statusEvento, setStatusEvento] = useState('loading')

  const [dni, setDni] = useState('')
  const [verificando, setVerificando] = useState(false)
  const [participante, setParticipante] = useState(null)
  const [errorDni, setErrorDni] = useState(null)

  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)

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
    setArchivo(null)
    try {
      const data = await verificarDni(dni.trim(), evento.id)
      if (!data.existe) {
        setErrorDni('No encontramos tu inscripción en este evento.')
        return
      }
      setParticipante(data)
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
      await subirAutorizacion(participante.participanteId, archivo)
      toast.success('¡Autorización enviada!')
      setArchivo(null)
      setParticipante({ ...participante, tieneAutorizacion: true })
    } catch (err) {
      toast.error(err?.response?.data?.error?.message ?? 'No pudimos enviar la autorización.')
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

  const templateUrl = evento.autorizacion_template_url

  return (
    <InscripcionLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Autorización de menor
          </p>
          <h1 className="mt-1 text-xl font-semibold text-foreground">{evento.nombre}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {templateUrl
              ? 'Descargá el template, completalo, firmalo y subilo acá.'
              : 'Subí la autorización firmada por el tutor del menor.'}
          </p>
          {templateUrl && (
            <a
              href={templateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              <FileText className="h-4 w-4" />
              Descargar template de autorización
            </a>
          )}
        </div>

        <Separator />

        <div className="space-y-3">
          <Label htmlFor="dni-autorizacion">DNI del participante</Label>
          <div className="flex gap-2">
            <Input
              id="dni-autorizacion"
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
          {errorDni && <p className="text-sm text-destructive">{errorDni}</p>}
        </div>

        {participante?.tieneAutorizacion && (
          <p className="rounded-md bg-success/10 p-3 text-sm text-success">
            La autorización ya está cargada. Si necesitás reemplazarla, contactá al organizador.
          </p>
        )}

        {participante && !participante.tieneAutorizacion && participante.esMayor && (
          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Este participante es mayor de edad, no necesita autorización.
          </p>
        )}

        {participante && !participante.tieneAutorizacion && !participante.esMayor && (
          <div className="space-y-2">
            {!archivo ? (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center hover:bg-accent/50 transition-colors">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Elegir archivo</p>
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG o WebP — hasta 5MB</p>
                <input
                  type="file"
                  accept={ACCEPT_DOCUMENTO}
                  className="hidden"
                  onChange={(e) => elegirDocumento(e, setArchivo)}
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
            <Button type="button" className="w-full" onClick={handleEnviar} disabled={enviando || !archivo}>
              {enviando ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : 'Enviar autorización'}
            </Button>
          </div>
        )}
      </div>
    </InscripcionLayout>
  )
}
