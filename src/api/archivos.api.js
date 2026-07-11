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