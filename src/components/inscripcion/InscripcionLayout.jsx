import { CalendarRange } from 'lucide-react'

export function InscripcionLayout({ children }) {
  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {children}
      </div>
    </div>
  )
}