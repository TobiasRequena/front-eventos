// ⚠️ MOCK TEMPORAL — reemplazar cuando exista GET /eventos/:id/participantes
// El endpoint debería devolver algo así:
// {
//   participantes: [{
//     id, nombre, apellido, email, dni, fecha_nacimiento, es_mayor,
//     rol_grupo, estado_pago, pagado_por, qr_personal,
//     respuestas_form: { [campo_form_id]: valor },
//     grupo: { id, nombre } | null,
//     creado_en
//   }]
// }

const NOMBRES = ['María', 'Juan', 'Lucía', 'Pedro', 'Valentina', 'Santiago', 'Camila', 'Mateo', 'Sofia', 'Lucas']
const APELLIDOS = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores']
const ESTADOS_PAGO = ['no_aplica', 'pendiente', 'aprobado', 'rechazado']
const ROLES_GRUPO = ['responsable', 'integrante', 'autoinscripto', 'ninguno']

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generarDni() {
  return String(Math.floor(Math.random() * 40000000) + 10000000)
}

function generarFechaNacimiento() {
  const año = Math.floor(Math.random() * 30) + 1985
  const mes = Math.floor(Math.random() * 12) + 1
  const dia = Math.floor(Math.random() * 28) + 1
  return `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function generarRespuestasForm(camposForm) {
  const respuestas = {}
  for (const campo of camposForm) {
    if (campo.tipo === 'seleccion' && campo.opciones?.length) {
      respuestas[campo.id] = randomItem(campo.opciones)
    } else if (campo.tipo === 'texto') {
      respuestas[campo.id] = 'Respuesta de ejemplo'
    } else if (campo.tipo === 'booleano') {
      respuestas[campo.id] = Math.random() > 0.5
    } else if (campo.tipo === 'numero') {
      respuestas[campo.id] = Math.floor(Math.random() * 100)
    }
  }
  return respuestas
}

export function generarParticipantesMock(evento, cantidad = 40) {
  const camposForm = evento.camposForm ?? []
  const participantes = []

  for (let i = 0; i < cantidad; i++) {
    const nombre = randomItem(NOMBRES)
    const apellido = randomItem(APELLIDOS)
    participantes.push({
      id: `mock-participante-${i}`,
      nombre,
      apellido,
      email: `${nombre.toLowerCase()}.${apellido.toLowerCase()}${i}@email.com`,
      dni: generarDni(),
      fecha_nacimiento: generarFechaNacimiento(),
      es_mayor: Math.random() > 0.2,
      rol_grupo: randomItem(ROLES_GRUPO),
      estado_pago: randomItem(ESTADOS_PAGO),
      pagado_por: Math.random() > 0.5 ? 'individual' : 'grupal',
      qr_personal: `qr-${i}`,
      acreditado: Math.random() > 0.5,
      respuestas_form: generarRespuestasForm(camposForm),
      grupo: Math.random() > 0.4
        ? { id: `grupo-${Math.floor(i / 5)}`, nombre: `Grupo ${Math.floor(i / 5) + 1}` }
        : null,
      creado_en: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  return participantes
}

export function generarParticipantesTallerMock(taller, cantidad = 20) {
  const participantes = []
  for (let i = 0; i < cantidad; i++) {
    participantes.push({
      id: `mock-taller-participante-${i}`,
      nombre: randomItem(NOMBRES),
      apellido: randomItem(APELLIDOS),
      dni: generarDni(),
      acreditado: Math.random() > 0.4,
    })
  }
  return participantes
}