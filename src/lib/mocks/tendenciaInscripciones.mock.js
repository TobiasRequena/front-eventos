// src/lib/mocks/tendenciaInscripciones.mock.js

// ⚠️ MOCK TEMPORAL — reemplazar cuando exista un endpoint de series de
// tiempo (ej. GET /eventos/stats/inscripciones?rango=7d). Genera una
// curva ascendente con algo de ruido, para simular inscripciones diarias.
export function generarTendenciaMock(dias) {
  const hoy = new Date()
  const datos = []
  let acumulado = Math.floor(Math.random() * 5)

  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(hoy)
    fecha.setDate(fecha.getDate() - i)

    const nuevasHoy = Math.max(0, Math.round(Math.random() * 8 - 1))
    acumulado += nuevasHoy

    datos.push({
      fecha: fecha.toISOString().slice(0, 10),
      inscripciones: nuevasHoy,
    })
  }

  return datos
}