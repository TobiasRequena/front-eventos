import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Error no controlado:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
          <h1 className="text-lg font-semibold">Ocurrió un error</h1>
          <p className="text-sm text-muted-foreground">
            Recargá la página. Si el problema persiste, contactanos.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
