import { useQuery } from '@tanstack/react-query'
import { fetchInfoTypes } from '../../api/infoTypes'

export function useInfoTypesQuery() {
  return useQuery({
    queryKey: ['info-types'],
    queryFn: ({ signal }) => fetchInfoTypes(signal),
    staleTime: 5 * 60 * 1000,
  })
}
