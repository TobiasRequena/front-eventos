import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

export async function crearSesionAcreditacion({ nombre, apellido, eventoId }) {
  const { data } = await publicClient.post('/acreditacion/sesion', {
    nombre,
    apellido,
    eventoId,
  })
  return data.sesion
}

export async function escanearQr({ qr, eventoId }) {
  const { data } = await publicClient.get('/acreditacion/escanear', {
    params: { qr, eventoId },
  })
  return data
}

export async function acreditarIndividual({ participanteId, acreditadorId, eventoId }) {
  const { data } = await publicClient.post('/acreditacion/individual', {
    participanteId,
    acreditadorId,
    eventoId,
    puntoAccesoId: null,
  })
  return data
}

export async function acreditarGrupal({ participanteIds, acreditadorId, eventoId }) {
  const { data } = await publicClient.post('/acreditacion/grupal', {
    participanteIds,
    acreditadorId,
    eventoId,
    puntoAccesoId: null,
  })
  return data
}