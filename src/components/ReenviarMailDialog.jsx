import { useState } from 'react'
import { Send } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { reenviarMail } from '@/api/participantes.api'

export function ReenviarMailDialog({ participante }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)

  function handleAbrir() {
    setEmail(participante?.email ?? '')
    setOpen(true)
  }

  async function handleConfirmar() {
    setEnviando(true)
    try {
      const emailFinal = email.trim() !== participante?.email ? email.trim() : undefined
      await reenviarMail(participante.id, emailFinal)
      toast.success('Mail reenviado correctamente.')
      setOpen(false)
    } catch {
      toast.error('No pudimos reenviar el mail.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleAbrir}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Send className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Reenviar QR por mail</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={(v) => !v && setOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reenviar QR por mail</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Confirmá o modificá el email antes de reenviar el QR de{' '}
              <span className="font-medium text-foreground">
                {participante?.nombre} {participante?.apellido}
              </span>.
            </p>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ejemplo.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={enviando}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmar} disabled={enviando || !email.trim()}>
              {enviando ? 'Enviando...' : 'Reenviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}