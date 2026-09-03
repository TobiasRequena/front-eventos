import { httpClient } from '@/api/httpClient'

export async function getComunicaciones(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/comunicaciones`)
  return data.comunicaciones
}

export async function enviarComunicacion(eventoId, formData) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/comunicaciones`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}