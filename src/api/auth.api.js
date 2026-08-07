import { httpClient } from '@/api/httpClient'
import axios from 'axios'
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
const publicClient = axios.create({ baseURL: BASE_URL })

/**
 * @param {{ email: string, contrasena: string }} credentials
 * @returns {Promise<{ token: string, usuario: object }>}
 */
export async function login(credentials) {
    const { data } = await httpClient.post('/auth/login', credentials)
    return data
}

/**
 * @param {{ nombre: string, apellido: string, email: string, contrasena: string, organizacion?: { nombre: string } }} payload
 * @returns {Promise<{ token: string, usuario: object, organizacion: object }>}
 */
export async function register(payload) {
    const { data } = await httpClient.post('/auth/register', payload)
    return data
}

/**
 * @returns {Promise<{ usuario: object, organizaciones: Array<object> }>}
 */
export async function getMe() {
    const { data } = await httpClient.get('/auth/me')
    return data
}

export async function recuperarContrasena(email) {
    const { data } = await publicClient.post('/auth/recuperar-contrasena', { email })
    return data
}

export async function resetContrasena({ email, codigo, nuevaContrasena }) {
    const { data } = await publicClient.post('/auth/reset-contrasena', {
        email, codigo, nuevaContrasena,
    })
    return data
}