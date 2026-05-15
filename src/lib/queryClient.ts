/**
 * Shared TanStack Query client.
 * Global defaults: 30-minute staleTime, 1-hour gcTime, single retry, no refetch on window focus.
 * Individual query hooks override these where tighter or looser caching is appropriate.
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 60 * 1000, // 30 minutes
      gcTime: 60 * 60 * 1000, // 1 hour
    },
  },
})
