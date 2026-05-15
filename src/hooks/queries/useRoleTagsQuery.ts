/**
 * TanStack Query hook for role-tag assignments across all documents.
 * Used by the TagsPage to display documents grouped by health-professional role.
 */
import { useQuery } from '@tanstack/react-query'
import { fetchRoleTags } from '../../api/roleTags'

export function useRoleTagsQuery() {
  return useQuery({
    queryKey: ['role-tags'],
    queryFn: ({ signal }) => fetchRoleTags(undefined, signal),
    staleTime: 5 * 60 * 1000,
  })
}
