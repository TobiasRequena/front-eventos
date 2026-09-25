import { IconoInstagram } from './IconoInstagram'
import { INSTAGRAM } from './datosLanding'

export function PieLanding() {
  return (
    <footer className="flex flex-col items-center gap-3 border-t border-border px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between md:px-14 lg:px-20">
      <p>© {new Date().getFullYear()} Talita Software</p>
      <a
        href={`https://instagram.com/${INSTAGRAM}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:text-foreground"
      >
        <IconoInstagram className="size-4" />
        @{INSTAGRAM}
      </a>
    </footer>
  )
}
