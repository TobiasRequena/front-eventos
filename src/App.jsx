import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from '@/routes/AppRouter'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  )
}

export default App