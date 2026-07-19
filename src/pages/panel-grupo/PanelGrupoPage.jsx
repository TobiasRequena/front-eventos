import { useParams } from 'react-router-dom'
import { usePanelGrupo } from '@/hooks/usePanelGrupo'
import { PanelGrupoLogin } from '@/pages/panel-grupo/PanelGrupoLogin'
import { PanelGrupoPanel } from '@/pages/panel-grupo/PanelGrupoPanel'

export default function PanelGrupoPage() {
  const { codigoGrupo } = useParams()
  const panelGrupo = usePanelGrupo()

  if (!panelGrupo.isAuthenticated) {
    return (
      <PanelGrupoLogin
        codigoGrupo={codigoGrupo}
        onLogin={panelGrupo.login}
        isLoading={panelGrupo.isLoading}
        error={panelGrupo.error}
      />
    )
  }

  return (
    <PanelGrupoPanel
      sesion={panelGrupo.sesion}
      onLogout={panelGrupo.logout}
    />
  )
}