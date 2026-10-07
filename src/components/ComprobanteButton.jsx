import { useState } from 'react'
import { FileText, ExternalLink, X } from 'lucide-react'
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer'

export function ArchivoButton({ url, label, titulo }) {
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  const esPdf = url?.toLowerCase().includes('.pdf') || url?.toLowerCase().includes('application/pdf')

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerAbierto(true)}
        className="flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
      >
        <FileText className="h-4 w-4" />
        {label}
      </button>

      <Drawer open={drawerAbierto} onOpenChange={setDrawerAbierto} direction="right">
        <DrawerContent className="ml-auto h-full w-full max-w-lg rounded-l-xl rounded-r-none">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-base font-semibold text-foreground">{titulo ?? label}</h2>
            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <DrawerClose asChild>
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                  <X className="h-4 w-4" />
                </button>
              </DrawerClose>
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-5">
            {esPdf ? (
              <iframe src={url} className="h-full w-full rounded-md border border-border" title={titulo ?? label} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <img src={url} alt={titulo ?? label} className="max-h-full max-w-full rounded-md object-contain" />
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer >
    </>
  )
}