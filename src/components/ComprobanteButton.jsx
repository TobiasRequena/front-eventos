import { useState } from 'react'
import { FileText, ExternalLink, Loader2, X } from 'lucide-react'
import { getComprobante } from '@/api/participantes.api'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer'

export function ComprobanteButton({ participanteId }) {
  const [status, setStatus] = useState('idle')
  const [comprobante, setComprobante] = useState(null)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  async function handleClick() {
    if (status === 'success') {
      setDrawerAbierto(true)
      return
    }
    if (status === 'loading') return

    setStatus('loading')
    try {
      const data = await getComprobante(participanteId)
      setComprobante(data)
      setStatus('success')
      setDrawerAbierto(true)
    } catch (err) {
      if (err?.response?.status === 404) {
        setStatus('sin_comprobante')
      } else {
        setStatus('error')
      }
    }
  }

  if (status === 'sin_comprobante') {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no se cargó ningún comprobante.
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="text-sm text-muted-foreground">
        No pudimos cargar el comprobante.{' '}
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Reintentar
        </button>
      </p>
    )
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={status === 'loading'}
        className="gap-2"
      >
        {status === 'loading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {status === 'loading' ? 'Cargando...' : 'Ver comprobante'}
      </Button>

      {comprobante && (
        <Drawer open={drawerAbierto} onOpenChange={setDrawerAbierto} direction="right">
          <DrawerContent className="ml-auto h-full w-full max-w-lg rounded-l-xl rounded-r-none">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Comprobante de pago
                </h2>
                <p className="text-xs text-muted-foreground">
                  {comprobante.nombre_original} ·{' '}
                  {(comprobante.size_bytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={comprobante.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DrawerClose>
              </div>
            </div>

            <div className="flex-1 overflow-hidden p-5">
              {comprobante.mime_type === 'application/pdf' ? (
                <iframe
                  src={comprobante.url}
                  className="h-full w-full rounded-md border border-border"
                  title="Comprobante de pago"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <img
                    src={comprobante.url}
                    alt="Comprobante de pago"
                    className="max-h-full max-w-full rounded-md object-contain"
                  />
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  )
}