import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { iconMap } from '@/lib/icon-map'
import navigationData from '@/lib/navigation.json'
import { OrgSwitcher } from '@/components/layout/OrgSwitcher'
import { UserMenu } from '@/components/layout/UserMenu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

function NavEntry({ item }) {
  const location = useLocation()
  const Icon = iconMap[item.icon]
  const tieneSubmenu = Array.isArray(item.children) && item.children.length > 0

  const estaActivo =
    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)

  if (tieneSubmenu) {
    return (
      <Collapsible defaultOpen={estaActivo} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton isActive={estaActivo} tooltip={item.label}>
              {Icon && <Icon />}
              <span>{item.label}</span>
              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.id}>
                  <SidebarMenuSubButton asChild isActive={location.pathname === child.to}>
                    <NavLink to={child.to}>{child.label}</NavLink>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={estaActivo} tooltip={item.label}>
        <NavLink to={item.to}>
          {Icon && <Icon />}
          <span>{item.label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.map((item) => (
                <NavEntry key={item.id} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <UserMenu />
      </SidebarFooter>
    </Sidebar>
  )
}

export { useSidebar }