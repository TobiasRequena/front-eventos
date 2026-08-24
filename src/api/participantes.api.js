import { httpClient } from '@/api/httpClient'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

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

export async function eliminarParticipante(participanteId) {
  await httpClient.delete(`/participantes/${participanteId}`)
}

export async function getParticipantesEliminados(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/participantes/eliminados`)
  return data.participantes
}

export async function descargarInscriptosTaller(tallerId, nombreTaller) {
  const response = await httpClient.get(`/talleres/${tallerId}/excel`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `taller-${nombreTaller ?? tallerId}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function getFichaMedica(participanteId) {
  const { data } = await httpClient.get(`/participantes/${participanteId}/ficha-medica`)
  return data.ficha
}

export async function patchFichaMedica(participanteId, payload) {
  const { data } = await httpClient.patch(`/participantes/${participanteId}/ficha-medica`, payload)
  return data.ficha
}

export async function subirAutorizacion(participanteId, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const { data } = await publicClient.patch(
    `/participantes/${participanteId}/autorizacion`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function subirCertificado(participanteId, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const { data } = await publicClient.patch(
    `/participantes/${participanteId}/certificado`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function verificarDni(dni, eventoId) {
  const { data } = await httpClient.get('/participantes/verificar-dni', {
    params: { dni, eventoId },
  })
  return data
}

export async function patchEstadoPago(participanteId, estadoPago) {
  const { data } = await httpClient.patch(`/participantes/${participanteId}/estado-pago`, { estadoPago })
  return data
}