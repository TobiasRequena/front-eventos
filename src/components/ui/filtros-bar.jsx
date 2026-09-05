import { Loader2, Settings2, SlidersHorizontal } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/search-input'
import { RemovableBadge } from '@/components/ui/removable-badge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

/**
 * Layout de una barra de filtros: buscador + selects (colapsados en un Sheet
 * en mobile) + Columnas + Acciones, con las chips de filtro activo debajo.
 * No maneja estado propio, todo llega calculado desde el componente que la usa.
 */
export function FiltrosBar({
  busqueda,
  onBusquedaChange,
  busquedaPlaceholder = 'Buscar...',
  selects = [],
  filtrosActivos = [],
  onLimpiarTodo,
  columnas,
  acciones = [],
}) {
  const countFiltrosSelect = filtrosActivos.filter((f) => f.key !== '__busqueda').length

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-48">
            <Label className="text-xs text-muted-foreground">Buscar</Label>
            <SearchInput
              placeholder={busquedaPlaceholder}
              value={busqueda}
              onChange={onBusquedaChange}
            />
          </div>

          <div className="hidden sm:flex sm:flex-wrap sm:items-end sm:gap-3">
            {selects}
          </div>

          {selects.length > 0 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 sm:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {countFiltrosSelect > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1">
                      {countFiltrosSelect}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[80vh] gap-2 overflow-y-auto">
                <SheetHeader className="pb-0">
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-3 px-4">
                  {selects}
                </div>
                <SheetFooter className="pt-2">
                  <Button variant="outline" onClick={onLimpiarTodo} disabled={filtrosActivos.length === 0}>
                    Limpiar filtros
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}

          {columnas && columnas.items.length > 0 && (
            <div className="flex flex-1 flex-col gap-1.5 sm:flex-none">
              <Label className="text-xs text-muted-foreground">Columnas</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 sm:w-auto">
                    <Settings2 className="h-4 w-4" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {columnas.items.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => columnas.onToggle(column, value)}
                    >
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {acciones.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Acciones</Label>
              <div className="flex items-center gap-2">
                {acciones.map((accion) => (
                  <TooltipProvider key={accion.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={accion.onClick}
                          disabled={accion.disabled}
                          className={accion.className}
                        >
                          {accion.loading
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <accion.icon className={cn('h-4 w-4', accion.spinning && 'animate-spin')} />
                          }
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{accion.tooltip}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>

        {filtrosActivos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filtrosActivos.map((filtro) => (
              <RemovableBadge key={filtro.key} onRemove={filtro.onClear}>
                {filtro.label}
              </RemovableBadge>
            ))}
            <button
              type="button"
              onClick={onLimpiarTodo}
              className="text-xs text-primary underline-offset-4 hover:underline cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
