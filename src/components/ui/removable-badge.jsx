import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function RemovableBadge({ children, onRemove, variant = 'secondary', className }) {
  return (
    <Badge variant={variant} className={cn('gap-1.5 pr-1', className)}>
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 hover:text-destructive"
      >
        <X className="h-3 w-3 cursor-pointer" />
      </button>
    </Badge>
  )
}
