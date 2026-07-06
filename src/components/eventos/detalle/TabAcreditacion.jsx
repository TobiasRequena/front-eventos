import { useEffect, useState, useMemo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarRange, Copy, Check } from 'lucide-react'
import { AcreditacionDataTable } from '@/components/eventos/detalle/AcreditacionDataTable'
import { buildAcreditacionColumns } from '@/components/eventos/detalle/acreditacion.columns'
import { getParticipantes } from '@/api/eventos.api'

function ProgressCard({ acreditados, total }) {
  const porcentaje = total > 0 ? Math.round((acreditados / total) * 100) : 0

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Acreditación en curso</p>
          <span className="text-2xl font-semibold text-foreground">
            {acreditados}
            <span className="text-base font-normal text-muted-foreground"> / {total}</span>
          </span>
        </div>
        <Progress value={porcentaje} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {porcentaje}% de los inscriptos ya fueron acreditados
        </p>
      </CardContent>
    </Card>
  )
}

function tiempoHastaActivacion(fechaInicio) {
  const ahora = new Date()
  const activacion = new Date(new Date(fechaInicio).getTime() - 2 * 60 * 60 * 1000)
  const diffMs = activacion - ahora

  if (diffMs <= 0) return null

  const diffMinutos = Math.floor(diffMs / 60000)
  const diffHoras = Math.floor(diffMs / 3600000)
  const diffDias = Math.floor(diffMs / 86400000)

  if (diffDias >= 1) {
    return `el ${new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(activacion)}`
  }

  if (diffHoras >= 1) return `en ${diffHoras} hora${diffHoras !== 1 ? 's' : ''}`
  return `en ${diffMinutos} minuto${diffMinutos !== 1 ? 's' : ''}`
}

const PASOS_ACREDITACION = [
  {
    numero: 1,
    titulo: 'Ingresá al modo acreditación',
    descripcion: 'Desde esta pantalla, accedé al modo de escaneo. Podés usar cualquier dispositivo con cámara y navegador.',
  },
  {
    numero: 2,
    titulo: 'Escaneá el QR del participante',
    descripcion: 'Cada inscripto recibe un QR personal por mail. Al escanearlo, el sistema muestra sus datos y estado de pago al instante.',
  },
  {
    numero: 3,
    titulo: 'Acreditación individual o grupal',
    descripcion: 'Si el participante llegó con su grupo, podés acreditar a todos los integrantes de una sola vez escaneando el QR del referente.',
  },
  {
    numero: 4,
    titulo: 'Registro de talleres',
    descripcion: 'Al ingresar a cada taller, volvé a escanear el QR para registrar la asistencia. Esto permite ubicar a cualquier participante en tiempo real.',
  },
]

function useCuentaRegresiva(fechaInicio) {
  const getActivacion = () =>
    new Date(new Date(fechaInicio).getTime() - 2 * 60 * 60 * 1000)

  const calcularTiempo = () => {
    const diffMs = getActivacion() - new Date()
    if (diffMs <= 0) return null

    const totalSegundos = Math.floor(diffMs / 1000)
    const dias = Math.floor(totalSegundos / 86400)
    const horas = Math.floor((totalSegundos % 86400) / 3600)
    const minutos = Math.floor((totalSegundos % 3600) / 60)
    const segundos = totalSegundos % 60

    if (dias >= 1) {
      return `${dias}d ${horas}h ${minutos}m ${segundos}s`
    }
    if (horas >= 1) {
      return `${horas}h ${minutos}m ${segundos}s`
    }
    return `${minutos}m ${segundos}s`
  }

  const [tiempo, setTiempo] = useState(calcularTiempo)

  useEffect(() => {
    const interval = setInterval(() => {
      setTiempo(calcularTiempo())
    }, 1000)
    return () => clearInterval(interval)
  }, [fechaInicio])

  return tiempo
}

function UrlAcreditacion({ evento }) {
  const [copiado, setCopiado] = useState(false)
  const url = `${import.meta.env.VITE_API_URL_FRONT ?? 'http://localhost:5173'}/acreditar/${evento.codigo}`

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Link de acreditación
      </p>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
        <p className="flex-1 truncate text-sm text-foreground">{url}</p>
        <button
          type="button"
          onClick={copiar}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Copiar URL"
        >
          {copiado
            ? <Check className="h-4 w-4 text-success" />
            : <Copy className="h-4 w-4" />
          }
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Compartí este link con los acreditadores el día del evento. No requiere cuenta en la plataforma.
      </p>
    </div>
  )
}

function EstadoInformativo({ evento }) {
  const tiempo = useCuentaRegresiva(evento.fecha_inicio)

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
        <CalendarRange className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">
          La acreditación todavía no está disponible
        </p>
        {tiempo ? (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground mb-1">Se habilita en</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{tiempo}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              ({new Intl.DateTimeFormat('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(new Date(new Date(evento.fecha_inicio).getTime() - 2 * 60 * 60 * 1000))})
            </p>
          </div>
        ) : null}
      </div>

      <UrlAcreditacion evento={evento} />

      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          ¿Cómo funciona la acreditación?
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {PASOS_ACREDITACION.map((paso) => (
            <div key={paso.numero} className="flex gap-3 rounded-lg border border-border p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {paso.numero}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{paso.titulo}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{paso.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TabAcreditacion({ evento }) {
  const [participantes, setParticipantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const DOS_HORAS_MS = 2 * 60 * 60 * 1000
  const eventoActivo = new Date() >= new Date(new Date(evento.fecha_inicio).getTime() - DOS_HORAS_MS)

  useEffect(() => {
    if (!evento || !eventoActivo) return
    setIsLoading(true)
    getParticipantes(evento.id, evento)
      .then(setParticipantes)
      .finally(() => setIsLoading(false))
  }, [evento, eventoActivo])

  if (!eventoActivo) return <EstadoInformativo evento={evento} />

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const camposForm = evento.camposForm ?? []
  const tieneCosto = parseFloat(evento?.costo ?? 0) > 0
  const tieneGrupos = evento?.tiene_grupos ?? false

  const acreditados = participantes.filter((p) => p.acreditado)
  const sinAcreditar = participantes.filter((p) => !p.acreditado)

  const columnasAcreditados = buildAcreditacionColumns({
    camposForm,
    tieneCosto,
    tieneGrupos,
    mostrarAcreditado: false,
  })

  const columnasSinAcreditar = buildAcreditacionColumns({
    camposForm,
    tieneCosto,
    tieneGrupos,
    mostrarAcreditado: false,
  })

  const columnasTodos = buildAcreditacionColumns({
    camposForm,
    tieneCosto,
    tieneGrupos,
    mostrarAcreditado: true,
    acreditadoOculto: true,
  })

  return (
    <div className="space-y-4">
      <ProgressCard acreditados={acreditados.length} total={participantes.length} />

      <Tabs defaultValue="acreditados">
        <TabsList>
          <TabsTrigger value="acreditados">
            Acreditados ({acreditados.length})
          </TabsTrigger>
          <TabsTrigger value="sin_acreditar">
            Sin acreditar ({sinAcreditar.length})
          </TabsTrigger>
          <TabsTrigger value="todos">
            Todos ({participantes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="acreditados" className="mt-4">
          <AcreditacionDataTable
            columns={columnasAcreditados}
            data={acreditados}
            evento={evento}
            camposForm={camposForm}
            mostrarFiltrosCompletos
          />
        </TabsContent>

        <TabsContent value="sin_acreditar" className="mt-4">
          <AcreditacionDataTable
            columns={columnasSinAcreditar}
            data={sinAcreditar}
            evento={evento}
            camposForm={camposForm}
            mostrarFiltrosCompletos={false}
          />
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <AcreditacionDataTable
            columns={columnasTodos}
            data={participantes}
            evento={evento}
            camposForm={camposForm}
            mostrarFiltrosCompletos={false}
            initialColumnVisibility={{ acreditado: false }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}