/**
 * Un evento "tiene costo" si cobra un monto fijo, o si usa precio por zona
 * (en ese caso evento.costo queda en 0 pero cada zona cobra > 0).
 */
export function eventoTieneCosto(evento) {
  return Boolean(evento?.tiene_precio_por_zona) || parseFloat(evento?.costo ?? 0) > 0
}
