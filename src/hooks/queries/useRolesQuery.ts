import { useQuery } from '@tanstack/react-query'
import { fetchRoles } from '../../api/roles'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: ({ signal }) => fetchRoles(signal),
    staleTime: Infinity,
  })
}
