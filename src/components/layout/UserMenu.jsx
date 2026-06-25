import { ChevronsUpDown, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function obtenerIniciales(nombre, apellido) {
  return `${nombre?.[0] ?? ''}${apellido?.[0] ?? ''}`.toUpperCase()
}

export function UserMenu() {
  const { usuario, logout } = useAuth()

  if (!usuario) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={`${usuario.nombre} ${usuario.apellido}`}>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
                  {obtenerIniciales(usuario.nombre, usuario.apellido)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">
                  {usuario.nombre} {usuario.apellido}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/50">
                  {usuario.email}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-medium text-foreground">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="truncate text-xs text-muted-foreground">{usuario.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Settings className="h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}