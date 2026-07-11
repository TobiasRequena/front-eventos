import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

// Cliente sin auth — para endpoints públicos de inscripción
const publicClient = axios.create({ baseURL: BASE_URL })

export async function getEventoPorCodigo(codigo) {
  const { data } = await publicClient.get(`/eventos/codigo/${codigo}`)
  return data.evento
}

export async function getGrupoPorCodigoInvitacion(codigoInv) {
  const { data } = await publicClient.get(`/grupos/invitacion/${codigoInv}`)
  return data.grupo
}

export async function inscribirParticipante(payload) {
  const { data } = await publicClient.post('/participantes', payload)
  return data.participante
}

export async function crearGrupo(payload) {
  const { data } = await publicClient.post('/grupos', payload)
  return data.grupo
}