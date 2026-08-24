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
    capacidad: z.preprocess(
      (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
      z.number().int().positive('La capacidad debe ser mayor a 0.').optional()
    ),
  })

const tallerSueltoSchema = z.object({
  tipo: z.literal('taller_suelto'),
  nombre: z.string().min(1, 'El nombre es obligatorio.'),
  descripcion: z.string().optional().or(z.literal('')),
  inicio: z.string().min(1, 'El inicio es obligatorio.'),
  fin: z.string().min(1, 'El fin es obligatorio.'),
  capacidad: z.preprocess(
    (val) => (typeof val === 'number' && isNaN(val) ? undefined : val),
    z.number().int().positive().optional().nullable()
  ),
  esObligatorio: z.boolean().default(false),
}).refine(
  (t) => !t.inicio || !t.fin || new Date(t.fin) > new Date(t.inicio),
  { message: 'El fin del taller debe ser posterior al inicio.', path: ['fin'] }
)

const bloqueSchema = z.object({
  tipo: z.literal('bloque'),
  nombre: z.string().min(1, 'El nombre del bloque es obligatorio.').max(100),
  cantidadElegible: z.number().int().positive().default(1),
  esObligatorio: z.boolean().default(true),
  orden: z.number().default(0),
  inicio: z.string().min(1, 'El horario de inicio es obligatorio.'),
  fin: z.string().min(1, 'El horario de fin es obligatorio.'),
  talleres: z.array(tallerSchema).min(1, 'Agregá al menos un taller a este bloque.'),
}).refine(
  (b) => !b.inicio || !b.fin || new Date(b.fin) > new Date(b.inicio),
  { message: 'El fin del bloque debe ser posterior al inicio.', path: ['fin'] }
)

const seccionTallerItem = z.discriminatedUnion('tipo', [bloqueSchema, tallerSueltoSchema])

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
    cupoMaximo: z.number({ invalid_type_error: 'Ingresá un número.' }).int().positive().optional().nullable(),
    aliasCobro: z.string().max(50).optional().or(z.literal('')),
    costo: z.preprocess(
      (val) => (val === '' || val === null || val === undefined ? 0 : Number(val)),
      z.number({ invalid_type_error: 'Ingresá un número válido.' }).min(0, 'El costo no puede ser negativo.')
    ),
    camposForm: z.array(campoFormSchema).default([]),
    // bloquesTaller: z.array(bloqueTallerSchema).default([]),
    configFichaMedica: z.enum([
      'no', 'opcional_menores', 'opcional_mayores', 'opcional_todos',
      'obligatorio_menores', 'obligatorio_mayores', 'obligatorio_todos',
    ]).default('no'),

    configCertificado: z.enum([
      'no', 'opcional_menores', 'opcional_mayores', 'opcional_todos', 'opcional_referentes',
      'obligatorio_menores', 'obligatorio_mayores', 'obligatorio_todos', 'obligatorio_referentes',
    ]).default('no'),
    requiereAutorizacionMenores: z.boolean().default(false),
    seccionTalleres: z.array(seccionTallerItem).default([]),
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

    evento.seccionTalleres.forEach((item, itemIndex) => {
      if (item.tipo === 'bloque') {
        // Validar horario del bloque
        if (item.inicio && item.fin) {
          if (new Date(item.fin) <= new Date(item.inicio)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El fin del bloque debe ser posterior al inicio.',
              path: ['seccionTalleres', itemIndex, 'fin'],
            })
          }
          if (new Date(item.inicio) < inicioEvento) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El bloque no puede empezar antes que el evento.',
              path: ['seccionTalleres', itemIndex, 'inicio'],
            })
          }
          if (new Date(item.fin) > finEvento) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El bloque no puede terminar después que el evento.',
              path: ['seccionTalleres', itemIndex, 'fin'],
            })
          }
        }

        // Validar talleres dentro del bloque
        item.talleres?.forEach((taller, tallerIndex) => {
          if (!taller.nombre?.trim()) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El nombre del taller es obligatorio.',
              path: ['seccionTalleres', itemIndex, 'talleres', tallerIndex, 'nombre'],
            })
          }
        })
      }

      if (item.tipo === 'taller_suelto') {
        if (item.inicio && item.fin) {
          if (new Date(item.fin) <= new Date(item.inicio)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El fin del taller debe ser posterior al inicio.',
              path: ['seccionTalleres', itemIndex, 'fin'],
            })
          }
          if (new Date(item.inicio) < inicioEvento) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El taller no puede empezar antes que el evento.',
              path: ['seccionTalleres', itemIndex, 'inicio'],
            })
          }
          if (new Date(item.fin) > finEvento) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'El taller no puede terminar después que el evento.',
              path: ['seccionTalleres', itemIndex, 'fin'],
            })
          }
        }
      }
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
  cupoMaximo: z.number({ invalid_type_error: 'Ingresá un número.' }).int().positive().optional().nullable(),
  configFichaMedica: z.enum([
    'no', 'opcional_menores', 'opcional_mayores', 'opcional_todos',
    'obligatorio_menores', 'obligatorio_mayores', 'obligatorio_todos',
  ]).default('no'),
  configCertificado: z.enum([
    'no', 'opcional_menores', 'opcional_mayores', 'opcional_todos', 'opcional_referentes',
    'obligatorio_menores', 'obligatorio_mayores', 'obligatorio_todos', 'obligatorio_referentes',
  ]).default('no'),
  requiereAutorizacionMenores: z.boolean().default(false),
  seccionTalleres: z.array(seccionTallerItem).default([]),
}).refine(
  (data) => new Date(data.fechaFin) >= new Date(data.fechaInicio),
  { message: 'La fecha de fin debe ser igual o posterior a la de inicio.', path: ['fechaFin'] }
)

