import { useState, useEffect, useMemo } from 'react'

/**
 * Calcula dinámicamente los pasos del wizard según la configuración del evento
 * y el estado acumulado (ej: si el participante es menor, afecta el paso de grupo).
 */
function calcularPasos(evento, datosWizard) {
  const pasos = ['datos_personales']

  if (evento.tiene_grupos || evento.tieneGrupos || (evento.politica_menor && evento.politica_menor !== 'no_aplica') || (evento.politicaMenor && evento.politicaMenor !== 'no_aplica')) {
    pasos.push('grupo')
  }

  if (evento.tiene_talleres || evento.tieneTalleres) {
    pasos.push('talleres')
  }

  if (evento.camposForm?.length > 0) {
    pasos.push('formulario')
  }

  // Calcular edad si ya ingresó nacimiento
  const edad = datosWizard.nacimiento
    ? Math.floor((Date.now() - new Date(datosWizard.nacimiento)) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const esMenor = datosWizard.esMayor === false || (edad !== null && edad < 18)
  const esMayor = datosWizard.esMayor === true || (edad !== null && edad >= 18)
  const esReferente = datosWizard.rolGrupo === 'responsable'

  const configFicha = evento.config_ficha_medica || evento.configFichaMedica || 'no'
  const configCert = evento.config_certificado || evento.configCertificado || 'no'
  const requiereAutorizaciones = Boolean(evento.requiere_autorizacion_menores || evento.requiereAutorizacionMenores)

  const necesitaFichaMedica = configFicha !== 'no' && (
    (configFicha.includes('menores') && esMenor) ||
    (configFicha.includes('mayores') && esMayor) ||
    configFicha.includes('todos')
  )

  const necesitaCertificado = configCert !== 'no' && (
    (configCert.includes('menores') && esMenor) ||
    (configCert.includes('mayores') && esMayor) ||
    configCert.includes('todos') ||
    (configCert.includes('referentes') && esReferente)
  )

  const necesitaAutorizacion = requiereAutorizaciones && esMenor

  const necesitaDocumentacion = (
    (evento.config_ficha_medica && evento.config_ficha_medica !== 'no') ||
    (evento.config_certificado && evento.config_certificado !== 'no') ||
    evento.requiere_autorizacion_menores
  )

  if (necesitaDocumentacion) {
    pasos.push('documentacion')
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

  // Documentación
  fichaMedica: null,
  autorizacionArchivo: null,
  certificadoArchivo: null,

  // Resultado final
  participanteCreado: null,
  grupoCreado: null,
}

const STORAGE_KEY = (codigoEvento) => `wizard_inscripcion_${codigoEvento}`

export function useInscripcionWizard(evento, codigoGrupoInicial = null) {
  const storageKey = STORAGE_KEY(evento?.codigo ?? 'unknown')

  // Cargar estado guardado
  const estadoGuardado = useMemo(() => {
    try {
      const raw = sessionStorage.getItem(storageKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [storageKey])

  const [datosWizard, setDatosWizard] = useState({
    ...ESTADO_INICIAL,
    // Si llegó con código de grupo, pre-setear
    grupoId: codigoGrupoInicial ? 'pendiente' : null,
    rolGrupo: codigoGrupoInicial ? 'integrante' : 'ninguno',
    ...(estadoGuardado?.datosWizard ?? {}),
  })

  const [pasoActualIndex, setPasoActualIndex] = useState(
    estadoGuardado?.pasoActualIndex ?? 0
  )

  // Guardar en sessionStorage cuando cambia el estado
  useEffect(() => {
    if (!evento?.codigo) return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({
        datosWizard,
        pasoActualIndex,
      }))
    } catch { }
  }, [datosWizard, pasoActualIndex, storageKey])

  // Limpiar al completar inscripción
  function limpiarStorage() {
    try {
      sessionStorage.removeItem(storageKey)
    } catch { }
  }

  const pasos = useMemo(
    () => calcularPasos(evento, datosWizard),
    [
      evento,
      datosWizard.nacimiento,
      datosWizard.esMayor,
      datosWizard.rolGrupo,
    ]
  )

  const pasoActual = pasos[pasoActualIndex]
  const esUltimoPaso = pasoActualIndex === pasos.length - 1
  const esPrimerPaso = pasoActualIndex === 0
  const siguientePaso = pasos[pasoActualIndex + 1]

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
  const esUltimoPasoVisible = pasoActual === pasosVisibles[pasosVisibles.length - 1]
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
    esUltimoPasoVisible,
    avanzar,
    retroceder,
    actualizarDatos,
    limpiarStorage,
  }
}