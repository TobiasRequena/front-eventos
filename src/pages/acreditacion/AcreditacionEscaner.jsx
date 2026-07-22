import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { io } from 'socket.io-client'
import { LogOut, ScanLine, Users, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { escanearQr } from '@/api/acreditacion.api'
import { AcreditacionResultado } from '@/pages/acreditacion/AcreditacionResultado'

const SOCKET_URL = 'http://localhost:3001'

export function AcreditacionEscaner({ evento, sesion, onCerrarSesion }) {
  const [resultado, setResultado] = useState(null)
  const [escaneando, setEscaneando] = useState(false)
  const [totalAcreditados, setTotalAcreditados] = useState(0)
  const [ultimoCheckin, setUltimoCheckin] = useState(null)

  const scannerRef = useRef(null)
  const procesandoRef = useRef(false)
  const mountedRef = useRef(false)

  // Socket.IO — una sola conexión durante toda la vida del componente
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.emit('unirse_evento', evento.id)
    socket.on('checkin:nuevo', (data) => {
      setTotalAcreditados(data.totalAcreditados)
      setUltimoCheckin(data)
    })
    return () => socket.disconnect()
  }, [evento.id])

  // Scanner — una sola instancia, nunca se destruye
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (qrText) => {
        if (procesandoRef.current) return
        procesandoRef.current = true

        try {
          await scanner.pause(true) // pausa sin detener
          setEscaneando(false)
          const data = await escanearQr({ qr: qrText, eventoId: evento.id })
          setResultado(data)
        } catch (err) {
          procesandoRef.current = false
          const status = err?.response?.status
          if (status === 404) toast.error('QR no válido para este evento.')
          else toast.error('Error al leer el QR.')
          scanner.resume()
          setEscaneando(true)
        }
      },
      () => { }
    )
      .then(() => setEscaneando(true))
      .catch(() => toast.error('No pudimos acceder a la cámara.'))

    return () => {
      try {
        const state = scanner.getState()
        if (state === 2 || state === 3) scanner.stop().catch(() => { })
        scanner.clear()
      } catch { }
    }
  }, [])

  function handleVolver() {
    procesandoRef.current = false
    setResultado(null)
    // Reanudar el scanner pausado
    try {
      scannerRef.current?.resume()
      setEscaneando(true)
    } catch { }
  }

  function handleCerrarSesion() {
    try {
      const state = scannerRef.current?.getState()
      if (state === 2 || state === 3) {
        scannerRef.current?.stop().catch(() => { })
      }
      scannerRef.current?.clear()
    } catch { }
    onCerrarSesion()
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-xs text-muted-foreground">Acreditando en</p>
          <p className="text-sm font-medium text-foreground">{evento.nombre}</p>
        </div>
        <div className="flex items-center gap-3">
          {totalAcreditados > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {totalAcreditados} acreditados
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleCerrarSesion} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Salir
          </Button>
        </div>
      </header>

      {/* El div del scanner siempre está en el DOM — solo se oculta */}
      <div
        className={resultado ? 'hidden' : 'flex flex-1 flex-col items-center justify-center gap-6 p-6'}
      >
        <div className="text-center">
          <ScanLine className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Apuntá la cámara al QR del participante
          </p>
          <p className="text-xs text-muted-foreground">
            {sesion.nombre} {sesion.apellido}
          </p>
        </div>

        {escaneando && (
          <p className="text-xs text-muted-foreground animate-pulse">
            Cámara activa — apuntá al QR
          </p>
        )}

        <div
          id="qr-reader"
          className="w-full max-w-sm overflow-hidden rounded-xl border border-border"
          style={{ minHeight: '300px' }}
        />

        {ultimoCheckin && (
          <Card className="w-full max-w-sm">
            <CardContent className="flex items-center gap-3 py-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {ultimoCheckin.tipo === 'grupal'
                    ? `Grupo de ${ultimoCheckin.cantidad} acreditado`
                    : `${ultimoCheckin.nombre} ${ultimoCheckin.apellido}`}
                </p>
                <p className="text-xs text-muted-foreground">Último check-in</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {resultado && (
        <AcreditacionResultado
          resultado={resultado}
          sesion={sesion}
          evento={evento}
          onVolver={handleVolver}
        />
      )}
    </div>
  )
}