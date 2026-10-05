// Las respuestas de campos de selección `multiple` son arrays de opciones;
// las demás son valores sueltos (string, número, boolean).

export function textoRespuesta(valor) {
  if (valor === undefined || valor === null) return '—'
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No'
  if (Array.isArray(valor)) return valor.length ? valor.join(', ') : '—'
  return String(valor)
}

/** Para filtros por opción: en multiple alcanza con que la opción esté elegida. */
export function respuestaIncluye(valor, opcion) {
  return [].concat(valor ?? '').map(String).includes(opcion)
}
