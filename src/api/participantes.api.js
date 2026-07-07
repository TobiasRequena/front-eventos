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