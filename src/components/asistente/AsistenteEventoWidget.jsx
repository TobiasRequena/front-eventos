import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X, SendHorizontal, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { chatAsistente } from '@/api/asistente.api'
import { getApiErrorMessage } from '@/api/httpClient'
import { leerBorrador, guardarBorrador, borrarBorrador, leerChat, guardarChat, EVENTO_BORRADOR } from '@/lib/borradorEvento'

const SALUDO =
  '¡Hola! Soy Tali y te ayudo a armar tu evento. Contame de qué se trata: ¿qué tipo de evento es, cuándo y para cuánta gente? También podés preguntarme cómo hacer algo en la plataforma.'
const MAX_MENSAJES = 40

/**
 * Chat flotante con el asistente IA.
 * modo "publico" (landing): al tener borrador invita a registrarse para crearlo.
 * modo "interno" (sistema): lleva al formulario de nuevo evento, que se llena en vivo.
 */
// Tali se prende con VITE_TALI_ACTIVO=true (build time)
export function AsistenteEventoWidget({ modo }) {
  if (import.meta.env.VITE_TALI_ACTIVO !== 'true') return null
  return <Widget modo={modo} />
}

function Widget({ modo }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [mensajes, setMensajes] = useState(leerChat)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [hayBorrador, setHayBorrador] = useState(() => !!leerBorrador()?.nombre)
  const finRef = useRef(null)
  // Al entrar se ve "Armá tu evento con Tali"; a los segundos queda solo el sol, medio transparente
  const [achicado, setAchicado] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setAchicado(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  // El borrador puede cambiar desde afuera (llegó del servidor, se creó el evento, otra pestaña del form)
  useEffect(() => {
    const refrescar = () => {
      setMensajes(leerChat())
      setHayBorrador(!!leerBorrador()?.nombre)
    }
    window.addEventListener(EVENTO_BORRADOR, refrescar)
    return () => window.removeEventListener(EVENTO_BORRADOR, refrescar)
  }, [])

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [mensajes, abierto, enviando])

  async function enviar(e) {
    e?.preventDefault()
    const contenido = texto.trim()
    if (!contenido || enviando) return

    const nuevos = [...mensajes, { role: 'user', content: contenido }]
    setMensajes(nuevos)
    setTexto('')
    setEnviando(true)
    try {
      // El historial tiene que empezar con un mensaje del usuario
      let historial = nuevos.slice(-MAX_MENSAJES)
      if (historial[0].role !== 'user') historial = historial.slice(1)

      const data = await chatAsistente({ mensajes: historial, borrador: leerBorrador() ?? {} })
      const conRespuesta = [...nuevos, { role: 'assistant', content: data.respuesta }]
      guardarChat(conRespuesta)
      guardarBorrador(data.borrador) // avisa con EVENTO_BORRADOR y refresca mensajes y CTA
      if (data.solicitudEnviada) toast.success('Le pasamos tu pedido al equipo de Talita.')
    } catch (error) {
      // Se descarta el mensaje para no dejar dos del usuario seguidos; queda en el input para reintentar
      setMensajes(mensajes)
      setTexto(contenido)
      toast.error(getApiErrorMessage(error, 'No pudimos hablar con el asistente.'))
    } finally {
      setEnviando(false)
    }
  }

  function empezarDeNuevo() {
    borrarBorrador()
  }

  if (!abierto) {
    return (
      <Button
        onClick={() => setAbierto(true)}
        className={cn(
          'group fixed right-4 bottom-4 z-50 h-14 cursor-pointer gap-0 rounded-full px-3 shadow-lg transition-all duration-700 ease-out',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500',
          achicado && 'opacity-60 hover:opacity-100 focus-visible:opacity-100'
        )}
        aria-label="Abrir a Tali, asistente para armar tu evento"
      >
        {/* Al achicarse, el sol da una vuelta; con el mouse encima vuelve a girar */}
        <img
          src="/logo_talita.png"
          alt=""
          className={cn(
            'size-8 transition-transform duration-700 ease-out',
            achicado && 'motion-safe:rotate-[360deg] motion-safe:group-hover:rotate-[540deg]'
          )}
        />
        <span
          className={cn(
            'overflow-hidden whitespace-nowrap transition-all duration-700 ease-out',
            achicado
              ? 'ml-0 max-w-0 opacity-0 md:group-hover:ml-2 md:group-hover:max-w-56 md:group-hover:opacity-100'
              : 'ml-2 max-w-56 opacity-100'
          )}
        >
          Armá tu evento con Tali
        </span>
      </Button>
    )
  }

  return (
    <section
      aria-label="Tali, asistente para armar tu evento"
      className="fixed right-4 bottom-4 z-50 flex h-[min(36rem,calc(100dvh-2rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <img src="/logo_talita.png" alt="" className="size-5" />
        <h2 className="flex-1 text-sm font-semibold">
          Tali <span className="font-normal text-muted-foreground">· asistente de eventos</span>
        </h2>
        {mensajes.length > 0 && (
          <Button variant="ghost" size="icon" onClick={empezarDeNuevo} title="Empezar de nuevo" aria-label="Empezar de nuevo" disabled={enviando}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => setAbierto(false)} aria-label="Cerrar a Tali">
          <X className="h-4 w-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm" aria-live="polite">
        {[{ role: 'assistant', content: SALUDO }, ...mensajes].map((m, i) => (
          <p
            key={i}
            className={cn(
              'max-w-[85%] rounded-2xl px-3 py-2 whitespace-pre-wrap',
              m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            )}
          >
            {m.content}
          </p>
        ))}
        {enviando && (
          <p className="flex w-fit items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
          </p>
        )}
        <div ref={finRef} />
      </div>

      {hayBorrador && modo === 'publico' && (
        <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 text-xs">
          <span className="flex-1 text-muted-foreground">Tu evento queda guardado.</span>
          <Link to="/login" className="underline underline-offset-2">Ya tengo cuenta</Link>
          <Button size="sm" onClick={() => navigate('/register')}>Crear mi evento</Button>
        </div>
      )}
      {hayBorrador && modo === 'interno' && pathname !== '/eventos/nuevo' && (
        <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-2 text-xs">
          <span className="flex-1 text-muted-foreground">Tenés un evento en borrador.</span>
          <Button size="sm" onClick={() => navigate('/eventos/nuevo')}>Ver en el formulario</Button>
        </div>
      )}

      <form onSubmit={enviar} className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) enviar(e)
          }}
          placeholder="Escribí tu mensaje…"
          rows={1}
          maxLength={2000}
          className="max-h-32 min-h-10 resize-none"
          aria-label="Mensaje para Tali"
        />
        <Button type="submit" size="icon" disabled={enviando || !texto.trim()} aria-label="Enviar">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
    </section>
  )
}
