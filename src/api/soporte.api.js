import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

export async function enviarContacto({ nombre, email, asunto, mensaje }) {
  const { data } = await publicClient.post('/soporte/contacto', {
    nombre, email, asunto, mensaje,
  })
  return data
}