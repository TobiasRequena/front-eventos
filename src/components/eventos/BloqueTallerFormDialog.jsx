import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

const VALORES_VACIOS = { nombre: '', cantidadElegible: 1, esObligatorio: true }

function textoAyuda({ cantidadElegible, esObligatorio }) {
  const cantidad = cantidadElegible || 1

  if (cantidad === 1) {
    return esObligatorio
      ? 'El participante deberá elegir exactamente 1 taller de este bloque.'
      : 'El participante podrá elegir hasta 1 taller de este bloque (opcional).'
  }

  return esObligatorio
    ? `El participante deberá elegir exactamente ${cantidad} talleres de este bloque.`
    : `El participante podrá elegir hasta ${cantidad} talleres de este bloque (opcional).`
}

/**
 * @param {boolean} open
 * @param {(open: boolean) => void} onOpenChange
 * @param {object | null} valoresIniciales - null = modo "crear", objeto = modo "editar"
 * @param {(valores: { nombre, cantidadElegible, esObligatorio }) => void} onConfirmar
 */
export function BloqueTallerFormDialog({ open, onOpenChange, valoresIniciales, onConfirmar }) {
  const [valores, setValores] = useState(VALORES_VACIOS)

  useEffect(() => {
    if (open) {
      setValores(valoresIniciales ?? VALORES_VACIOS)
    }
  }, [open, valoresIniciales])

  function handleConfirmar() {
    if (!valores.nombre.trim()) return
    onConfirmar(valores)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{valoresIniciales ? 'Editar bloque' : 'Nuevo bloque de talleres'}</DialogTitle>
          <DialogDescription>
            Un bloque agrupa talleres que comparten una regla de selección, ej. "Franja 10am".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nombre del bloque</Label>
            <Input
              value={valores.nombre}
              onChange={(e) => setValores((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej. Franja 10am"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Cantidad a elegir</Label>
              <Input
                type="number"
                min="1"
                value={valores.cantidadElegible}
                onChange={(e) =>
                  setValores((prev) => ({
                    ...prev,
                    cantidadElegible: e.target.valueAsNumber || 1,
                  }))
                }
              />
            </div>
            <div className="flex flex-col justify-end gap-1.5 pb-1.5 pt-4">
              <Label className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                <span className="text-sm">Obligatorio</span>
                <Switch
                  checked={valores.esObligatorio}
                  onCheckedChange={(checked) =>
                    setValores((prev) => ({ ...prev, esObligatorio: checked }))
                  }
                />
              </Label>
            </div>
          </div>

          <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            {textoAyuda(valores)}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar} disabled={!valores.nombre.trim()}>
            {valoresIniciales ? 'Guardar cambios' : 'Crear bloque'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}