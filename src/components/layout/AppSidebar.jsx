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
          <div className="flex items-center">
            <SidebarMenuButton
              asChild
              isActive={estaActivo}
              className="flex-1"
            >
              <NavLink to={item.to}>
                {Icon && <Icon />}
                <span>{item.label}</span>
              </NavLink>
            </SidebarMenuButton>

            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-sidebar-accent"
              >
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <SidebarMenuSub>
              {item.children.map((child) => {
                const ChildIcon = iconMap[child.icon]

                return (
                  <SidebarMenuSubItem key={child.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={location.pathname === child.to}
                    >
                      <NavLink to={child.to}>
                        {ChildIcon && <ChildIcon />}
                        <span>{child.label}</span>
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              })}
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