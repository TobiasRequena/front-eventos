import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({ texto }) {
  const [copiado, setCopiado] = useState(false)
  function copiar() {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <button
      type="button"
      onClick={copiar}
      aria-label="Copiar"
      className="ml-1.5 shrink-0 text-muted-foreground hover:text-foreground"
    >
      {copiado ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
