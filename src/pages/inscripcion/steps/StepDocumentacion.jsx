import { useState } from 'react'
import { FileText, Upload, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'

// Sección de ficha médica
const TIPOS_SANGRE = ['No lo sé', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'

const schemaFichaMedica = (obligatoria) => z.object({
  obra_social: obligatoria
    ? z.string().min(1, 'La obra social es obligatoria.')
    : z.string().optional(),
  tipo_sangre: obligatoria
    ? z.string().refine(
      (val) => ['no_se', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].includes(val),
      { message: 'Seleccioná el tipo de sangre.' }
    )
    : z.string().optional(),
  recomendaciones: z.string().optional(),
  tiene_discapacidad: z.boolean().optional(),
  adaptaciones: z.any().optional(),
}).passthrough().refine(
  (data) => !data.tiene_discapacidad || !!data.recomendaciones?.trim(),
  {
    message: 'Contanos cómo podemos ayudarte.',
    path: ['recomendaciones'],
  }
).refine(
  (data) => {
    if (!data.tiene_discapacidad) return true
    const adaptaciones = data.adaptaciones ?? {}
    const algunaMarcada = Object.entries(adaptaciones)
      .filter(([k]) => k !== 'otra')
      .some(([, v]) => v === true)
    const tieneOtra = !!adaptaciones.otra?.trim()
    return algunaMarcada || tieneOtra
  },
  {
    message: 'Marcá al menos una adaptación o describí en "Otra adaptación".',
    path: ['adaptaciones'],
  }
)

function FichaMedicaForm({ form, obligatoria }) {
  const v = form.watch()

  function set(campo, val) {
    form.setValue(campo, val)
  }

  function setMedicacion(medicaciones) {
    form.setValue('medicacion', medicaciones)
  }

  return (
    <Form {...form}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="obra_social"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Obra social</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Apross / No tengo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo_sangre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de sangre</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccioná una opción" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="no_se">No lo sé</SelectItem>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Condiciones de salud</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { campo: 'tiene_diabetes', label: 'Diabetes' },
              { campo: 'tiene_asma', label: 'Asma' },
              { campo: 'tiene_epilepsia', label: 'Epilepsia' },
              { campo: 'tiene_cardiopatia', label: 'Cardiopatía' },
            ].map(({ campo, label }) => (
              <div key={campo} className="flex items-center gap-2">
                <Checkbox
                  id={campo}
                  checked={v[campo] ?? false}
                  onCheckedChange={(checked) => set(campo, checked)}
                />
                <label htmlFor={campo} className="text-sm text-foreground cursor-pointer">
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Otras condiciones</Label>
            <Input
              placeholder="Ej. Hipotiroidismo"
              value={v.otras_condiciones ?? ''}
              onChange={(e) => set('otras_condiciones', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Alergias</Label>
            <Input
              placeholder="Ej. Penicilina"
              value={v.alergias ?? ''}
              onChange={(e) => set('alergias', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Restricciones alimentarias</Label>
          <Input
            placeholder="Ej. Celíaco"
            value={v.restricciones_alimentarias ?? ''}
            onChange={(e) => set('restricciones_alimentarias', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Medicación</Label>
          {(v.medicacion ?? []).map((med, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="Nombre"
                value={med.nombre ?? ''}
                onChange={(e) => {
                  const nueva = [...(v.medicacion ?? [])]
                  nueva[i] = { ...nueva[i], nombre: e.target.value }
                  setMedicacion(nueva)
                }}
              />
              <Input
                placeholder="Dosis"
                value={med.dosis ?? ''}
                onChange={(e) => {
                  const nueva = [...(v.medicacion ?? [])]
                  nueva[i] = { ...nueva[i], dosis: e.target.value }
                  setMedicacion(nueva)
                }}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Horario"
                  value={med.horario ?? ''}
                  onChange={(e) => {
                    const nueva = [...(v.medicacion ?? [])]
                    nueva[i] = { ...nueva[i], horario: e.target.value }
                    setMedicacion(nueva)
                  }}
                />
                <button
                  type="button"
                  onClick={() => setMedicacion((v.medicacion ?? []).filter((_, j) => j !== i))}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setMedicacion([...(v.medicacion ?? []), { nombre: '', dosis: '', horario: '' }])}
            className="flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar medicación
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="tiene_discapacidad"
              checked={v.tiene_discapacidad ?? false}
              onCheckedChange={(checked) => {
                set('tiene_discapacidad', checked)
                form.setValue('tiene_discapacidad', checked)
              }}
            />
            <label htmlFor="tiene_discapacidad" className="text-sm font-medium text-foreground cursor-pointer">
              ¿Necesita adaptaciones?
            </label>
          </div>
          {v.tiene_discapacidad && (
            <div className="space-y-3 pl-6">
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { campo: 'movilidad', label: 'Movilidad reducida' },
                  { campo: 'lengua_senas', label: 'Lengua de señas' },
                  // { campo: 'material_accesible', label: 'Material accesible' },
                  { campo: 'acompanante', label: 'Acompañante' },
                  // { campo: 'espacio_tranquilo', label: 'Espacio tranquilo' },
                  // { campo: 'participacion', label: 'Adaptación en participación' },
                ].map(({ campo, label }) => (
                  <div key={campo} className="flex items-center gap-2">
                    <Checkbox
                      id={`adaptacion_${campo}`}
                      checked={v.adaptaciones?.[campo] ?? false}
                      onCheckedChange={(checked) => {
                        const nuevasAdaptaciones = { ...(v.adaptaciones ?? {}), [campo]: checked }
                        set('adaptaciones', nuevasAdaptaciones)
                        form.setValue('adaptaciones', nuevasAdaptaciones)
                      }}
                    />
                    <label htmlFor={`adaptacion_${campo}`} className="text-sm text-foreground cursor-pointer">
                      {label}
                    </label>
                  </div>
                ))}
              </div>
              {form.formState.errors.adaptaciones && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.adaptaciones.message}
                </p>
              )}
              <div className="space-y-1.5">
                <Label>Otra adaptación</Label>
                <Input
                  placeholder="Describí la adaptación necesaria"
                  value={v.adaptaciones?.otra ?? ''}
                  onChange={(e) => {
                    const nuevasAdaptaciones = { ...(v.adaptaciones ?? {}), otra: e.target.value }
                    set('adaptaciones', nuevasAdaptaciones)
                    form.setValue('adaptaciones', nuevasAdaptaciones)
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <FormField
          control={form.control}
          name="recomendaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Recomendaciones generales
                {form.watch('tiene_discapacidad') && <span className="ml-1 text-destructive">*</span>}
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder={
                    form.watch('tiene_discapacidad')
                      ? 'Contanos cómo podemos acompañarte mejor durante el evento...'
                      : 'Información adicional que el organizador deba saber'
                  }
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  )
}

function SubirArchivoBtn({ label, archivo, onArchivo, accept = '.pdf,image/*' }) {
  return (
    <div className="space-y-2">
      <label className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-accent/50 transition-colors',
        archivo && 'border-success/40 bg-success/5'
      )}>
        {archivo
          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          : <Upload className="h-4 w-4 shrink-0" />
        }
        <span className="truncate">{archivo ? archivo.name : label}</span>
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
        />
      </label>
      {archivo && (
        <button
          type="button"
          onClick={() => onArchivo(null)}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Quitar archivo
        </button>
      )}
    </div>
  )
}

export function StepDocumentacion({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder, esUltimoPasoVisible } = wizard
  const [fichaMedica, setFichaMedica] = useState(datosWizard.fichaMedica ?? null)
  const [autorizacionArchivo, setAutorizacionArchivo] = useState(datosWizard.autorizacionArchivo ?? null)
  const [certificadoArchivo, setCertificadoArchivo] = useState(datosWizard.certificadoArchivo ?? null)

  const edad = datosWizard.nacimiento
    ? Math.floor((Date.now() - new Date(datosWizard.nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const esMenor = datosWizard.esMayor === false || (edad !== null && edad < 18)
  const esMayor = datosWizard.esMayor === true || (edad !== null && edad >= 18)
  const esReferente = datosWizard.rolGrupo === 'responsable'

  const configFicha = evento.config_ficha_medica ?? 'no'
  const configCert = evento.config_certificado ?? 'no'

  const mostrarFicha = configFicha !== 'no' && (
    (configFicha.includes('menores') && esMenor) ||
    (configFicha.includes('mayores') && esMayor) ||
    configFicha.includes('todos')
  )

  const fichaMedicaObligatoria = mostrarFicha && configFicha.startsWith('obligatorio')

  const requiereAutorizaciones = Boolean(evento.requiere_autorizacion_menores || evento.requiereAutorizacionMenores)
  const templateAutorizacionUrl = evento.autorizacion_template_url || evento.autorizacionTemplateUrl

  const mostrarAutorizacion = requiereAutorizaciones && esMenor

  const mostrarCertificado = configCert !== 'no' && (
    (configCert.includes('menores') && esMenor) ||
    (configCert.includes('mayores') && esMayor) ||
    configCert.includes('todos') ||
    (configCert.includes('referentes') && esReferente)
  )

  const certificadoObligatorio = mostrarCertificado && configCert.startsWith('obligatorio')

  const formFicha = useForm({
    resolver: zodResolver(schemaFichaMedica(fichaMedicaObligatoria)),
    defaultValues: {
      obra_social: '',
      tipo_sangre: fichaMedicaObligatoria ? '' : 'no_se',
      tiene_discapacidad: false,
      adaptaciones: {},
      recomendaciones: '',
      ...(datosWizard.fichaMedica ?? {}),
    },
  })

  function handleContinuar() {
    if (mostrarFicha) {
      formFicha.handleSubmit(
        (values) => {
          if (values.tiene_discapacidad && !values.recomendaciones?.trim()) {
            formFicha.setError('recomendaciones', { message: 'Recomendaciones generales es obligatorio si necesitas alguna adaptación.' })
            toast.error('Completá el campo de recomendaciones generales antes de continuar.')
            return
          }
          const fichaMedicaNormalizada = {
            ...values,
            tipo_sangre: values.tipo_sangre === 'no_se' || values.tipo_sangre === '' ? null : values.tipo_sangre,
          }
          continuar(fichaMedicaNormalizada)
        },
        () => toast.error('Completá los campos obligatorios antes de continuar.')
      )()
      return
    }
    continuar(null)
  }

  function continuar(fichaMedicaValues) {
    if (mostrarAutorizacion && !autorizacionArchivo) {
      toast.error('Debés subir la autorización firmada.')
      return
    }
    if (certificadoObligatorio && !certificadoArchivo) {
      toast.error('Debés subir el certificado de antecedentes.')
      return
    }
    avanzar({
      fichaMedica: fichaMedicaValues,
      autorizacionArchivo,
      certificadoArchivo,
    })
  }

  const hayAlgoQueMostrar = mostrarFicha || mostrarAutorizacion || mostrarCertificado

  if (!hayAlgoQueMostrar) {
    return (
      <InscripcionStepLayout evento={evento} titulo="Documentación">
        <div className="space-y-5">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium text-foreground">No se requiere documentación</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  No tenés documentación pendiente para completar en este evento.
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={retroceder}>
              Atrás
            </Button>
            <Button type="button" onClick={handleContinuar}>
              {esUltimoPasoVisible ? 'Enviar inscripción' : 'Continuar'}
            </Button>
          </div>
        </div>
      </InscripcionStepLayout>
    )
  }

  return (
    <InscripcionStepLayout evento={evento} titulo="Documentación">
      <div className="space-y-5">
        {mostrarFicha && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Ficha médica
                {fichaMedicaObligatoria
                  ? <span className="ml-2 text-xs font-normal text-destructive">Obligatoria</span>
                  : <span className="ml-2 text-xs font-normal text-muted-foreground">Opcional</span>
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FichaMedicaForm form={formFicha} obligatoria={fichaMedicaObligatoria} />
            </CardContent>
          </Card>
        )}

        {mostrarAutorizacion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autorización de menor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templateAutorizacionUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(templateAutorizacionUrl)
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `autorizacion-${evento.nombre}.pdf`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  Descargar template de autorización
                </button>
              )}
              <p className="text-xs text-muted-foreground">
                {templateAutorizacionUrl
                  ? 'Descargá el template, completalo, firmalo y subí el archivo acá.'
                  : 'Subí la autorización firmada por el tutor del menor.'}
              </p>
              <SubirArchivoBtn
                label="Subir autorización firmada (PDF o imagen)"
                archivo={autorizacionArchivo}
                onArchivo={setAutorizacionArchivo}
              />
            </CardContent>
          </Card>
        )}

        {mostrarCertificado && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Certificado de antecedentes
                {certificadoObligatorio
                  ? <span className="ml-2 text-xs font-normal text-destructive">Obligatorio</span>
                  : <span className="ml-2 text-xs font-normal text-muted-foreground">Opcional</span>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Subí tu certificado de antecedentes penales (PDF o imagen).
              </p>
              <SubirArchivoBtn
                label="Subir certificado (PDF o imagen)"
                archivo={certificadoArchivo}
                onArchivo={setCertificadoArchivo}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={retroceder}>
            Atrás
          </Button>
          <Button type="button" onClick={handleContinuar}>
            {esUltimoPasoVisible ? 'Enviar inscripción' : 'Continuar'}
          </Button>
        </div>
      </div>
    </InscripcionStepLayout>
  )
}