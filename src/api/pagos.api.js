import { httpClient } from '@/api/httpClient'

export async function getTramos() {
  const { data } = await httpClient.get('/pagos/tramos')
  return data.tramos
}

export async function reenviarMailPago(eventoId) {
  const { data } = await httpClient.post(`/pagos/eventos/${eventoId}/reenviar-mail`)
  return data
}

export async function pagarTramoAdelantado(eventoId, participantesObjetivo) {
  const { data } = await httpClient.post(`/pagos/eventos/${eventoId}/tramo-adelantado`, {
    participantesObjetivo,
  })
  return data
}

export async function getHistorialPagos(eventoId) {
  const { data } = await httpClient.get(`/pagos/eventos/${eventoId}/historial`)
  return data
}