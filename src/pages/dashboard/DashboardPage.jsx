import { useAuth } from '@/contexts/AuthContext'
import { useBreadcrumb } from '@/hooks/useBreadcrumb'

export default function DashboardPage() {
    const { usuario, orgActiva, logout } = useAuth()
    useBreadcrumb([{ label: 'Eventos' }])

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
            <div>
                <h1 className="text-xl font-semibold text-foreground">
                    Hola, {usuario?.nombre}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Organización activa: {orgActiva?.nombre ?? '—'}
                </p>
            </div>
            <button
                onClick={logout}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
                Cerrar sesión
            </button>
        </div>
    )
}