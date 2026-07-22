export function AuthLayout({ title, description, children }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Panel izquierdo: placeholder, sin contenido todavía */}
      <div className="hidden bg-muted lg:block" />

      {/* Panel derecho: formulario */}
      <div className="flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <img
              src="../../../talita.png"
              alt="Logo"
              className="mx-auto h-40 w-auto object-contain"
            />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}