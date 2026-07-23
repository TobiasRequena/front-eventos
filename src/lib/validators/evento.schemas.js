import { z } from 'zod'

const TIPOS_CAMPO_FORM = ['texto', 'numero', 'fecha', 'seleccion', 'booleano']

export const campoFormSchema = z
  .object({
    etiqueta: z.string().min(1, 'La etiqueta es obligatoria.').max(100),
    tipo: z.enum(TIPOS_CAMPO_FORM),
    multiple: z.boolean().default(false), // solo aplica si tipo === 'seleccion'
    opciones: z.array(z.string().min(1)).optional().default([]),
    requerido: z.boolean().default(false),
  })
  .refine(
    (campo) => campo.tipo !== 'seleccion' || campo.opciones.length > 0,
    {
      message: 'Agregá al menos una opción para un campo de selección.',
      path: ['opciones'],
    }
  )

export const tallerSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre del taller es obligatorio.'),
    descripcion: z.string().max(500).optional().or(z.literal('')),
    inicio: z.string().min(1, 'Definí el horario de inicio.'),
    fin: z.string().min(1, 'Definí el horario de fin.'),
    capacidad: z.preprocess(
      (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
      z.number().int().positive('La capacidad debe ser mayor a 0.').optional()
    ),
  })
  .refine((taller) => new Date(taller.fin) > new Date(taller.inicio), {
    message: 'El fin debe ser posterior al inicio.',
    path: ['fin'],
  })

export const bloqueTallerSchema = z.object({
  nombre: z.string().min(1, 'El nombre del bloque es obligatorio.').max(100),
  cantidadElegible: z
    .number({ invalid_type_error: 'Ingresá un número.' })
    .int()
    .positive('Debe ser al menos 1.')
    .default(1),
  esObligatorio: z.boolean().default(true),
  orden: z.number().default(0),
  talleres: z.array(tallerSchema).min(1, 'Agregá al menos un taller a este bloque.'),
})

export const eventoSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio.').max(150),
    codigo: z
      .string()
      .min(3, 'El código debe tener al menos 3 caracteres.')
      .max(20, 'El código no puede superar los 20 caracteres.')
      .regex(/^[a-zA-Z0-9-]+$/, 'Solo letras, números y guiones.'),
    descripcion: z.string().max(2000).optional().or(z.literal('')),
    fechaInicio: z.string().min(1, 'Definí la fecha de inicio.'),
    fechaFin: z.string().min(1, 'Definí la fecha de fin.'),
    politicaMenor: z.enum(['obligatorio', 'opcional', 'no_aplica']).default('no_aplica'),
    tieneGrupos: z.boolean().default(false),
    tieneTalleres: z.boolean().default(false),
    cbuCvu: z.string().max(50).optional().or(z.literal('')),
    aliasCobro: z.string().max(50).optional().or(z.literal('')),
    costo: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
      z.number({ invalid_type_error: 'Ingresá un número válido.' }).min(0, 'El costo no puede ser negativo.')
    ),
    camposForm: z.array(campoFormSchema).default([]),
    bloquesTaller: z.array(bloqueTallerSchema).default([]),
  })
  .superRefine((evento, ctx) => {
    const inicioEvento = new Date(evento.fechaInicio)
    const finEvento = new Date(evento.fechaFin)

    if (evento.fechaInicio && evento.fechaFin && finEvento < inicioEvento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de fin debe ser igual o posterior a la de inicio.',
        path: ['fechaFin'],
      })
    }

    if (!evento.fechaInicio || !evento.fechaFin) return

    evento.bloquesTaller.forEach((bloque, bloqueIndex) => {
      bloque.talleres.forEach((taller, tallerIndex) => {
        if (!taller.inicio || !taller.fin) return

        const inicioTaller = new Date(taller.inicio)
        const finTaller = new Date(taller.fin)

        if (inicioTaller < inicioEvento) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El taller no puede empezar antes que el evento.',
            path: ['bloquesTaller', bloqueIndex, 'talleres', tallerIndex, 'inicio'],
          })
        }

        if (finTaller > finEvento) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'El taller no puede terminar después que el evento.',
            path: ['bloquesTaller', bloqueIndex, 'talleres', tallerIndex, 'fin'],
          })
        }
      })
    })
  })

export const editarEventoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio.').max(150),
  codigo: z
    .string()
    .min(3, 'El código debe tener al menos 3 caracteres.')
    .max(20)
    .regex(/^[a-zA-Z0-9-]+$/, 'Solo letras, números y guiones.'),
  descripcion: z.string().max(2000).optional().or(z.literal('')),
  fechaInicio: z.string().min(1, 'Definí la fecha de inicio.'),
  fechaFin: z.string().min(1, 'Definí la fecha de fin.'),
  politicaMenor: z.enum(['obligatorio', 'opcional', 'no_aplica']).default('no_aplica'),
  inscripcionesCerradas: z.boolean().optional(),
  tieneGrupos: z.boolean().default(false),
  tieneTalleres: z.boolean().default(false),
  cbuCvu: z.string().max(50).optional().or(z.literal('')),
  aliasCobro: z.string().max(50).optional().or(z.literal('')),
  costo: z.number({ invalid_type_error: 'Ingresá un número.' }).min(0).default(0),
}).refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  { message: 'La fecha de fin debe ser igual o posterior a la de inicio.', path: ['fechaFin'] }
)