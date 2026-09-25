import { httpClient } from '@/api/httpClient'

// httpClient manda el token si hay sesión: así los me gusta quedan guardados en el usuario

export async function getEventosLanding() {
  const { data } = await httpClient.get('/landing/eventos')
  return data.eventos
}

export async function getOrganizacionesLanding() {
  const { data } = await httpClient.get('/landing/organizaciones')
  return data.organizaciones
}

export async function getGaleriaLanding() {
  const { data } = await httpClient.get('/landing/galeria')
  return data.eventos
}

export async function enviarSugerencia(texto) {
  await httpClient.post('/landing/sugerencias', { texto })
}

export async function marcarMeInteresa(funcion) {
  await httpClient.post('/landing/me-interesa', { funcion })
}

export async function quitarMeInteresa(funcion) {
  await httpClient.delete(`/landing/me-interesa/${encodeURIComponent(funcion)}`)
}

export async function sincronizarMeInteresa(funciones) {
  const { data } = await httpClient.post('/landing/me-interesa/sincronizar', { funciones })
  return data.funciones
}

// Galería de un evento (panel de la organización)
export async function getFotosGaleria(eventoId) {
  const { data } = await httpClient.get(`/eventos/${eventoId}/galeria`)
  return data.fotos
}

export async function subirFotoGaleria(eventoId, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const { data } = await httpClient.post(`/eventos/${eventoId}/galeria`, formData)
  return data.foto
}

export async function eliminarFotoGaleria(eventoId, archivoId) {
  await httpClient.delete(`/eventos/${eventoId}/galeria/${archivoId}`)
}

export async function subirLogoOrganizacion(orgId, archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  const { data } = await httpClient.post(`/organizaciones/${orgId}/logo`, formData)
  return data.organizacion
}
