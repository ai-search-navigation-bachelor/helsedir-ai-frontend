export interface CategorySearchResult {
  id: string
  title: string
  info_type: string
  score: number
  explanation?: string
}

export interface CategorySearchResponse {
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

export interface CategorySearchOptions {
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
  
  // Default to production endpoint
  return 'http://129.241.150.141:8000/search/category'
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
  
  const url = new URL(endpoint)
  
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
      throw new Error(`Category search failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<CategorySearchResponse>
    }

    throw new Error('Category search failed: expected JSON response')
  } catch (error) {
    console.error('Category search error:', error)
    throw error
  }
}
