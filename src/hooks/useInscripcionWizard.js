import { useState, useMemo } from 'react'

/**
 * Calcula dinámicamente los pasos del wizard según la configuración del evento
 * y el estado acumulado (ej: si el participante es menor, afecta el paso de grupo).
 */
function calcularPasos(evento) {
  const pasos = ['datos_personales']

  if (evento.tiene_grupos || evento.politica_menor !== 'no_aplica') {
    pasos.push('grupo')
  }

  if (evento.tiene_talleres) {
    pasos.push('talleres')
  }

  if (evento.camposForm?.length > 0) {
    pasos.push('formulario')
  }

  if (parseFloat(evento.costo ?? 0) > 0) {
    pasos.push('pago')
  }

  pasos.push('confirmacion')

  return pasos
}

const ESTADO_INICIAL = {
  // Paso 1
  nombre: '',
  apellido: '',
  email: '',
  dni: '',
  nacimiento: '',
  esMayor: null,

  // Paso 2
  rolGrupo: 'ninguno',
  grupoId: null,
  grupoSeleccionado: null, // objeto completo del grupo para mostrar info
  datosGrupoNuevo: null,   // si crea grupo nuevo: { nombre, parroquia, localidad, maxIntegrantes }

  // Paso 3
  talleresSeleccionados: {}, // { [bloque_taller_id]: taller_id | taller_id[] }

  // Paso 4
  respuestasForm: {},

  // Paso 5
  comprobantePago: null,    // File | null
  pagoPostergado: false,

  // Resultado final
  participanteCreado: null,
  grupoCreado: null,
}

export function useInscripcionWizard(evento, codigoGrupoInicial = null) {
  const [datosWizard, setDatosWizard] = useState({
    ...ESTADO_INICIAL,
    // Si llegó con código de grupo, pre-setear
    grupoId: codigoGrupoInicial ? 'pendiente' : null,
    rolGrupo: codigoGrupoInicial ? 'integrante' : 'ninguno',
  })
  const [pasoActualIndex, setPasoActualIndex] = useState(0)

  const pasos = useMemo(
    () => calcularPasos(evento, datosWizard),
    // Recalcular si cambia si tiene talleres, grupos, campos, costo
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      evento.tiene_grupos,
      evento.tiene_talleres,
      evento.camposForm?.length,
      evento.costo,
    ]
  )

  const pasoActual = pasos[pasoActualIndex]
  const esUltimoPaso = pasoActualIndex === pasos.length - 1
  const esPrimerPaso = pasoActualIndex === 0

  function avanzar(datosPaso = {}) {
    setDatosWizard((prev) => ({ ...prev, ...datosPaso }))
    setPasoActualIndex((prev) => Math.min(prev + 1, pasos.length - 1))
  }

  function retroceder() {
    setPasoActualIndex((prev) => Math.max(prev - 1, 0))
  }

  function actualizarDatos(datos) {
    setDatosWizard((prev) => ({ ...prev, ...datos }))
  }

  // Índice visual (excluye 'confirmacion' del conteo de progreso)
  const pasosVisibles = pasos.filter((p) => p !== 'confirmacion')
  const indexVisual = pasosVisibles.indexOf(pasoActual)
  const totalVisual = pasosVisibles.length

  return {
    pasoActual,
    pasoActualIndex,
    pasos,
    datosWizard,
    esPrimerPaso,
    esUltimoPaso,
    indexVisual,
    totalVisual,
    avanzar,
    retroceder,
    actualizarDatos,
  }
}