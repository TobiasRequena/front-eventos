import { z } from 'zod'

// Espejo de las reglas del back (que es quien manda). Vacío = sin dato.
const usuario = (regex, mensaje) =>
  z
    .string()
    .trim()
    .refine((s) => s === '' || regex.test(s.replace(/^@/, '')), mensaje)

export const redesFields = {
  sitioWeb: z
    .string()
    .trim()
    .refine((s) => {
      if (!s) return true
      try {
        const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`)
        return (
          ['http:', 'https:'].includes(u.protocol) &&
          !u.username &&
          !u.password &&
          u.hostname.includes('.') &&
          !/^[\d.]+$/.test(u.hostname)
        )
      } catch {
        return false
      }
    }, 'Ingresá una dirección web válida (ej. https://mi-sitio.org).'),
  instagram: usuario(/^[A-Za-z0-9._]{1,30}$/, 'Solo el usuario, sin link (letras, números, . y _).'),
  twitter: usuario(/^[A-Za-z0-9_]{1,15}$/, 'Solo el usuario, sin link (hasta 15 letras, números o _).'),
  facebook: usuario(/^[A-Za-z0-9.]{5,50}$/, 'Solo el usuario, sin link (5 a 50 letras, números o .).'),
}

export const REDES_VACIAS = { sitioWeb: '', instagram: '', twitter: '', facebook: '' }

export const REDES_CAMPOS = [
  { name: 'sitioWeb', label: 'Página web', placeholder: 'https://mi-parroquia.org', prefijo: null },
  { name: 'instagram', label: 'Instagram', placeholder: 'usuario', prefijo: '@' },
  { name: 'twitter', label: 'Twitter', placeholder: 'usuario', prefijo: '@' },
  { name: 'facebook', label: 'Facebook', placeholder: 'usuario', prefijo: null },
]

export const hayRedes = (v) => REDES_CAMPOS.some(({ name }) => v[name]?.trim())
