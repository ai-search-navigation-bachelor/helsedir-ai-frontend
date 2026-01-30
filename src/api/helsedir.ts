/**
 * Helsedirektoratet External API
 * Fetches content directly from helsedirektoratet.no API
 */

const HELSEDIR_API_BASE = import.meta.env.VITE_HELSEDIR_API_URL || 'https://api.helsedirektoratet.no'
const API_KEY = import.meta.env.VITE_HELSEDIR_API_KEY || ''

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
  subchapters?: HelselinkContent[]
}

/**
 * Fetch content from Helsedirektoratet API
 * Uses the href from content links
 */
export async function fetchHelsedirContent(
  href: string,
  signal?: AbortSignal
): Promise<HelselinkContent> {
  const url = new URL(href)
  
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
 * Fetch chapter with its subchapters (nested children)
 */
export async function fetchChapterWithSubchapters(
  href: string,
  signal?: AbortSignal
): Promise<ChapterWithSubchapters> {
  const chapter = await fetchHelsedirContent(href, signal)
  
  // Check if chapter has children (subchapters)
  const childrenLinks = chapter.lenker?.filter(link => link.rel === 'barn') || []
  
  if (childrenLinks.length > 0) {
    const subchapters: HelselinkContent[] = []
    for (const link of childrenLinks) {
      if (link.href) {
        try {
          const subchapter = await fetchHelsedirContent(link.href, signal)
          subchapters.push(subchapter)
        } catch (error) {
          console.error(`Failed to fetch subchapter:`, error)
        }
      }
    }
    return { ...chapter, subchapters }
  }
  
  return chapter
}
