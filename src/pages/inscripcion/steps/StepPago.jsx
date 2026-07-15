import { useState } from 'react'
import { Upload, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'

export default function StepPago({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder } = wizard

  const [comprobante, setComprobante] = useState(datosWizard.comprobantePago ?? null)
  const [pagoPostergado, setPagoPostergado] = useState(datosWizard.pagoPostergado ?? false)
  const [preview, setPreview] = useState(null)

  function handleArchivoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setComprobante(file)
    setPagoPostergado(false)
    setPreview(URL.createObjectURL(file))
  }

  function handleQuitarComprobante() {
    setComprobante(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  function handlePostergar() {
    setComprobante(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setPagoPostergado(true)
  }

  function handleAvanzar() {
    avanzar({
      comprobantePago: comprobante,
      pagoPostergado,
    })
  }

  const puedeAvanzar = comprobante !== null || pagoPostergado

  const costo = parseFloat(evento.costo ?? 0)

  return (
    <InscripcionStepLayout evento={evento} titulo="Pago de inscripción">
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Costo de inscripción
          </p>
          <p className="text-3xl font-semibold text-foreground">
            ${costo.toLocaleString('es-AR')}
          </p>
        </div>

        {(evento.cbu_cvu || evento.alias_cobro) && (
          <div className="space-y-2 rounded-md bg-muted/50 p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Transferir a:
            </p>
            {evento.alias_cobro && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Alias</span>
                <span className="font-medium text-foreground">{evento.alias_cobro}</span>
              </div>
            )}
            {evento.cbu_cvu && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CBU/CVU</span>
                <span className="font-medium text-foreground">{evento.cbu_cvu}</span>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            ¿Ya realizaste la transferencia?
          </p>

          {!comprobante && !pagoPostergado && (
            <label className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center',
              'hover:bg-accent/50 transition-colors'
            )}>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Subir comprobante</p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG o PDF — hasta 5MB
              </p>
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleArchivoChange}
              />
            </label>
          )}

          {comprobante && (
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 p-3">
              <div className="flex items-center gap-2 min-w-0">
                <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="truncate text-sm text-foreground">{comprobante.name}</p>
              </div>
              <button
                type="button"
                onClick={handleQuitarComprobante}
                className="ml-2 shrink-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {pagoPostergado && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3">
              <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Vas a abonar después. Recordá que tu inscripción puede quedar pendiente hasta confirmar el pago.
              </p>
            </div>
          )}

          {!pagoPostergado && (
            <button
              type="button"
              onClick={handlePostergar}
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Pagar después
            </button>
          )}

          {pagoPostergado && (
            <button
              type="button"
              onClick={() => setPagoPostergado(false)}
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Subir comprobante ahora
            </button>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={retroceder} className="flex-1">
            Atrás
          </Button>
          <Button
            type="button"
            onClick={handleAvanzar}
            disabled={!puedeAvanzar}
            className="flex-1"
          >
            Continuar
          </Button>
        </div>
      </div>
    </InscripcionStepLayout>
  )
}