import { z } from 'zod'

export const datosPersonalesSchema = z.object({
  nombre: z.string().min(1, 'Ingresá tu nombre.').max(100),
  apellido: z.string().min(1, 'Ingresá tu apellido.').max(100),
  email: z.string().min(1, 'Ingresá tu email.').email('Email inválido.'),
  dni: z
    .string()
    .min(7, 'DNI inválido.')
    .max(8, 'DNI inválido.')
    .regex(/^\d+$/, 'Solo números.'),
  nacimiento: z
    .string()
    .min(1, 'Ingresá tu fecha de nacimiento.')
    .refine((val) => {
      const fecha = new Date(val)
      const año = fecha.getFullYear()
      return !isNaN(fecha.getTime()) && año >= 1900 && año <= new Date().getFullYear()
    }, 'Fecha de nacimiento inválida.'),
})

export const grupoNuevoSchema = z.object({
  nombre: z.string().min(1, 'Ingresá el nombre del grupo.').max(100),
  parroquia: z.string().max(150).optional().or(z.literal('')),
  provincia: z.string().min(1, 'Seleccioná una provincia.'),
  localidad: z.string().min(1, 'Seleccioná una localidad.'),
  maxIntegrantes: z.number().int().positive().optional().nullable(),
})

export const pagoSchema = z.object({
  comprobante: z.any().optional(),
  pagoPostergado: z.boolean().default(false),
})