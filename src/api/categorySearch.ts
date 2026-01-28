export type CategorySearchResult = {
  id: string
  title: string
  info_type: string
  score: number
  explanation?: string
}

export type CategorySearchResponse = {
  results: CategorySearchResult[]
  query: string
  category: string
  total: number
  offset: number
  limit: number
  search_id: string
  has_next: boolean
  has_prev: boolean
}

export type CategorySearchOptions = {
  signal?: AbortSignal
  role?: string
  search_id: string
}

function getCategorySearchEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_CATEGORIZED_SEARCH_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) {
    // Use the base endpoint and append /category
    return envEndpoint.replace('/search/categorized', '/search/category')
  }
  return 'https://helsedir-ai-backend.onrender.com/search/category'
}

export async function searchCategoryApi(
  query: string,
  category: string,
  { signal, role, search_id }: CategorySearchOptions,
): Promise<CategorySearchResponse> {
  const trimmed = query.trim()
  if (!trimmed || !category || !search_id) {
    throw new Error('Query, category, and search_id are required')
  }

  const endpoint = getCategorySearchEndpoint()
  
  const url = endpoint.startsWith('http')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin)
  
  url.searchParams.set('query', trimmed)
  url.searchParams.set('category', category)
  url.searchParams.set('search_id', search_id)
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
      // If render fails, try localhost fallback
      if (endpoint.includes('onrender.com')) {
        return searchCategoryApiFallback(query, category, { signal, role, search_id })
      }
      throw new Error(`Category search failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<CategorySearchResponse>
    }

    throw new Error('Category search failed: expected JSON response')
  } catch (error) {
    // If render fails (network error, timeout, etc.), try localhost fallback
    if (endpoint.includes('onrender.com') && error instanceof Error && !signal?.aborted) {
      console.warn('Render endpoint failed, falling back to localhost:', error.message)
      return searchCategoryApiFallback(query, category, { signal, role, search_id })
    }
    throw error
  }
}

async function searchCategoryApiFallback(
  query: string,
  category: string,
  { signal, role, search_id }: CategorySearchOptions,
): Promise<CategorySearchResponse> {
  const localEndpoint = 'http://localhost:8000/search/category'
  const url = new URL(localEndpoint)
  
  url.searchParams.set('query', query.trim())
  url.searchParams.set('category', category)
  url.searchParams.set('search_id', search_id)
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
    throw new Error(`Category search (localhost) failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<CategorySearchResponse>
  }

  throw new Error('Category search (localhost) failed: expected JSON response')
}
