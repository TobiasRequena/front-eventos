import { useState } from 'react'
import { toast } from 'sonner'
import { FileText, Upload, Loader2 } from 'lucide-react'
import { subirTemplateAutorizacion } from '@/api/archivos.api'
import { cn } from '@/lib/utils'

export function TemplateAutorizacionUploader({ eventoId, urlActual, onSubido, disabled, archivoTemplateRef }) {
  const [subiendo, setSubiendo] = useState(false)
  const [nombreArchivo, setNombreArchivo] = useState(null)

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setNombreArchivo(archivo.name)

    if (!eventoId) {
      // Guardar para subir después
      if (archivoTemplateRef) archivoTemplateRef.current = archivo
      onSubido('__pendiente__')
      return
    }

    setSubiendo(true)
    try {
      const data = await subirTemplateAutorizacion(eventoId, archivo)
      onSubido(data.url)
      toast.success('Template subido.')
    } catch {
      toast.error('No pudimos subir el template.')
    } finally {
      setSubiendo(false)
    }
  }

  if (urlActual === '__pendiente__') {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          {nombreArchivo ?? 'Template seleccionado'}
        </span>
        <label className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline">
          Cambiar
          <input type="file" accept=".pdf" className="hidden" onChange={handleArchivo} />
        </label>
      </div>
    )
  }

  if (urlActual) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={urlActual}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
        >
          <FileText className="h-3.5 w-3.5" />
          Ver template
        </a>
        <label className={cn(
          'cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:underline',
          disabled && 'pointer-events-none opacity-50'
        )}>
          Cambiar
          <input type="file" accept=".pdf" className="hidden" onChange={handleArchivo} disabled={disabled || subiendo} />
        </label>
      </div>
    )
  }

  return (
    <label className={cn(
      'flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground shrink-0',
      disabled
        ? 'cursor-not-allowed opacity-50'
        : 'cursor-pointer hover:bg-accent/50'
    )}>
      {subiendo
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <Upload className="h-3.5 w-3.5" />
      }
      Subir template PDF
      <input type="file" accept=".pdf" className="hidden" onChange={handleArchivo} disabled={disabled || subiendo} />
    </label>
  )
}