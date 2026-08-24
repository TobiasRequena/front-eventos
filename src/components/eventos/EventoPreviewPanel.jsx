import { useFormContext, useWatch } from 'react-hook-form'
import { CalendarRange, ImageOff, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Separator } from '@/components/ui/separator'
import { CAMPOS_BASE_INSCRIPCION } from '@/lib/constants/camposBase'
import { CampoFormInput } from '@/components/eventos/CampoFormInput'
import { InscripcionSeccionGrupos } from '@/components/inscripcion/InscripcionSeccionGrupos'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { FileText, FileCheck, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(fechaIso))
}

function adaptarEventoAForm(evento) {
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fechaInicio: evento.fecha_inicio,
    tieneTalleres: evento.tiene_talleres,
    tieneGrupos: evento.tiene_grupos,
    politicaMenor: evento.politica_menor,
    camposForm: evento.camposForm ?? [],
    talleresSueltos: evento.talleresSueltos ?? [],
    bloquesTaller: evento.bloquesTaller ?? [],
    seccionTalleres: [
      ...(evento.bloquesTaller ?? []).map((b) => ({ tipo: 'bloque', ...b })),
      ...(evento.talleresSueltos ?? []).map((t) => ({ tipo: 'taller_suelto', ...t })),
    ],
    costo: parseFloat(evento.costo ?? 0),
    cbuCvu: evento.cbu_cvu,
    aliasCobro: evento.alias_cobro,
    imagenUrl: evento.imagenUrl,
    configFichaMedica: evento.config_ficha_medica ?? 'no',
    configCertificado: evento.config_certificado ?? 'no',
    requiereAutorizacionMenores: evento.requiere_autorizacion_menores ?? false,
    autorizacionTemplateUrl: evento.autorizacion_template_url ?? null,
  }
}

function useDatos(eventoExterno, imagenPreviewExterna) {
  if (eventoExterno) {
    const datos = adaptarEventoAForm(eventoExterno)
    return { ...datos, imagenPreview: datos.imagenUrl, form: null }
  }

  const form = useFormContext()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const seccionTalleres = useWatch({ control: form.control, name: 'seccionTalleres' }) ?? []
  return {
    nombre: form.watch('nombre'),
    descripcion: form.watch('descripcion'),
    fechaInicio: form.watch('fechaInicio'),
    tieneTalleres: form.watch('tieneTalleres'),
    tieneGrupos: form.watch('tieneGrupos'),
    politicaMenor: form.watch('politicaMenor'),
    camposForm: form.watch('camposForm') ?? [],
    seccionTalleres,
    costo: form.watch('costo'),
    cbuCvu: form.watch('cbuCvu'),
    aliasCobro: form.watch('aliasCobro'),
    imagenPreview: imagenPreviewExterna,
    configFichaMedica: form.watch('configFichaMedica') ?? 'no',
    configCertificado: form.watch('configCertificado') ?? 'no',
    requiereAutorizacionMenores: form.watch('requiereAutorizacionMenores') ?? false,
    form,
  }
}

export function EventoPreviewPanel({ evento, imagenPreview: imagenPreviewExterna, readOnly = false }) {
  const { form, ...datos } = useDatos(readOnly ? evento : null, imagenPreviewExterna)

  const {
    nombre, descripcion, fechaInicio,
    tieneTalleres, tieneGrupos, politicaMenor,
    camposForm, bloquesTaller, talleresSueltos,
    costo, cbuCvu, aliasCobro, imagenPreview,
    configFichaMedica, configCertificado, requiereAutorizacionMenores, seccionTalleres
  } = datos

  const tieneSeccionGrupos = tieneGrupos || politicaMenor !== 'no_aplica'

  // Para el preview necesitamos un objeto evento con la forma correcta
  const eventoParaGrupos = readOnly
    ? evento
    : { tiene_grupos: tieneGrupos, politica_menor: politicaMenor }

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
        {/* 1. Nombre + fecha + descripción */}
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
          {descripcion && (
            <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>
          )}
        </div>

        {/* 2. Costo */}
        {Number(costo) > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Costo de inscripción
              </p>
              <p className="text-2xl font-semibold text-foreground">
                ${Number(costo).toLocaleString('es-AR')}
              </p>
            </div>
          </>
        )}

        {/* 3. Tus datos (campos base) */}
        <Separator />
        <div className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tus datos
          </p>
          {CAMPOS_BASE_INSCRIPCION.map((campo) => (
            <div key={campo.id} className="space-y-1.5">
              <Label className="text-sm">{campo.label}</Label>
              <Input disabled placeholder={campo.label} />
            </div>
          ))}
        </div>

        {/* 4. Grupos */}
        {tieneSeccionGrupos && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Participación
              </p>
              <InscripcionSeccionGrupos evento={eventoParaGrupos} preview />
            </div>
          </>
        )}


        {/* 5. Formulario adicional */}
        {camposForm.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Información adicional
              </p>
              {camposForm.map((campo, index) => (
                <CampoFormInput key={campo.id ?? index} campo={campo} preview />
              ))}
            </div>
          </>
        )}

        {/* 6. Talleres */}
        {tieneTalleres && seccionTalleres.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Talleres disponibles
              </p>
              {seccionTalleres.map((item, itemIndex) => {
                if (item.tipo === 'bloque') {
                  const esInformativo = item.talleres.length <= 1
                  const cantidadElegible = item.cantidad_elegible ?? item.cantidadElegible ?? 1
                  const esObligatorio = item.es_obligatorio ?? item.esObligatorio ?? true
                  const usaRadio = !esInformativo && cantidadElegible === 1
                  return (
                    <div key={item.id ?? itemIndex} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {item.nombre || `Bloque ${itemIndex + 1}`}
                          </p>

                          {item.inicio && item.fin && (
                            <span className="text-xs text-muted-foreground">
                              {formatearFechaHora(item.inicio)} — {formatearFechaHora(item.fin)}
                            </span>
                          )}
                        </div>

                        {esInformativo ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            Informativo
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                            {esObligatorio
                              ? `Elegí ${cantidadElegible}`
                              : `Elegí hasta ${cantidadElegible}`}
                          </span>
                        )}
                      </div>
                      {esInformativo ? (
                        item.talleres.map((_, tallerIndex) => (
                          <div key={tallerIndex} className="rounded-md border border-border p-3 text-sm">
                            {form ? <TallerPreview bloqueIndex={itemIndex} tallerIndex={tallerIndex} /> : <TallerDetalle taller={item.talleres[tallerIndex]} />}
                          </div>
                        ))
                      ) : usaRadio ? (
                        <RadioGroup disabled className="space-y-2">
                          {item.talleres.map((_, tallerIndex) => (
                            <Label key={tallerIndex} className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal">
                              <RadioGroupItem value={String(tallerIndex)} className="mt-0.5" />
                              {form ? <TallerPreview bloqueIndex={itemIndex} tallerIndex={tallerIndex} /> : <TallerDetalle taller={item.talleres[tallerIndex]} />}
                            </Label>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-2">
                          {item.talleres.map((_, tallerIndex) => (
                            <Label key={tallerIndex} className="flex cursor-not-allowed items-start gap-3 rounded-md border border-border p-3 text-sm font-normal">
                              <Checkbox disabled className="mt-0.5" />
                              {form ? <TallerPreview bloqueIndex={itemIndex} tallerIndex={tallerIndex} /> : <TallerDetalle taller={item.talleres[tallerIndex]} />}
                            </Label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }
                return (
                  <div key={item.id ?? itemIndex} className="rounded-md border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.nombre}</p>
                        {item.descripcion && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{item.descripcion}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {item.inicio && (
                            <span className="flex items-center gap-1">
                              <CalendarRange className="h-4 w-4" />
                              {formatearFechaHora(item.inicio)}
                              {item.fin && ` — ${formatearFechaHora(item.fin)}`}
                            </span>
                          )}
                          {Number.isFinite(Number(item.capacidad)) && item.capacidad !== null && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {item.capacidad} cupos
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs',
                        (item.esObligatorio || item.es_obligatorio) ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {(item.esObligatorio || item.es_obligatorio) ? 'Obligatorio' : 'Opcional'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* 8. Documentación */}
        {(configFichaMedica !== 'no' || configCertificado !== 'no' || requiereAutorizacionMenores) && (
          <>
            <Separator />
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documentación requerida
              </p>
              <div className="space-y-2">
                {configFichaMedica !== 'no' && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-foreground">
                      Ficha médica —{' '}
                      <span className="text-muted-foreground">
                        {configFichaMedica.startsWith('obligatorio') ? 'Obligatoria' : 'Opcional'}
                        {configFichaMedica.includes('menores') ? ' para menores' :
                          configFichaMedica.includes('mayores') ? ' para mayores' : ' para todos'}
                      </span>
                    </p>
                  </div>
                )}
                {requiereAutorizacionMenores && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileCheck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-foreground">
                      Autorización de menor —{' '}
                      <span className="text-muted-foreground">Obligatoria para menores</span>
                    </p>
                  </div>
                )}
                {configCertificado !== 'no' && (
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-foreground">
                      Certificado de antecedentes —{' '}
                      <span className="text-muted-foreground">
                        {configCertificado.startsWith('obligatorio') ? 'Obligatorio' : 'Opcional'}
                        {configCertificado.includes('menores') ? ' para menores' :
                          configCertificado.includes('mayores') ? ' para mayores' :
                            configCertificado.includes('referentes') ? ' para referentes' : ' para todos'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* 7. Datos de pago */}
        {Number(costo) > 0 && (cbuCvu || aliasCobro) && (
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

function TallerPreview({ bloqueIndex, tallerIndex }) {
  const form = useFormContext()
  const taller = useWatch({
    control: form.control,
    name: `seccionTalleres.${bloqueIndex}.talleres.${tallerIndex}`,
  })
  return <TallerDetalle taller={taller} />
}

function TallerDetalle({ taller }) {
  if (!taller) return null
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
            {new Intl.DateTimeFormat('es-AR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(taller.inicio))}
          </span>
        )}
        {taller.capacidad && !isNaN(taller.capacidad) && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {taller.capacidad} cupos
          </span>
        )}
      </div>
    </div>
  )
}