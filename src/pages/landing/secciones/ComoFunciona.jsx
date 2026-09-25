import { useState } from 'react'
import { Check, ChevronDown, Heart, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Seccion, Pregunta, Resaltado } from '../Seccion'
import { FUNCIONES } from '../datosLanding'

// ponytail: corazones y buzón viven solo en el estado local (maqueta); en la etapa 2 se guardan y se ven en /admin
function BotonMeGusta({ nombre }) {
  const [marcado, setMarcado] = useState(false)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      onClick={() => setMarcado((m) => !m)}
      aria-pressed={marcado}
      aria-label={`Me interesa: ${nombre}`}
      className="shrink-0 text-muted-foreground"
    >
      <Heart className={cn('size-5', marcado && 'fill-talita-rojo text-talita-rojo')} />
    </Button>
  )
}

function Funcion({ funcion }) {
  if (funcion.enDesarrollo) {
    return (
      <li className="flex items-center gap-2 px-5 py-2">
        <div className="flex flex-1 items-center gap-3 py-2 text-lg text-muted-foreground/70">
          <Lock className="size-4" />
          {funcion.nombre}
          <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">en desarrollo</span>
        </div>
        <BotonMeGusta nombre={funcion.nombre} />
      </li>
    )
  }

  return (
    <li className="flex items-start gap-2 px-5 py-2">
      <Collapsible className="flex-1">
        <CollapsibleTrigger className="group flex w-full cursor-pointer items-center gap-3 py-2 text-left text-lg font-medium">
          {funcion.nombre}
          <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="pb-3 pr-6 text-base leading-relaxed text-muted-foreground">
          {funcion.descripcion}
        </CollapsibleContent>
      </Collapsible>
      <BotonMeGusta nombre={funcion.nombre} />
    </li>
  )
}

function Buzon() {
  const [texto, setTexto] = useState('')
  const [enviado, setEnviado] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <Pregunta>¿Qué otra función estás buscando?</Pregunta>
      <div className="min-h-36 rounded-xl border border-border bg-card p-5">
        {enviado ? (
          <p className="flex h-full min-h-26 items-center justify-center text-lg">
            ¡Gracias! Lo vamos a tener en cuenta.
          </p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setEnviado(true) }} className="flex flex-col gap-3">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Contanos qué te gustaría poder hacer..."
              className="resize-none text-base"
            />
            <Button type="submit" disabled={!texto.trim()} className="h-10 self-end px-6">
              Enviar
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export function ComoFunciona() {
  return (
    <Seccion id="como-funciona" numero={2} titulo={<>Qué es y cómo <Resaltado>funciona</Resaltado></>}>
      <div className="flex flex-col gap-6">
        <Pregunta>¿Qué podés hacer con Talita Encuentro?</Pregunta>
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <ul className="flex flex-col gap-2 text-3xl font-bold tracking-tight">
            {['Inscribí', 'Administrá', 'Acreditá'].map((v) => (
              <li key={v} className="flex items-center gap-3">
                <Check className="size-6 text-talita-amarillo" strokeWidth={3} />
                {v}
              </li>
            ))}
          </ul>
          <p className="border-border text-2xl leading-snug text-muted-foreground sm:border-l sm:pl-8">
            Encuentros como <span className="text-foreground">peregrinaciones</span>,{' '}
            <span className="text-foreground">convivencias</span> y{' '}
            <span className="text-foreground">campamentos</span>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Pregunta>Funciones específicas</Pregunta>
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {FUNCIONES.map((f) => <Funcion key={f.nombre} funcion={f} />)}
        </ul>
      </div>

      <Buzon />
    </Seccion>
  )
}
