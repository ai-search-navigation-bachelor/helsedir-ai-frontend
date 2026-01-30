export type SearchResultItem = {
  id: string
  title: string
  info_type: string
  score: number
  explanation?: string
}

export type SearchApiResult = {
  results: SearchResultItem[]
  query: string
  total: number
  offset: number
  limit: number
  search_id: string
  has_next: boolean
  has_prev: boolean
}

export type ContentDetail = {
  id: string
  title: string
  body: string
  content_type: string
  target_groups?: string[]
  links?: Array<{
    rel: string
    type: string
    tittel: string
    href: string
    strukturId?: string
  }>
}

export type InfoResultItem = {
  id: string
  tittel: string
  tekst?: string | null
  intro?: string
  infoId?: string
  infoType?: string
  url: string
  forstPublisert?: string
  sistFagligOppdatert?: string
  children?: InfoResultItem[]
}

export type InfoSearchApiResult = {
  results: InfoResultItem[]
}

export type SearchApiOptions = {
  signal?: AbortSignal
  depth?: number
  offset?: number
  limit?: number
  role?: string
  search_id?: string
}

function getSearchEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_SEARCH_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) return envEndpoint
  return 'http://129.241.150.141:8000/search'
}

export async function searchApi(
  query: string,
  { signal, offset = 0, limit = 10, role, search_id }: SearchApiOptions = {},
): Promise<SearchApiResult> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      results: [],
      query: '',
      total: 0,
      offset: 0,
      limit: 10,
      search_id: '',
      has_next: false,
      has_prev: false,
    }
  }

  const endpoint = getSearchEndpoint()

  const url = endpoint.startsWith('http')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin)
  
  url.searchParams.set('query', trimmed)
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  if (role) url.searchParams.set('role', role)
  if (search_id) url.searchParams.set('search_id', search_id)

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
        return searchApiFallback(query, { signal, offset, limit, role, search_id })
      }
      throw new Error(`Search failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<SearchApiResult>
    }

    throw new Error('Search failed: expected JSON response')
  } catch (error) {
    // If main backend fails (network error, timeout, etc.), try localhost fallback
    if (endpoint.includes('129.241.150.141') && error instanceof Error && !signal?.aborted) {
      console.warn('Main backend failed, falling back to localhost:', error.message)
      return searchApiFallback(query, { signal, offset, limit, role, search_id })
    }
    throw error
  }
}

async function searchApiFallback(
  query: string,
  { signal, offset = 0, limit = 10, role, search_id }: SearchApiOptions = {},
): Promise<SearchApiResult> {
  const localEndpoint = 'http://localhost:8000/search'
  const url = new URL(localEndpoint)
  
  url.searchParams.set('query', query.trim())
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  if (role) url.searchParams.set('role', role)
  if (search_id) url.searchParams.set('search_id', search_id)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Search (localhost) failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<SearchApiResult>
  }

  throw new Error('Search (localhost) failed: expected JSON response')
}

function getContentEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_CONTENT_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) return envEndpoint
  return 'http://129.241.150.141:8000/content'
}

export async function getContentApi(
  contentId: string,
  searchId?: string,
  { signal }: SearchApiOptions = {},
): Promise<ContentDetail> {
  const trimmed = contentId.trim()
  if (!trimmed) throw new Error('Content ID is required')

  const endpoint = getContentEndpoint()
  
  const url = endpoint.startsWith('http')
    ? new URL(`${endpoint}/${encodeURIComponent(trimmed)}`)
    : new URL(`${endpoint}/${encodeURIComponent(trimmed)}`, window.location.origin)
  
  if (searchId) {
    url.searchParams.set('search_id', searchId)
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
        return getContentApiFallback(contentId, searchId, { signal })
      }
      throw new Error(`Content fetch failed: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      return response.json() as Promise<ContentDetail>
    }

    throw new Error('Content fetch failed: expected JSON response')
  } catch (error) {
    // If main backend fails (network error, timeout, etc.), try localhost fallback
    if (endpoint.includes('129.241.150.141') && error instanceof Error && !signal?.aborted) {
      console.warn('Main backend failed, falling back to localhost:', error.message)
      return getContentApiFallback(contentId, searchId, { signal })
    }
    throw error
  }
}

async function getContentApiFallback(
  contentId: string,
  searchId?: string,
  { signal }: SearchApiOptions = {},
): Promise<ContentDetail> {
  const localEndpoint = 'http://localhost:8000/content'
  const url = new URL(`${localEndpoint}/${encodeURIComponent(contentId)}`)
  
  if (searchId) {
    url.searchParams.set('search_id', searchId)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Content fetch (localhost) failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<ContentDetail>
  }

  throw new Error('Content fetch (localhost) failed: expected JSON response')
}

// Deprecated: Use getContentApi instead
export async function getInfobitApi(
  infobitId: string,
  { signal, depth = 2 }: SearchApiOptions = {},
): Promise<InfoResultItem> {
  const trimmed = infobitId.trim()
  if (!trimmed) throw new Error('Infobit ID is required')

  // Legacy endpoint for backwards compatibility
  const endpoint = 'http://129.241.150.141:8000/helsedir/infobit'
  
  const url = endpoint.startsWith('http')
    ? new URL(`${endpoint}/${encodeURIComponent(trimmed)}`)
    : new URL(`${endpoint}/${encodeURIComponent(trimmed)}`, window.location.origin)
  url.searchParams.set('include_children', 'true')
  url.searchParams.set('depth', String(depth))

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Infobit fetch failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<InfoResultItem>
  }

  throw new Error('Infobit fetch failed: expected JSON response')
}