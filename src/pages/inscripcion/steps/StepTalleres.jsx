import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CalendarRange, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatearFechaHora(fechaIso) {
  if (!fechaIso) return null
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fechaIso))
}

function TallerInfo({ taller }) {
  return (
    <div className="flex-1">
      <p className="text-sm font-medium text-foreground">{taller.nombre}</p>
      {taller.descripcion && (
        <p className="mt-0.5 text-xs text-muted-foreground">{taller.descripcion}</p>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {taller.inicio && (
          <span className="flex items-center gap-1">
            <CalendarRange className="h-3 w-3" />
            {formatearFechaHora(taller.inicio)}
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

function BloqueInformativo({ bloque }) {
  const taller = bloque.talleres[0]
  return (
    <div className="rounded-md border border-border p-3">
      <TallerInfo taller={taller} />
    </div>
  )
}

function BloqueSeleccionUnica({ bloque, valor, onChange }) {
  return (
    <RadioGroup
      value={valor ?? ''}
      onValueChange={onChange}
      className="space-y-2"
    >
      {bloque.talleres.map((taller) => (
        <Label
          key={taller.id}
          htmlFor={`taller-${taller.id}`}
          className="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm font-normal hover:bg-accent/50"
        >
          <RadioGroupItem value={taller.id} id={`taller-${taller.id}`} className="mt-0.5" />
          <TallerInfo taller={taller} />
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
        {esObligatorio
          ? `Elegí exactamente ${cantidadElegible}`
          : `Podés elegir hasta ${cantidadElegible}`}
        {' '}({seleccionados.length}/{cantidadElegible})
      </p>
      {bloque.talleres.map((taller) => {
        const seleccionado = seleccionados.includes(taller.id)
        const deshabilitado =
          !seleccionado && seleccionados.length >= cantidadElegible

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
            <TallerInfo taller={taller} />
          </Label>
        )
      })}
    </div>
  )
}

function validarSeleccion(bloquesTaller, talleresSeleccionados) {
  for (const bloque of bloquesTaller) {
    const esInformativo = bloque.talleres.length <= 1
    if (esInformativo) continue

    const cantidadElegible = bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1
    const esObligatorio = bloque.es_obligatorio ?? bloque.esObligatorio ?? true

    if (!esObligatorio) continue

    const seleccionados = talleresSeleccionados[bloque.id]
    const cantidad = Array.isArray(seleccionados)
      ? seleccionados.length
      : seleccionados
        ? 1
        : 0

    if (cantidad !== cantidadElegible) return false
  }
  return true
}

export default function StepTalleres({ evento, wizard }) {
  const { datosWizard, avanzar, retroceder } = wizard
  const bloquesTaller = evento.bloquesTaller ?? []

  const [seleccionados, setSeleccionados] = useState(
    datosWizard.talleresSeleccionados ?? {}
  )

  function handleCambio(bloqueId, valor) {
    setSeleccionados((prev) => ({ ...prev, [bloqueId]: valor }))
  }

  function handleAvanzar() {
    avanzar({ talleresSeleccionados: seleccionados })
  }

  const puedeAvanzar = validarSeleccion(bloquesTaller, seleccionados)

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Talleres disponibles
        </p>

        {bloquesTaller.map((bloque) => {
          const esInformativo = bloque.talleres.length <= 1
          const cantidadElegible = bloque.cantidad_elegible ?? bloque.cantidadElegible ?? 1

          return (
            <div key={bloque.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{bloque.nombre}</p>
                {esInformativo ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Informativo
                  </span>
                ) : (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    {(bloque.es_obligatorio ?? bloque.esObligatorio)
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
                  onChange={(valor) => handleCambio(bloque.id, valor)}
                />
              ) : (
                <BloqueSeleccionMultiple
                  bloque={bloque}
                  valores={seleccionados[bloque.id] ?? []}
                  onChange={(valores) => handleCambio(bloque.id, valores)}
                />
              )}
            </div>
          )
        })}

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
      </CardContent>
    </Card>
  )
}