import { httpClient } from '@/api/httpClient'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

/**
 * Sube la portada de un evento (requiere auth).
 * @param {File} archivo
 * @param {string} eventoId
 * @param {string} orgId
 */
export async function subirPortadaEvento(archivo, eventoId, orgId) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('orgId', orgId)
  formData.append('eventoId', eventoId)

  const { data } = await httpClient.post('/archivos/portada', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.archivo
}

/**
 * Sube el comprobante de pago de un participante (público, sin auth).
 * @param {File} archivo
 * @param {string} participanteId
 * @param {string} orgId
 */
export async function subirComprobantePago(archivo, participanteId, orgId) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('orgId', orgId)
  formData.append('participanteId', participanteId)

  const { data } = await publicClient.post('/archivos/comprobante', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data.archivo
}

export async function subirTemplateAutorizacion(eventoId, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('eventoId', eventoId)
  const { data } = await httpClient.post(
    '/archivos/autorizacion-template',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

/**
 * @param {string} [pagoId] cuota a la que corresponde; si no viene, el back usa la primera sin aprobar
 */
export async function subirComprobantePublico(archivo, participanteId, eventoId, pagoId) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  formData.append('participanteId', participanteId)
  formData.append('eventoId', eventoId)
  if (pagoId) formData.append('pagoId', pagoId)
  const { data } = await httpClient.post('/archivos/comprobante', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}