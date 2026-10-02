import { httpClient } from '@/api/httpClient'

// Público: con sesión, httpClient manda el token y el asistente sabe quién es
export async function chatAsistente({ mensajes, borrador }) {
  const { data } = await httpClient.post('/asistente', { mensajes, borrador })
  return data
}

// Borrador del usuario logueado, guardado en el servidor para verlo desde cualquier dispositivo
export async function getBorradorServidor() {
  const { data } = await httpClient.get('/asistente/borrador')
  return data
}

export async function guardarBorradorServidor({ borrador, mensajes }) {
  await httpClient.put('/asistente/borrador', { borrador, mensajes })
}

export async function borrarBorradorServidor() {
  await httpClient.delete('/asistente/borrador')
}
