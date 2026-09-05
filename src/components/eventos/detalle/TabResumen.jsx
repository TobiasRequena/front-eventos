import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ResumenKpis } from '@/components/eventos/detalle/ResumenKpis'
import { TalleresProgreso } from '@/components/eventos/detalle/TalleresProgreso.jsx'
import { RespuestasPopulares } from '@/components/eventos/detalle/RespuestasPopulares'
import { TallerParticipantesPanel } from '@/components/eventos/detalle/TallerParticipantesPanel'
import { EventoPreviewPanel } from '@/components/eventos/EventoPreviewPanel'
import { getEventoStats } from '@/api/eventos.api'
import { CupoProgressCard } from '@/components/eventos/detalle/CupoProgressCard'
import { PagosPendientesPanel } from '@/components/eventos/detalle/PagosPendientesPanel'
import { FichasMedicasPanel } from '@/components/eventos/detalle/FichasMedicasPanel'
import { cn } from '@/lib/utils'

function ResumenSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-48" />
    </div>
  )
}

export function TabResumen({ evento }) {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null)
  const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null)
  const [vistaPagos, setVistaPagos] = useState(false)
  const [vistaFichas, setVistaFichas] = useState(null)

  function cargarStats(esRefresh = false) {
    if (!evento?.id) return
    esRefresh ? setIsRefreshing(true) : setIsLoading(true)
    return getEventoStats(evento.id)
      .then(setStats)
      .finally(() => (esRefresh ? setIsRefreshing(false) : setIsLoading(false)))
  }

  useEffect(() => {
    cargarStats()
  }, [evento.id])

  useEffect(() => {
    const estaEnVistaInterna = tallerSeleccionado || vistaPagos || vistaFichas
    if (!estaEnVistaInterna) return

    // Agregar una entrada al historial para que el botón atrás vuelva al resumen
    window.history.pushState(null, '', window.location.href)

    function handlePopState() {
      setTallerSeleccionado(null)
      setBloqueSeleccionado(null)
      setVistaPagos(false)
      setVistaFichas(null)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [tallerSeleccionado, vistaPagos, vistaFichas])

  if (isLoading || !stats) return <ResumenSkeleton />
  if (tallerSeleccionado) {
    return (
      <TallerParticipantesPanel
        bloque={bloqueSeleccionado}
        taller={tallerSeleccionado}
        evento={evento}
        onVolver={() => {
          setTallerSeleccionado(null)
          setBloqueSeleccionado(null)
        }}
      />
    )
  }

  if (vistaPagos) {
    return (
      <PagosPendientesPanel
        evento={evento}
        onVolver={() => setVistaPagos(false)}
      />
    )
  }

  if (vistaFichas) {
    return (
      <FichasMedicasPanel
        evento={evento}
        categoria={vistaFichas}
        onVolver={() => setVistaFichas(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-0">
            <h2 className="text-base font-medium text-foreground">Resumen del evento</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => cargarStats(true)}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refrescar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className='flex gap-4'>
            <CupoProgressCard
              totalInscriptos={stats.totalInscriptos}
              cupoMaximo={stats.cupoMaximo}
            />
          </div>
          <ResumenKpis
            stats={stats}
            onVerPagos={() => setVistaPagos(true)}
            onVerFichas={(categoria) => setVistaFichas(categoria)}
          />

          <RespuestasPopulares camposFormStats={stats.camposFormStats} />

          <TalleresProgreso
            bloquesTaller={stats.bloquesTaller}
            talleresSueltos={stats.talleresSueltos}
            onSeleccionarTaller={(bloque, taller) => {
              setBloqueSeleccionado(bloque)
              setTallerSeleccionado(taller)
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <EventoPreviewPanel evento={evento} readOnly />
          </div>
        </div>
      </div>
    </div>
  )
}