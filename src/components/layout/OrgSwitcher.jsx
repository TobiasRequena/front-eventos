import { Building2, ChevronsUpDown, Check, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
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

export function OrgSwitcher() {
  const { organizaciones, orgActiva, cambiarOrgActiva } = useAuth()

  if (!orgActiva) return null

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" tooltip={orgActiva.nombre}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="truncate font-medium">{orgActiva.nombre}</span>
              <ChevronsUpDown className="ml-auto h-3.5 w-3.5 text-sidebar-foreground/50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>Tus organizaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizaciones.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => cambiarOrgActiva(org.id)}
                className="justify-between"
              >
                <span className="truncate">{org.nombre}</span>
                {org.id === orgActiva.id && <Check className="h-4 w-4" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <Plus className="h-4 w-4" />
              Crear organización
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}