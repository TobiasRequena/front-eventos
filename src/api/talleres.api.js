import { httpClient } from '@/api/httpClient'

export async function getTaller(tallerId) {
  const { data } = await httpClient.get(`/talleres/${tallerId}`)
  return data.taller
}

export async function patchTaller(tallerId, payload) {
  const { data } = await httpClient.patch(`/talleres/${tallerId}`, payload)
  return data.taller
}

export async function eliminarTaller(tallerId) {
  await httpClient.delete(`/talleres/${tallerId}`)
}

export async function crearBloqueConTalleres(eventoId, payload) {
  const { data } = await httpClient.post(`/eventos/${eventoId}/bloques-taller`, payload)
  return data
}

export async function patchBloque(bloqueId, payload) {
  const { data } = await httpClient.patch(`/bloques-taller/${bloqueId}`, payload)
  return data
}

export async function eliminarBloque(bloqueId) {
  await httpClient.delete(`/bloques-taller/${bloqueId}`)
}

export async function crearTallerEnBloque(bloqueId, payload) {
  const { data } = await httpClient.post(`/bloques-taller/${bloqueId}/talleres`, payload)
  return data.taller
}