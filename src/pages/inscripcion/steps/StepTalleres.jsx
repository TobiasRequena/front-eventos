import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CalendarRange, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InscripcionStepLayout } from '@/components/inscripcion/InscripcionStepLayout'
import { Separator } from '@/components/ui/separator'

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(fechaIso))
}

function TallerInfo({ taller, horarioBloque }) {
  const inicio = taller.inicio || horarioBloque?.inicio
  const fin = taller.fin || horarioBloque?.fin
  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">{taller.nombre}</p>
      {taller.descripcion && (
        <p className="mt-0.5 text-xs text-muted-foreground">{taller.descripcion}</p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {inicio && (
          <span className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {formatearFechaHora(inicio)}
            {fin && ` — ${formatearFechaHora(fin)}`}
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

function TallerSueltoItem({ taller, seleccionado, onChange }) {
  if (taller.es_obligatorio || taller.esObligatorio) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-border p-3 opacity-80">
        <Checkbox checked disabled className="mt-0.5" />
        <TallerInfo taller={taller} />
        <span className="shrink-0 text-xs text-muted-foreground">Obligatorio</span>
      </div>
    )
  }

  return (
    <Label
      htmlFor={`taller-suelto-${taller.id}`}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm font-normal hover:bg-accent/50',
        seleccionado && 'border-primary bg-primary/5'
      )}
    >
      <Checkbox
        id={`taller-suelto-${taller.id}`}
        checked={seleccionado}
        onCheckedChange={onChange}
        className="mt-0.5"
      />
      <TallerInfo taller={taller} />
    </Label>
  )
}

function BloqueInformativo({ bloque }) {
  return (
    <div className="rounded-md border border-border p-3">
      <TallerInfo taller={bloque.talleres[0]} horarioBloque={bloque} />
    </div>
  )
}

function BloqueSeleccionUnica({ bloque, valor, onChange }) {
  return (
    <RadioGroup value={valor ?? ''} onValueChange={onChange} className="space-y-2">
      {bloque.talleres.map((taller) => (
        <Label
          key={taller.id}
          htmlFor={`taller-${taller.id}`}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm font-normal hover:bg-accent/50"
        >
          <RadioGroupItem value={taller.id} id={`taller-${taller.id}`} className="mt-0.5" />
          <TallerInfo taller={taller} horarioBloque={bloque} />
        </Label>
      ))}
    </RadioGroup>
  )
}

function BloqueSeleccionMultiple({ bloque, valores, onChange }) {
  const cantidadElegible = bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1
  const esObligatorio = bloque.es_obligatorio ?? bloque.esObligatorio ?? true
  const seleccionados = Array.isArray(valores) ? valores : []

  function toggleTaller(tallerId) {
    const yaEsta = seleccionados.includes(tallerId)
    if (yaEsta) {
      onChange(seleccionados.filter((id) => id !== tallerId))
    } else {
      if (seleccionados.length >= cantidadElegible) return
      onChange([...seleccionados, tallerId])
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {esObligatorio ? `Elegí exactamente ${cantidadElegible}` : `Podés elegir hasta ${cantidadElegible}`}
        {' '}({seleccionados.length}/{cantidadElegible})
      </p>
      {bloque.talleres.map((taller) => {
        const seleccionado = seleccionados.includes(taller.id)
        const deshabilitado = !seleccionado && seleccionados.length >= cantidadElegible
        return (
          <Label
            key={taller.id}
            htmlFor={`taller-${taller.id}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm font-normal',
              seleccionado && 'border-primary bg-primary/5',
              deshabilitado && 'cursor-not-allowed opacity-50'
            )}
          >
            <Checkbox
              id={`taller-${taller.id}`}
              checked={seleccionado}
              disabled={deshabilitado}
              onCheckedChange={() => toggleTaller(taller.id)}
              className="mt-0.5"
            />
            <TallerInfo taller={taller} horarioBloque={bloque} />
          </Label>
        )
      })}
    </div>
  )
}

function validarSeleccion(bloquesTaller, talleresSueltos, talleresSeleccionados) {
  for (const bloque of bloquesTaller) {
    const esInformativo = bloque.talleres.length <= 1
    if (esInformativo) continue
    const cantidadElegible = bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1
    const esObligatorio = bloque.es_obligatorio ?? bloque.esObligatorio ?? true
    if (!esObligatorio) continue
    const seleccionados = talleresSeleccionados[bloque.id]
    const cantidad = Array.isArray(seleccionados) ? seleccionados.length : seleccionados ? 1 : 0
    if (cantidad !== cantidadElegible) return false
  }
  return true
}

export default function StepTalleres({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder, esUltimoPasoVisible } = wizard
  const bloquesTaller = evento.bloquesTaller ?? []
  const talleresSueltos = evento.talleresSueltos ?? []

  const [seleccionados, setSeleccionados] = useState(() => {
    const init = { ...(datosWizard.talleresSeleccionados ?? {}) }
    // Pre-seleccionar talleres sueltos obligatorios
    talleresSueltos.forEach((t) => {
      if (t.es_obligatorio || t.esObligatorio) {
        init[`suelto_${t.id}`] = true
      }
    })
    return init
  })

  const todosLosItems = useMemo(() => {
    const items = [
      ...bloquesTaller.map((b) => ({ ...b, _tipo: 'bloque', _inicio: b.inicio ?? b.inicio_bloque ?? b.fecha_inicio })),
      ...talleresSueltos.map((t) => ({ ...t, _tipo: 'taller_suelto', _inicio: t.inicio })),
    ]
    return items.sort((a, b) => {
      if (!a._inicio) return 1
      if (!b._inicio) return -1
      return new Date(a._inicio) - new Date(b._inicio)
    })
  }, [bloquesTaller, talleresSueltos])

  function handleCambioBloque(bloqueId, valor) {
    setSeleccionados((prev) => ({ ...prev, [bloqueId]: valor }))
  }

  function handleCambioSuelto(tallerId, valor) {
    setSeleccionados((prev) => ({ ...prev, [`suelto_${tallerId}`]: valor }))
  }

  function handleAvanzar() {
    if (!validarSeleccion(bloquesTaller, talleresSueltos, seleccionados)) {
      toast.error('Completá la selección de talleres obligatorios antes de continuar.')
      return
    }
    avanzar({ talleresSeleccionados: seleccionados })
  }

  const puedeAvanzar = validarSeleccion(bloquesTaller, talleresSueltos, seleccionados)

  return (
    <InscripcionStepLayout evento={evento} titulo="Talleres disponibles">
      <div className="space-y-6">
        {todosLosItems.map((item, i) => {
          const esBloque = item._tipo === 'bloque'

          if (esBloque) {
            const bloque = item
            const esInformativo = bloque.talleres.length <= 1
            const cantidadElegible =
              bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1

            const esObligatorio =
              bloque.es_obligatorio ?? bloque.esObligatorio

            return (
              <div key={bloque.id} className="space-y-3">
                {/* Separador del bloque */}
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />

                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {bloque.nombre}
                  </span>

                  <Separator className="flex-1" />
                </div>

                {/* Horario + elección */}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    {bloque.inicio && bloque.fin && (
                      <span className="text-xs text-muted-foreground">
                        {formatearFechaHora(bloque.inicio)} —{' '}
                        {formatearFechaHora(bloque.fin)}
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
                        ? `Elegí exactamente ${cantidadElegible}`
                        : `Elegí hasta ${cantidadElegible}`}
                    </span>
                  )}
                </div>

                {esInformativo ? (
                  <BloqueInformativo bloque={bloque} />
                ) : cantidadElegible === 1 ? (
                  <BloqueSeleccionUnica
                    bloque={bloque}
                    valor={seleccionados[bloque.id] ?? null}
                    onChange={(valor) => handleCambioBloque(bloque.id, valor)}
                  />
                ) : (
                  <BloqueSeleccionMultiple
                    bloque={bloque}
                    valores={seleccionados[bloque.id] ?? []}
                    onChange={(valores) => handleCambioBloque(bloque.id, valores)}
                  />
                )}
              </div>
            )
          }

          // Taller suelto
          const taller = item

          return (
            <div key={`suelto_${taller.id}`} className="space-y-3">
              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {taller.nombre}
                  </p>

                  {taller.inicio && taller.fin && (
                    <span className="text-xs text-muted-foreground">
                      {formatearFechaHora(taller.inicio)} —{' '}
                      {formatearFechaHora(taller.fin)}
                    </span>
                  )}
                </div>

                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  Elegí
                </span>
              </div>

              <TallerSueltoItem
                taller={taller}
                seleccionado={seleccionados[`suelto_${taller.id}`] ?? false}
                onChange={(val) => handleCambioSuelto(taller.id, val)}
              />
            </div>
          )
        })}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={retroceder} className="flex-1">
            Atrás
          </Button>
          <Button type="button" onClick={handleAvanzar} className="flex-1">
            {esUltimoPasoVisible ? 'Enviar inscripción' : 'Continuar'}
          </Button>
        </div>
      </div>
    </InscripcionStepLayout>
  )
}