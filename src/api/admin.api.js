import { httpClient } from '@/api/httpClient'

export async function getAdminStats({ desde, hasta }) {
  const { data } = await httpClient.get('/admin/stats', {
    params: { desde, hasta },
  })
  return data
}