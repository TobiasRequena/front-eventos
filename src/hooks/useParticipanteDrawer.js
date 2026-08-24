import { useState } from 'react'
import { toast } from 'sonner'
import { getParticipantePorId } from '@/api/participantes.api'

export function useParticipanteDrawer() {
  const [participante, setParticipante] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function abrirDrawer(participanteId) {
    setDrawerAbierto(true)
    setCargando(true)
    try {
      const data = await getParticipantePorId(participanteId)
      setParticipante(data)
    } catch {
      toast.error('No pudimos cargar el detalle del participante.')
      setDrawerAbierto(false)
    } finally {
      setCargando(false)
    }
  }

  function cerrarDrawer() {
    setDrawerAbierto(false)
    setParticipante(null)
  }

  return {
    participante,
    drawerAbierto,
    cargando,
    abrirDrawer,
    cerrarDrawer,
  }
}