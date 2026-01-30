export type CategoryResult = {
  id: string
  title: string
  info_type: string
  score: number
  explanation?: string
}

export type CategoryGroup = {
  category: string
  display_name: string
  count: number
  is_priority: boolean
  results: CategoryResult[]
}

export type CategorizedSearchResponse = {
  query: string
  total: number
  min_score: number
  search_id: string
  priority_categories: CategoryGroup[]
  other_categories: CategoryGroup[]
}

export type CategorizedSearchOptions = {
  signal?: AbortSignal
  role?: string
}

function getCategorizedSearchEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_CATEGORIZED_SEARCH_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) return envEndpoint
  
  return 'http://129.241.150.141:8000/search/categorized'
}

export async function searchCategorizedApi(
  query: string,
  { signal, role }: CategorizedSearchOptions = {},
): Promise<CategorizedSearchResponse> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      query: trimmed,
      total: 0,
      min_score: 0,
      search_id: '',
      priority_categories: [],
      other_categories: [],
    }
  }

  const endpoint = getCategorizedSearchEndpoint()
  
  const url = endpoint.startsWith('http')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin)
  
  url.searchParams.set('query', trimmed)
  if (role) {
    url.searchParams.set('role', role)
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    })

    if (!response.ok) {
      // If main backend fails, try localhost fallback
      if (endpoint.includes('129.241.150.141')) {
        return searchCategorizedApiFallback(query, { signal, role })
      }
      throw new Error(`Categorized search failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<CategorizedSearchResponse>
    }

    throw new Error('Categorized search failed: expected JSON response')
  } catch (error) {
    // If main backend fails (network error, timeout, etc.), try localhost fallback
    if (endpoint.includes('129.241.150.141') && error instanceof Error && !signal?.aborted) {
      console.warn('Main backend failed, falling back to localhost:', error.message)
      return searchCategorizedApiFallback(query, { signal, role })
    }
    throw error
  }
}

async function searchCategorizedApiFallback(
  query: string,
  { signal, role }: CategorizedSearchOptions = {},
): Promise<CategorizedSearchResponse> {
  const localEndpoint = 'http://localhost:8000/search/categorized'
  const url = new URL(localEndpoint)
  
  url.searchParams.set('query', query.trim())
  if (role) {
    url.searchParams.set('role', role)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Categorized search (localhost) failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<CategorizedSearchResponse>
  }

  throw new Error('Categorized search (localhost) failed: expected JSON response')
}
