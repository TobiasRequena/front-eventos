import { httpClient } from '@/api/httpClient'

/**
 * @param {string} eventoId
 * @param {object} params - filtros opcionales
 * @returns {Promise<Array>}
 */
export async function getParticipantes(eventoId, params = {}) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/participantes`, { params })
  return data.participantes
}

/**
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getParticipantePorId(id) {
  const { data } = await httpClient.get(`/participantes/${id}`)
  return data.participante
}

export async function getComprobante(participanteId) {
  const { data } = await httpClient.get(`/participantes/${participanteId}/comprobante`)
  return data.comprobante
}

export async function getInscriptosTaller(tallerId) {
  const { data } = await httpClient.get(`/talleres/${tallerId}/inscriptos`)
  return data.inscriptos ?? data.participantes
}

export async function reenviarMail(participanteId, email = undefined) {
  const { data } = await httpClient.post(
    `/participantes/${participanteId}/reenviar-mail`,
    email ? { email } : {}
  )
  return data
}