/**
 * TanStack Query hook for the available content info-type identifiers.
 * Used by the developer tools to populate info-type filter dropdowns.
 */
import { useQuery } from '@tanstack/react-query'
import { fetchInfoTypes } from '../../api/infoTypes'

export function useInfoTypesQuery() {
  return useQuery({
    queryKey: ['info-types'],
    queryFn: ({ signal }) => fetchInfoTypes(signal),
    staleTime: 5 * 60 * 1000,
  })
}
