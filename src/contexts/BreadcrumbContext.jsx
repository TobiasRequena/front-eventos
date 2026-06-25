import { createContext, useContext, useMemo, useState } from 'react'

const BreadcrumbContext = createContext(null)

export function BreadcrumbProvider({ children }) {
  const [items, setItems] = useState([])

  const value = useMemo(() => ({ items, setItems }), [items])

  return <BreadcrumbContext.Provider value={value}>{children}</BreadcrumbContext.Provider>
}

export function useBreadcrumbContext() {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error('useBreadcrumbContext debe usarse dentro de <BreadcrumbProvider>')
  }
  return context
}