export type SearchResultItem = {
  url: string
  id: string
  tittel: string
  tekst?: string | null
  infoId?: string
  infoType?: string
  koder?: string | null
  maalgruppe?: unknown[]
}

export type SearchApiResult = {
  results: SearchResultItem[]
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
}

function getSearchEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_SEARCH_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) return envEndpoint
  return 'https://helsedir-ai-backend.onrender.com/helsedir/search'
}

export async function searchApi(
  query: string,
  { signal }: SearchApiOptions = {},
): Promise<SearchApiResult> {
  const trimmed = query.trim()
  if (!trimmed) return { results: [] }

  const endpoint = getSearchEndpoint()

  const url = endpoint.startsWith('http')
    ? new URL(endpoint)
    : new URL(endpoint, window.location.origin)
  url.searchParams.set('QueryText', trimmed)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json() as Promise<SearchApiResult>
  }

  throw new Error('Search failed: expected JSON response')
}

function getInfobitEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_INFOBIT_ENDPOINT as string | undefined
  if (envEndpoint && envEndpoint.trim().length > 0) return envEndpoint
  return 'https://helsedir-ai-backend.onrender.com/helsedir/infobit'
}

export async function getInfobitApi(
  infobitId: string,
  { signal, depth = 2 }: SearchApiOptions = {},
): Promise<InfoResultItem> {
  const trimmed = infobitId.trim()
  if (!trimmed) throw new Error('Infobit ID is required')

  const endpoint = getInfobitEndpoint()
  
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
