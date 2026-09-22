import { createContext, useContext, useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Stepper vertical repartido por la página: cada sección lleva su número al lado del
// título y una línea que se estira con la altura de la card (si se abre, crece).
// Sin provider (ej. pantalla de edición) PasoConNumero renderiza los hijos tal cual.
const StepperContext = createContext(null)

export function EventoStepperProvider({ ids, hechos, children }) {
  const [activo, setActivo] = useState(ids[0])
  const clave = ids.join()

  useEffect(() => {
    function actualizar() {
      let actual = ids[0]
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) actual = id
      }
      setActivo(actual)
    }
    actualizar()
    window.addEventListener('scroll', actualizar, true)
    return () => window.removeEventListener('scroll', actualizar, true)
  }, [clave]) // eslint-disable-line react-hooks/exhaustive-deps

  return <StepperContext.Provider value={{ ids, activo, hechos }}>{children}</StepperContext.Provider>
}

export function PasoConNumero({ id, children }) {
  const ctx = useContext(StepperContext)
  if (!ctx) return children

  const index = ctx.ids.indexOf(id)
  const completado = ctx.hechos.includes(id)
  const esActivo = id === ctx.activo
  const ultimo = index === ctx.ids.length - 1

  return (
    <div id={id} className="scroll-mt-6 lg:flex lg:gap-3">
      <div className="hidden w-8 shrink-0 flex-col items-center lg:flex">
        <div
          className={cn(
            'mt-6 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors',
            completado && 'border-primary bg-primary text-primary-foreground',
            !completado && esActivo && 'border-primary bg-background text-primary',
            !completado && !esActivo && 'border-border bg-background text-muted-foreground',
            completado && esActivo && 'ring-2 ring-primary/30'
          )}
        >
          {completado ? <Check className="h-4 w-4" /> : index + 1}
        </div>
        {!ultimo && (
          <div className={cn('mt-1 -mb-4 w-0.5 flex-1', completado ? 'bg-primary' : 'bg-border')} />
        )}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
