import { useState, useEffect } from 'react'

const BASE = 'https://apis.datos.gob.ar/georef/api'
const cache = {}

async function fetchGeoref(url) {
  if (cache[url]) return cache[url]
  const res = await fetch(url)
  const data = await res.json()
  cache[url] = data
  return data
}

export function useProvincias() {
  const [provincias, setProvincias] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchGeoref(`${BASE}/provincias?orden=nombre&max=100`)
      .then((data) => setProvincias(data.provincias ?? []))
      .finally(() => setIsLoading(false))
  }, [])

  return { provincias, isLoading }
}

export function useLocalidades(provinciaId) {
  const [localidades, setLocalidades] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!provinciaId) {
      setLocalidades([])
      return
    }
    setIsLoading(true)
    fetchGeoref(`${BASE}/localidades?provincia=${provinciaId}&orden=nombre&max=1000`)
      .then((data) => setLocalidades(data.localidades ?? []))
      .finally(() => setIsLoading(false))
  }, [provinciaId])

  return { localidades, isLoading }
}

export function useBuscarLocalidades(provinciaId) {
  const [resultados, setResultados] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  async function buscar(termino) {
    if (!provinciaId || termino.length < 2) {
      setResultados([])
      return
    }
    setIsLoading(true)
    try {
      const data = await fetchGeoref(
        `${BASE}/localidades?provincia=${provinciaId}&nombre=${encodeURIComponent(termino)}&orden=nombre&max=20`
      )
      const unicas = [...new Map(
        (data.localidades ?? []).map(l => [l.nombre.toLowerCase(), l])
      ).values()]
      setResultados(unicas)
    } finally {
      setIsLoading(false)
    }
  }

  function limpiar() {
    setResultados([])
  }

  return { resultados, isLoading, buscar, limpiar }
}