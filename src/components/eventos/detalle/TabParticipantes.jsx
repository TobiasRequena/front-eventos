import { useEffect, useState, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ParticipantesDataTable } from '@/components/eventos/detalle/ParticipantesDataTable'
import { ParticipanteDrawer } from '@/components/eventos/detalle/ParticipanteDrawer'
import { buildColumns } from '@/components/eventos/detalle/participantes.columns'
import { getParticipantes } from '@/api/eventos.api'

function TablaSkeletonRows() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function TabParticipantes({ evento }) {
  const [participantes, setParticipantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [participanteSeleccionado, setParticipanteSeleccionado] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  useEffect(() => {
    if (!evento) return
    setIsLoading(true)
    getParticipantes(evento.id, evento)
      .then(setParticipantes)
      .finally(() => setIsLoading(false))
  }, [evento])

  const camposForm = evento.camposForm ?? []

  const columns = useMemo(
    () =>
      buildColumns({
        camposForm,
        tieneCosto: parseFloat(evento?.costo ?? 0) > 0,
        tieneGrupos: evento?.tiene_grupos ?? false,
        onVerDetalle: (participante) => {
          setParticipanteSeleccionado(participante)
          setDrawerAbierto(true)
        },
      }),
    [camposForm, evento]
  )

  if (isLoading) return <TablaSkeletonRows />

  return (
    <>
      <ParticipantesDataTable
        columns={columns}
        data={participantes}
        evento={evento}
        camposForm={camposForm}
      />

      <ParticipanteDrawer
        participante={participanteSeleccionado}
        camposForm={camposForm}
        evento={evento}
        open={drawerAbierto}
        onClose={() => {
          setDrawerAbierto(false)
          setParticipanteSeleccionado(null)
        }}
      />
    </>
  )
}