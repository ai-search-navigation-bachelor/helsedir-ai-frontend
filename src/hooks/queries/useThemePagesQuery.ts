import { useQuery } from '@tanstack/react-query'
import { getThemePages } from '../../api'
import type { ThemePagesResponse } from '../../api'

type UseThemePagesQueryOptions = {
  enabled?: boolean
}

export function useThemePagesQuery(
  category?: string,
  options?: UseThemePagesQueryOptions,
) {
  const normalizedCategory = category?.trim().toLowerCase() || undefined

  return useQuery<ThemePagesResponse, Error>({
    queryKey: ['theme-pages', normalizedCategory ?? 'all'],
    queryFn: ({ signal }) => getThemePages({ signal, category: normalizedCategory }),
    enabled: options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}
