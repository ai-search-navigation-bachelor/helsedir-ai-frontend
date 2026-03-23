import { useQuery } from '@tanstack/react-query'
import { fetchRoleTags } from '../../api/roleTags'

export function useRoleTagsQuery() {
  return useQuery({
    queryKey: ['role-tags'],
    queryFn: ({ signal }) => fetchRoleTags(signal),
    staleTime: 5 * 60 * 1000,
  })
}
