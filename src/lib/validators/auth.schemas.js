import { z } from 'zod'

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Ingresá tu email.')
        .email('Ingresá un email válido.'),
    contrasena: z.string().min(1, 'Ingresá tu contraseña.'),
})

export const registerStep1Schema = z.object({
    nombre: z.string().min(1, 'Ingresá tu nombre.').max(100),
    apellido: z.string().min(1, 'Ingresá tu apellido.').max(100),
    email: z
        .string()
        .min(1, 'Ingresá tu email.')
        .email('Ingresá un email válido.'),
    contrasena: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
})

export const registerStep2Schema = z.object({
    nombreOrganizacion: z.string().max(150).optional().or(z.literal('')),
})

export const verificarEmailSchemaEmail = z.object({
    email: z.string().min(1, 'Ingresá tu email.').email('Email inválido.'),
})

export const verificarEmailSchemaCodigo = z.object({
    codigo: z.string().length(6, 'El código tiene 6 dígitos.').regex(/^\d+$/, 'Solo números.'),
})