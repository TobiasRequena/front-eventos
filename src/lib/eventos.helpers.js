/**
 * Estado derivado de un evento, calculado en el front a partir de sus fechas.
 * 'borrador' queda reservado para cuando el back modele ese concepto
 * (hoy ningún evento puede caer en este estado).
 */
export function getEstadoEvento(evento) {
  const ahora = Date.now()
  const fechaFin = new Date(evento.fecha_fin).getTime()

  return fechaFin < ahora ? 'finalizado' : 'activo'
}

export function esEventoActivo(evento) {
  return getEstadoEvento(evento) === 'activo'
}

export function esEventoFinalizado(evento) {
  return getEstadoEvento(evento) === 'finalizado'
}

/**
 * El próximo evento activo (no finalizado), ordenado por fecha_inicio
 * ascendente — el más próximo en el tiempo primero.
 * @param {Array<object>} eventos
 * @returns {object | null}
 */
export function getProximoEvento(eventos) {
  const activos = eventos
    .filter(esEventoActivo)
    .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio))

  return activos[0] ?? null
}

/**
 * Suma cantidadInscriptos solo de los eventos activos.
 * Hoy siempre da 0 porque el back todavía no calcula ese campo,
 * pero la lógica ya queda lista para cuando lo haga.
 */
export function getTotalInscriptosActivos(eventos) {
  return eventos
    .filter(esEventoActivo)
    .reduce((total, evento) => total + (evento.cantidadInscriptos ?? 0), 0)
}

export const FILTROS_EVENTO = {
  todos: { label: 'Todos' },
  activos: { label: 'Activos' },
  borradores: { label: 'Borradores' },
  finalizados: { label: 'Finalizados' },
}

/**
 * Filtra una lista de eventos según el filtro de estado pedido.
 * 'borradores' siempre devuelve vacío por ahora: el back todavía no
 * modela ese concepto (ver getEstadoEvento más arriba).
 * @param {Array<object>} eventos
 * @param {keyof typeof FILTROS_EVENTO} filtro
 */
export function filtrarEventosPorEstado(eventos, filtro) {
  switch (filtro) {
    case 'activos':
      return eventos.filter(esEventoActivo)
    case 'finalizados':
      return eventos.filter(esEventoFinalizado)
    case 'borradores':
      return []
    case 'todos':
    default:
      return eventos
  }
}