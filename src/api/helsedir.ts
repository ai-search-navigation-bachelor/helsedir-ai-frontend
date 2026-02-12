/**
 * Helsedirektoratet External API
 * Fetches content directly from helsedirektoratet.no API
 */

const API_KEY = import.meta.env.VITE_HELSEDIR_API_KEY || ''
const HELSEDIR_API_URL_FROM_ENV = import.meta.env.VITE_HELSEDIR_API_URL || ''

const HELSEDIR_ENDPOINT_BY_CONTENT_TYPE: Record<string, string> = {
  anbefaling: 'anbefalinger',
  rad: 'rad',
  'pakkeforlop-anbefaling': 'pakkeforlop-anbefalinger',
}

function removeTrailingInnholdPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]?.toLowerCase()
  if (lastSegment === 'innhold') {
    segments.pop()
  }
  return segments.length > 0 ? `/${segments.join('/')}` : ''
}

function normalizeHelsedirApiBaseUrl(rawValue: string) {
  const trimmed = rawValue.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed)
    parsed.pathname = removeTrailingInnholdPath(parsed.pathname)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    const withoutQueryOrHash = trimmed.split('?')[0].split('#')[0].replace(/\/+$/, '')
    return removeTrailingInnholdPath(withoutQueryOrHash)
  }
}

const HELSEDIR_API_URL = normalizeHelsedirApiBaseUrl(HELSEDIR_API_URL_FROM_ENV)

function buildHelsedirContentByTypeAndIdUrl(endpoint: string, id: string) {
  const path = `innhold/${endpoint}/${encodeURIComponent(id)}`
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(HELSEDIR_API_URL)

  if (hasScheme) {
    return new URL(path, `${HELSEDIR_API_URL}/`).toString()
  }

  const normalizedRelativeBase = HELSEDIR_API_URL.replace(/^\/+|\/+$/g, '')
  const relativePrefix = normalizedRelativeBase ? `/${normalizedRelativeBase}` : ''
  return `${relativePrefix}/${path}`
}

function buildHelsedirContentByIdUrl(id: string) {
  // Helsedirektoratet API uses `/innhold/innhold/{id}` for generic content-by-id.
  // The repeated `innhold` segment is intentional.
  const path = `innhold/innhold/${encodeURIComponent(id)}`
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(HELSEDIR_API_URL)

  if (hasScheme) {
    return new URL(path, `${HELSEDIR_API_URL}/`).toString()
  }

  const normalizedRelativeBase = HELSEDIR_API_URL.replace(/^\/+|\/+$/g, '')
  const relativePrefix = normalizedRelativeBase ? `/${normalizedRelativeBase}` : ''
  return `${relativePrefix}/${path}`
}

/**
 * Response structure from Helsedirektoratet API
 */
export interface HelselinkContent {
  id: string
  tittel: string
  intro?: string
  tekst?: string
  forstPublisert?: string
  sistFagligOppdatert?: string
  type?: string
  lenker?: Array<{
    rel: string
    type?: string
    tittel?: string
    href?: string
    strukturId?: string
  }>
  [key: string]: unknown
}

export interface ChapterWithSubchapters extends HelselinkContent {
  children?: ChapterWithSubchapters[]
}

/**
 * Fetch content from Helsedirektoratet API
 * Uses the href from content links
 */
export async function fetchHelsedirContent(
  href: string,
  signal?: AbortSignal
): Promise<HelselinkContent> {
  const browserOrigin =
    typeof globalThis.location !== 'undefined' && typeof globalThis.location.origin === 'string'
      ? globalThis.location.origin
      : 'http://localhost'
  const url = new URL(href, `${browserOrigin}/`)
  
  // Add API key as header if available
  const headers: HeadersInit = {
    'Accept': 'application/json',
  }
  
  if (API_KEY) {
    headers['Ocp-Apim-Subscription-Key'] = API_KEY
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Helsedirektoratet API feil: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function getHelsedirEndpointByContentType(contentType: string): string | null {
  const normalizedType = contentType.trim().toLowerCase()
  return HELSEDIR_ENDPOINT_BY_CONTENT_TYPE[normalizedType] || null
}

export async function fetchHelsedirContentByTypeAndId(
  contentType: string,
  id: string,
  signal?: AbortSignal,
): Promise<HelselinkContent> {
  if (!HELSEDIR_API_URL) {
    throw new Error(
      'Mangler VITE_HELSEDIR_API_URL i miljøvariabler. Sett base-URL i .env.local (for eksempel demo/prod/qa).',
    )
  }

  const endpoint = getHelsedirEndpointByContentType(contentType)
  if (!endpoint) {
    throw new Error(`Ukjent Helsedirektoratet endpoint for innholdstype: ${contentType}`)
  }

  const href = buildHelsedirContentByTypeAndIdUrl(endpoint, id)
  return fetchHelsedirContent(href, signal)
}

export async function fetchHelsedirContentById(
  id: string,
  signal?: AbortSignal,
): Promise<HelselinkContent> {
  if (!HELSEDIR_API_URL) {
    throw new Error(
      'Mangler VITE_HELSEDIR_API_URL i miljøvariabler. Sett base-URL i .env.local (for eksempel demo/prod/qa).',
    )
  }

  const trimmedId = id.trim()
  if (!trimmedId) {
    throw new Error('Mangler id for henting av innhold fra Helsedirektoratet API.')
  }

  const href = buildHelsedirContentByIdUrl(trimmedId)
  return fetchHelsedirContent(href, signal)
}

/**
 * Fetch multiple content items (for children links)
 */
export async function fetchMultipleHelsedirContent(
  hrefs: string[],
  signal?: AbortSignal
): Promise<HelselinkContent[]> {
  const promises = hrefs.map(href => fetchHelsedirContent(href, signal))
  return Promise.all(promises)
}

/**
 * Fetch chapter with ALL nested subchapters recursively
 * This will fetch children, children of children, etc.
 */
export async function fetchChapterWithSubchapters(
  href: string,
  signal?: AbortSignal,
  depth: number = 0,
  maxDepth: number = 10
): Promise<ChapterWithSubchapters> {
  // Prevent infinite recursion
  if (depth >= maxDepth) {
    return fetchHelsedirContent(href, signal) as Promise<ChapterWithSubchapters>
  }

  const chapter = await fetchHelsedirContent(href, signal)
  
  // Check if chapter has children (subchapters)
  // Handle both 'lenker' (external API) and 'links' (backend API)
  const allLinks = (chapter.lenker || (chapter as Record<string, unknown>).links) as Array<{rel: string, href?: string, type?: string}> | undefined
  const seenChildrenHrefs = new Set<string>()
  const childrenLinks = (allLinks?.filter((link) => {
    if (link.rel !== 'barn' || !link.href) return false
    if (seenChildrenHrefs.has(link.href)) return false
    seenChildrenHrefs.add(link.href)
    return true
  }) || [])
  
  if (childrenLinks.length > 0) {
    const children: ChapterWithSubchapters[] = []
    for (const link of childrenLinks) {
      if (link.href) {
        try {
          // RECURSIVELY fetch each subchapter and its children
          const subchapter = await fetchChapterWithSubchapters(link.href, signal, depth + 1, maxDepth)
          children.push({ ...subchapter, type: subchapter.type || link.type })
        } catch (error) {
          // Ignore AbortErrors (expected when navigating away)
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error(`Failed to fetch nested content at depth ${depth}:`, error)
          }
        }
      }
    }
    return { ...chapter, children }
  }
  
  return chapter
}
