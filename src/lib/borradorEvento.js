import { TOKEN_KEY } from '@/api/httpClient'
import { getBorradorServidor, guardarBorradorServidor, borrarBorradorServidor } from '@/api/asistente.api'

// Borrador del evento que arma el asistente.
// - Sin sesión: solo en este navegador (marcado como anónimo).
// - Con sesión: en el servidor, por usuario; localStorage queda como copia para leerlo al instante.
// Al entrar al sistema, un borrador anónimo pasa a ser del usuario. Al cerrar sesión se borra la copia local.
const BORRADOR_KEY = 'talita.borradorEvento'
const CHAT_KEY = 'talita.chatEvento'
const ANONIMO_KEY = 'talita.borradorAnonimo'
export const EVENTO_BORRADOR = 'borrador-evento'

const conSesion = () => !!localStorage.getItem(TOKEN_KEY)

function leer(key, vacio) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? vacio
  } catch {
    return vacio
  }
}

export const leerBorrador = () => leer(BORRADOR_KEY, null)
export const leerChat = () => leer(CHAT_KEY, [])

let timerSubida
function subir() {
  if (!conSesion()) {
    localStorage.setItem(ANONIMO_KEY, '1')
    return
  }
  // Debounce: el formulario guarda mientras se escribe
  clearTimeout(timerSubida)
  timerSubida = setTimeout(() => {
    guardarBorradorServidor({ borrador: leerBorrador() ?? {}, mensajes: leerChat() }).catch(() => {})
  }, 1500)
}

export function guardarChat(mensajes) {
  localStorage.setItem(CHAT_KEY, JSON.stringify(mensajes.slice(-40))) // el servidor guarda hasta 40
  subir()
}

export function guardarBorrador(borrador, { avisar = true } = {}) {
  // capacidad null → sin la key: el formulario la espera undefined
  localStorage.setItem(BORRADOR_KEY, JSON.stringify(borrador, (k, v) => (k === 'capacidad' && v === null ? undefined : v)))
  subir()
  if (avisar) window.dispatchEvent(new Event(EVENTO_BORRADOR))
}

function olvidarLocal() {
  clearTimeout(timerSubida)
  ;[BORRADOR_KEY, CHAT_KEY, ANONIMO_KEY].forEach((k) => localStorage.removeItem(k))
}

/** Al crear el evento o "Empezar de nuevo". */
export function borrarBorrador() {
  olvidarLocal()
  if (conSesion()) borrarBorradorServidor().catch(() => {})
  window.dispatchEvent(new Event(EVENTO_BORRADOR))
}

/** Al cerrar sesión: que el próximo que use la compu no lo vea (queda guardado en el servidor). */
export const olvidarBorradorLocal = olvidarLocal

/** Al entrar al sistema: sube el borrador anónimo o trae el del servidor. */
export async function sincronizarBorrador() {
  if (localStorage.getItem(ANONIMO_KEY) && leerBorrador()) {
    await guardarBorradorServidor({ borrador: leerBorrador(), mensajes: leerChat() })
    localStorage.removeItem(ANONIMO_KEY)
    return
  }
  localStorage.removeItem(ANONIMO_KEY)
  const { borrador, mensajes } = await getBorradorServidor()
  if (borrador) {
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(borrador))
    localStorage.setItem(CHAT_KEY, JSON.stringify(mensajes))
  } else {
    localStorage.removeItem(BORRADOR_KEY)
    localStorage.removeItem(CHAT_KEY)
  }
  window.dispatchEvent(new Event(EVENTO_BORRADOR))
}
