// ⚠️ MOCK TEMPORAL — reemplazar cuando exista GET /eventos/:id/stats
// El endpoint debería devolver algo así:
// {
//   totalInscriptos: number,
//   bloquesTaller: [{ 
//     id, nombre, cantidad_elegible, es_obligatorio,
//     talleres: [{ id, nombre, capacidad, inscriptos }] 
//   }],
//   camposFormStats: [{ 
//     id, etiqueta, tipo, 
//     respuestasPopulares: [{ valor, cantidad }] 
//   }]
// }

export function generarStatsMock(evento) {
  const totalInscriptos = Math.floor(Math.random() * 80) + 20

  const bloquesTaller = (evento.bloquesTaller ?? []).map((bloque) => ({
    id: bloque.id,
    nombre: bloque.nombre,
    cantidad_elegible: bloque.cantidad_elegible,
    es_obligatorio: bloque.es_obligatorio,
    talleres: (bloque.talleres ?? []).map((taller) => ({
      id: taller.id,
      nombre: taller.nombre,
      capacidad: taller.capacidad,
      inscriptos: taller.capacidad
        ? Math.floor(Math.random() * taller.capacidad)
        : Math.floor(Math.random() * 30),
    })),
  }))

  const camposFormStats = (evento.camposForm ?? [])
    .filter((c) => c.tipo === 'seleccion')
    .map((campo) => ({
      id: campo.id,
      etiqueta: campo.etiqueta,
      tipo: campo.tipo,
      respuestasPopulares: (campo.opciones ?? [])
        .map((opcion) => ({
          valor: opcion,
          cantidad: Math.floor(Math.random() * totalInscriptos),
        }))
        .sort((a, b) => b.cantidad - a.cantidad),
    }))

  return { totalInscriptos, bloquesTaller, camposFormStats }
}