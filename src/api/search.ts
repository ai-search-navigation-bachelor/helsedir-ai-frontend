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

export type SearchApiOptions = {
  signal?: AbortSignal
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
