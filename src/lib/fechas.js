// Columnas DATE (sin hora) del back llegan como "YYYY-MM-DD" o, ya
// serializadas por Postgres/JSON, como "YYYY-MM-DDT00:00:00.000Z".
// "new Date(...)" las interpreta como medianoche UTC, y formatearlas con
// getters/Intl en hora local (Argentina, UTC-3) muestra el día anterior.
const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})(T00:00:00(\.000)?Z)?$/

// Parsea una fecha-calendario (sin hora) como fecha LOCAL, evitando el
// corrimiento de día por huso horario. Para timestamps reales (con hora
// distinta de medianoche UTC) se comporta como "new Date" normal.
export function parseFechaCalendario(fechaStr) {
  const match = SOLO_FECHA.exec(fechaStr ?? '')
  if (!match) return new Date(fechaStr)
  const [, anio, mes, dia] = match
  return new Date(Number(anio), Number(mes) - 1, Number(dia))
}
