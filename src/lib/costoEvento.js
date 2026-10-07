/**
 * Un evento "tiene costo" si cobra un monto fijo, o si usa precio por zona
 * (en ese caso evento.costo queda en 0 pero cada zona cobra > 0).
 */
export function eventoTieneCosto(evento) {
  return Boolean(evento?.tiene_precio_por_zona) || parseFloat(evento?.costo ?? 0) > 0
}

/**
 * Monto de cada cuota de un plan para un costo dado (en centavos para no
 * arrastrar errores de float). Cada cuota es { porcentaje } o { monto };
 * la última es el resto. Devuelve null si el plan no entra en ese costo.
 * Misma lógica en back-eventos/src/modules/planesPago/services/planesPago.service.js.
 */
export function calcularMontosCuotas(costo, cuotas) {
  const total = Math.round(Number(costo) * 100)
  const montos = []
  let acumulado = 0
  cuotas.forEach((c, i) => {
    if (i === cuotas.length - 1) return
    const centavos = c.porcentaje != null
      ? Math.round((total * Number(c.porcentaje)) / 100)
      : Math.round(Number(c.monto) * 100)
    montos.push(centavos)
    acumulado += centavos
  })
  const resto = total - acumulado
  if (resto <= 0) return null
  return [...montos, resto].map((c) => c / 100)
}

/** Costo que paga un participante: el de su zona si el evento cobra por zona. */
export function costoParticipante(evento, zonaCostoId) {
  if (evento?.tiene_precio_por_zona) {
    return Number(evento.zonasCosto?.find((z) => z.id === zonaCostoId)?.costo ?? 0)
  }
  return Number(evento?.costo ?? 0)
}

export const formatoPesos = (n) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 })

// Vencimientos son DATE (sin hora): se muestran en UTC para no correrse un día
export const formatoVencimiento = (d) =>
  d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : null

// En el form cada cuota es { tipo: 'porcentaje' | 'monto' | 'resto', valor, vencimiento }
// y cuotaQr es 'completo' o el número de cuota como string (para el Select).
export function planFormAApi(plan) {
  const cuotaQr = Number(plan.cuotaQr)
  return {
    nombre: plan.nombre,
    // La última cuota equivale a "al completar el pago"
    cuotaQr: cuotaQr >= 1 && cuotaQr < plan.cuotas.length ? cuotaQr : null,
    cuotas: plan.cuotas.map((c) => ({
      porcentaje: c.tipo === 'porcentaje' ? Number(c.valor) : null,
      monto: c.tipo === 'monto' ? Number(c.valor) : null,
      vencimiento: c.vencimiento || null,
    })),
  }
}

export function planApiAForm(plan) {
  return {
    nombre: plan.nombre,
    cuotaQr: plan.cuota_qr ? String(plan.cuota_qr) : 'completo',
    cuotas: plan.cuotas.map((c) => ({
      tipo: c.porcentaje != null ? 'porcentaje' : c.monto != null ? 'monto' : 'resto',
      valor: c.porcentaje != null ? Number(c.porcentaje) : c.monto != null ? Number(c.monto) : '',
      vencimiento: c.vencimiento ? String(c.vencimiento).slice(0, 10) : '',
    })),
  }
}
