import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { sincronizarBorrador } from '@/lib/borradorEvento'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { AppBreadcrumb } from '@/components/layout/AppBreadcrumb'
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AsistenteEventoWidget } from '@/components/asistente/AsistenteEventoWidget'

export function AppLayout() {
  // Al entrar al sistema: el borrador armado sin sesión pasa a ser del usuario, o se trae el que tenga guardado
  useEffect(() => {
    sincronizarBorrador().catch(() => {})
  }, [])

  return (
    <BreadcrumbProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <AppBreadcrumb />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Outlet />
          </main>
        </SidebarInset>
        <AsistenteEventoWidget modo="interno" />
      </SidebarProvider>
    </BreadcrumbProvider>
  )
}