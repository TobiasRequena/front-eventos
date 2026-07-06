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

// Adapta los datos del evento real (snake_case del back)
// al formato que espera el panel (camelCase del form)
function adaptarEventoAForm(evento) {
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fechaInicio: evento.fecha_inicio,
    tieneTalleres: evento.tiene_talleres,
    camposForm: evento.camposForm ?? [],
    bloquesTaller: evento.bloquesTaller ?? [],
    costo: parseFloat(evento.costo ?? 0),
    cbuCvu: evento.cbu_cvu,
    aliasCobro: evento.alias_cobro,
    imagenUrl: evento.imagenUrl,
  }
}

function useDatos(eventoExterno, imagenPreviewExterna) {
  // modo readOnly: datos vienen del evento real
  if (eventoExterno) {
    const datos = adaptarEventoAForm(eventoExterno)
    return { ...datos, imagenPreview: datos.imagenUrl }
  }

  // modo form: datos vienen de react-hook-form
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const form = useFormContext()
  return {
    nombre: form.watch('nombre'),
    descripcion: form.watch('descripcion'),
    fechaInicio: form.watch('fechaInicio'),
    tieneTalleres: form.watch('tieneTalleres'),
    camposForm: form.watch('camposForm') ?? [],
    bloquesTaller: form.watch('bloquesTaller') ?? [],
    costo: form.watch('costo'),
    cbuCvu: form.watch('cbuCvu'),
    aliasCobro: form.watch('aliasCobro'),
    imagenPreview: imagenPreviewExterna,
  }
}

export function EventoPreviewPanel({ evento, imagenPreview: imagenPreviewExterna, readOnly = false }) {
  const datos = useDatos(readOnly ? evento : null, imagenPreviewExterna)

  const {
    nombre,
    descripcion,
    fechaInicio,
    tieneTalleres,
    camposForm,
    bloquesTaller,
    costo,
    cbuCvu,
    aliasCobro,
    imagenPreview,
  } = datos

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
            <CampoFormInput key={campo.id ?? index} campo={campo} preview />
          ))}
        </div>

        {tieneTalleres && bloquesTaller.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Talleres disponibles
              </p>

              {bloquesTaller.map((bloque, bloqueIndex) => {
                const esInformativo = bloque.talleres.length <= 1
                const cantidadElegible = bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1
                const esObligatorio = bloque.es_obligatorio ?? bloque.esObligatorio ?? true
                const usaRadio = !esInformativo && cantidadElegible === 1

                return (
                  <div key={bloque.id ?? bloqueIndex} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {bloque.nombre || `Bloque ${bloqueIndex + 1}`}
                      </p>
                      {esInformativo ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Informativo
                        </span>
                      ) : (
                        <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                          {esObligatorio
                            ? `Elegí exactamente ${cantidadElegible}`
                            : `Elegí hasta ${cantidadElegible}`}
                        </span>
                      )}
                    </div>

                    {esInformativo ? (
                      bloque.talleres.map((taller, i) => (
                        <div key={taller.id ?? i} className="rounded-md border border-border p-3 text-sm">
                          <TallerDetalle taller={taller} />
                        </div>
                      ))
                    ) : usaRadio ? (
                      <RadioGroup disabled className="space-y-2">
                        {bloque.talleres.map((taller, i) => (
                          <Label
                            key={taller.id ?? i}
                            htmlFor={`preview-bloque-${bloqueIndex}-taller-${i}`}
                            className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal"
                          >
                            <RadioGroupItem
                              value={String(i)}
                              id={`preview-bloque-${bloqueIndex}-taller-${i}`}
                              className="mt-0.5"
                            />
                            <TallerDetalle taller={taller} />
                          </Label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className="space-y-2">
                        {bloque.talleres.map((taller, i) => (
                          <Label
                            key={taller.id ?? i}
                            htmlFor={`preview-bloque-${bloqueIndex}-taller-${i}`}
                            className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal"
                          >
                            <Checkbox
                              disabled
                              id={`preview-bloque-${bloqueIndex}-taller-${i}`}
                              className="mt-0.5"
                            />
                            <TallerDetalle taller={taller} />
                          </Label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
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

function TallerDetalle({ taller }) {
  return (
    <div className="flex-1">
      <p className="font-medium text-foreground">{taller.nombre}</p>
      {taller.descripcion && (
        <p className="mt-0.5 text-xs text-muted-foreground">{taller.descripcion}</p>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        {taller.inicio && (
          <span className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {formatearFechaHora(taller.inicio)}
          </span>
        )}
        {taller.capacidad > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {taller.capacidad} cupos
          </span>
        )}
      </div>
    </div>
  )
}