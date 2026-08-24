import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function HelpTooltip({ children, className }) {
  const [open, setOpen] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onClick={() => setOpen((v) => !v)}
        >
          <HelpCircle
            className={`h-3.5 w-3.5 cursor-help text-muted-foreground ${className ?? ''}`}
          />
        </TooltipTrigger>

        <TooltipContent
          className="w-70 text-justify"
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}