import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { AlertTriangle, ChevronDown, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RemovableBadge } from '@/components/ui/removable-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CAMPOS_BASE_INSCRIPCION } from '@/lib/constants/camposBase'
import { TIPOS_CAMPO_FORM } from '@/lib/constants/tiposCampoForm'
import { cn } from '@/lib/utils'

const labelTipo = (tipo) => TIPOS_CAMPO_FORM.find((t) => t.value === tipo)?.label ?? tipo

/**
 * Badge de una opción ya guardada: no se puede quitar (puede haber participantes
 * que la eligieron), pero con un click se renombra en el lugar.
 */
function OpcionOriginal({ valor, onChange }) {
  const [editando, setEditando] = useState(false)

  if (editando) {
    return (
      <Input
        autoFocus
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditando(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            setEditando(false)
          }
        }}
        className="h-6 w-32 px-2 text-xs"
      />
    )
  }

  return (
    <button type="button" onClick={() => setEditando(true)} title="Click para renombrar">
      <Badge variant="outline" className="cursor-text hover:bg-accent">
        {valor || <span className="text-destructive">Sin nombre</span>}
      </Badge>
    </button>
  )
}

/** Mismo editor que al crear el evento, pero las opciones originales solo se renombran. */
function OpcionesEdicion({ opciones, opcionesOriginales, onChange, error }) {
  const [nuevaOpcion, setNuevaOpcion] = useState('')
  const cantOriginales = opcionesOriginales.length

  function agregarOpcion() {
    const valor = nuevaOpcion.trim()
    if (!valor) return
    onChange([...opciones, valor])
    setNuevaOpcion('')
  }

  const hayRenombres = opcionesOriginales.some((original, i) => opciones[i]?.trim() !== original)

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Opciones</p>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {opciones.map((opcion, index) =>
          index < cantOriginales ? (
            <OpcionOriginal
              key={index}
              valor={opcion}
              onChange={(valor) => onChange(opciones.map((o, j) => (j === index ? valor : o)))}
            />
          ) : (
            <RemovableBadge
              key={`${opcion}-${index}`}
              variant="outline"
              onRemove={() => onChange(opciones.filter((_, j) => j !== index))}
            >
              {opcion}
            </RemovableBadge>
          )
        )}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            value={nuevaOpcion}
            onChange={(e) => setNuevaOpcion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregarOpcion()
              }
            }}
            placeholder="Nueva opción"
            className="h-8 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Hacé click en una opción existente para renombrarla. No se pueden quitar.
          </p>
        </div>
        <button
          type="button"
          onClick={agregarOpcion}
          className="flex h-8 shrink-0 items-center gap-1 rounded-md border border-input px-2.5 text-xs hover:bg-accent"
        >
          Agregar
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive">
          {error.message ?? error.find?.((e) => e)?.message ?? 'Revisá las opciones.'}
        </p>
      )}

      {hayRenombres && (
        <p className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Cambiaste el nombre de opciones ya elegidas. Las respuestas se actualizan solas; te
          recomendamos avisar a los participantes del cambio.
        </p>
      )}
    </div>
  )
}

/** Misma estructura visual que CampoFormItem, sin drag ni cambio de tipo/requerido. */
function CampoEdicionItem({ index, original, onDarDeBaja }) {
  const form = useFormContext()
  const [expandido, setExpandido] = useState(true)
  const campo = form.watch(`camposForm.${index}`)
  const errores = form.formState.errors.camposForm?.[index]

  function set(campoPath, valor) {
    form.setValue(`camposForm.${index}.${campoPath}`, valor, { shouldDirty: true, shouldValidate: true })
  }

  if (!campo.activo) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5">
        <span className="flex-1 truncate text-sm text-muted-foreground line-through">
          {campo.etiqueta}
        </span>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Dado de baja
        </span>
        <button
          type="button"
          onClick={() => set('activo', true)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reactivar
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpandido((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="flex-1 truncate text-sm">
            {campo.etiqueta || <span className="text-muted-foreground">Campo sin nombre</span>}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {labelTipo(campo.tipo)}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-muted-foreground transition-transform', expandido && 'rotate-180')}
          />
        </button>

        <button
          type="button"
          onClick={onDarDeBaja}
          title="Dar de baja"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expandido && (
        <div className="space-y-3 border-t border-border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Etiqueta</label>
              <Input
                value={campo.etiqueta}
                onChange={(e) => set('etiqueta', e.target.value)}
                placeholder="Ej. Talla de remera"
                className={cn('h-9 text-sm', errores?.etiqueta && 'border-destructive')}
              />
              {errores?.etiqueta && (
                <p className="mt-1 text-xs text-destructive">{errores.etiqueta.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo</label>
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground">
                {labelTipo(campo.tipo)}
              </div>
            </div>
          </div>

          {campo.tipo === 'seleccion' && (
            <OpcionesEdicion
              opciones={campo.opciones ?? []}
              opcionesOriginales={original?.opciones ?? []}
              onChange={(valor) => set('opciones', valor)}
              error={errores?.opciones}
            />
          )}

          {campo.tipo === 'seleccion' && (
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Permitir elegir más de una opción</span>
                <Switch checked={!!campo.multiple} onCheckedChange={(v) => set('multiple', v)} />
              </div>
              {original?.multiple && !campo.multiple && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Si algún participante ya eligió más de una opción, no se va a poder guardar este cambio.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Campo obligatorio</span>
            <Switch checked={!!campo.requerido} disabled />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Edición de los campos del formulario de un evento ya creado: renombrar,
 * agregar/renombrar opciones, permitir varias opciones y dar de baja / reactivar. No se crean campos nuevos.
 * Los cambios se aplican con "Guardar cambios" del evento.
 *
 * @param {{ originales: Map<string, object> }} props campos tal como están en la base, por id
 */
export function SeccionCamposFormEdicion({ originales }) {
  const form = useFormContext()
  const campos = form.watch('camposForm') ?? []
  const [abierto, setAbierto] = useState(false)
  const [indexABajar, setIndexABajar] = useState(null)

  return (
    <Card>
      <Collapsible open={abierto} onOpenChange={setAbierto}>
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full cursor-pointer items-center justify-between px-4 py-3">
            <div className="text-left">
              <h2 className="text-base font-semibold text-foreground">Formulario de inscripción</h2>
              <p className="text-sm text-muted-foreground">Campos que va a completar cada participante.</p>
            </div>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', abierto && 'rotate-180')}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4">
            <Separator />
          </div>
          <CardContent className="space-y-6 pt-6">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Campos base (siempre incluidos)</p>
              <div className="flex flex-wrap gap-1.5">
                {CAMPOS_BASE_INSCRIPCION.map((campo) => (
                  <span
                    key={campo.id}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Lock className="h-3 w-3" />
                    {campo.label}
                  </span>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Campos personalizados</p>
              {campos.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Este evento no tiene campos personalizados. No se pueden agregar después de crearlo.
                </p>
              ) : (
                <div className="space-y-2">
                  {campos.map((campo, index) => (
                    <CampoEdicionItem
                      key={campo.id}
                      index={index}
                      original={originales.get(campo.id)}
                      onDarDeBaja={() => setIndexABajar(index)}
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={indexABajar !== null} onOpenChange={(v) => !v && setIndexABajar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja el campo?</AlertDialogTitle>
            <AlertDialogDescription>
              "{campos[indexABajar]?.etiqueta}" ya no se va a pedir en la inscripción ni se va a
              mostrar en participantes ni en el Excel. Las respuestas no se borran: podés
              reactivarlo cuando quieras. Se aplica al guardar los cambios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                form.setValue(`camposForm.${indexABajar}.activo`, false, { shouldDirty: true })
                setIndexABajar(null)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
