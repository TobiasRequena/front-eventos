import { useFormContext } from 'react-hook-form'
import { CalendarRange, ImageOff, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Separator } from '@/components/ui/separator'
import { CAMPOS_BASE_INSCRIPCION } from '@/lib/constants/camposBase'
import { CampoFormInput } from '@/components/eventos/CampoFormInput'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaIso))
}

export function EventoPreviewPanel({ imagenPreview }) {
  const form = useFormContext()

  const nombre = form.watch('nombre')
  const descripcion = form.watch('descripcion')
  const fechaInicio = form.watch('fechaInicio')
  const tieneTalleres = form.watch('tieneTalleres')
  const camposForm = form.watch('camposForm') ?? []
  const talleres = form.watch('talleres') ?? []
  const costo = form.watch('costo')
  const cbuCvu = form.watch('cbuCvu')
  const aliasCobro = form.watch('aliasCobro')
  const modoTaller = form.watch('modoTaller')

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <AspectRatio ratio={16 / 9} className="bg-muted">
        {imagenPreview ? (
          <img src={imagenPreview} alt="Portada" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageOff className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
      </AspectRatio>

      <CardContent className="space-y-5 p-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {nombre || 'Nombre del evento'}
          </h3>
          {fechaInicio && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              {formatearFechaHora(fechaInicio)}
            </div>
          )}
          {descripcion && <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>}
        </div>

        {costo > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Costo de inscripción
            </p>
            <p className="text-2xl font-semibold text-foreground">
              ${costo.toLocaleString('es-AR')}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Formulario de inscripción
          </p>

          {CAMPOS_BASE_INSCRIPCION.map((campo) => (
            <div key={campo.id} className="space-y-1.5">
              <Label className="text-sm">{campo.label}</Label>
              <Input disabled placeholder={campo.label} />
            </div>
          ))}

          {camposForm.map((campo, index) => (
            <CampoFormInput key={index} campo={campo} preview />
          ))}
        </div>

        {tieneTalleres && talleres.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Talleres disponibles{' '}
                <span className="font-normal">
                  ({modoTaller === 'paralelos' ? 'elegí uno' : 'elegí los que quieras'})
                </span>
              </p>

              {modoTaller === 'paralelos' ? (
                <RadioGroup disabled className="space-y-3">
                  {talleres.map((taller, index) => (
                    <Label
                      key={index}
                      htmlFor={`preview-taller-${index}`}
                      className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal"
                    >
                      <RadioGroupItem
                        value={String(index)}
                        id={`preview-taller-${index}`}
                        className="mt-0.5"
                      />
                      <TallerPreviewDetalle taller={taller} index={index} />
                    </Label>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {talleres.map((taller, index) => (
                    <Label
                      key={index}
                      htmlFor={`preview-taller-${index}`}
                      className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal"
                    >
                      <Checkbox disabled id={`preview-taller-${index}`} className="mt-0.5" />
                      <TallerPreviewDetalle taller={taller} index={index} />
                    </Label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {costo > 0 && (cbuCvu || aliasCobro) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Datos para transferir
              </p>
              <div className="space-y-1 rounded-md bg-muted/50 p-3 text-sm">
                {aliasCobro && (
                  <p>
                    <span className="text-muted-foreground">Alias: </span>
                    <span className="font-medium text-foreground">{aliasCobro}</span>
                  </p>
                )}
                {cbuCvu && (
                  <p>
                    <span className="text-muted-foreground">CBU/CVU: </span>
                    <span className="font-medium text-foreground">{cbuCvu}</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function TallerPreviewDetalle({ taller, index }) {
  return (
    <div className="flex-1">
      <p className="font-medium text-foreground">{taller.nombre || `Taller ${index + 1}`}</p>
      {taller.descripcion && (
        <p className="mt-0.5 text-xs text-muted-foreground">{taller.descripcion}</p>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        {taller.inicio && (
          <span className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {new Intl.DateTimeFormat('es-AR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(taller.inicio))}
          </span>
        )}
        {taller.capacidad && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {taller.capacidad} cupos
          </span>
        )}
      </div>
    </div>
  )
}