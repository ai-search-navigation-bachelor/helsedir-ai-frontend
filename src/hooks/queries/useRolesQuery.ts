/**
 * TanStack Query hook for the list of available health-professional roles.
 * The list is static (roles don't change at runtime) so staleTime is Infinity.
 */
import { useQuery } from '@tanstack/react-query'
import { fetchRoles } from '../../api/roles'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: ({ signal }) => fetchRoles(signal),
    staleTime: Infinity,
  })
}
