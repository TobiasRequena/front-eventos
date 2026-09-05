import React from 'react'
import { Link } from 'react-router-dom'
import { useBreadcrumbContext } from '@/contexts/BreadcrumbContext'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function AppBreadcrumb() {
  const { items } = useBreadcrumbContext()

  if (!items.length) return null

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const esUltimo = index === items.length - 1

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <BreadcrumbItem>
                {esUltimo || !item.to ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!esUltimo && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}