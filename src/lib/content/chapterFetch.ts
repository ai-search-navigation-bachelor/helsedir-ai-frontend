import { getContent } from '../../api/content'
import { fetchHelsedirContent } from '../../api/helsedir'
import type { ContentDetail, NestedContent } from '../../types'

export function contentDetailToNestedContent(
  detail: ContentDetail,
  children?: NestedContent[],
): NestedContent {
  return {
    id: detail.id,
    path: detail.path,
    tittel: detail.title,
    title: detail.title,
    type: detail.content_type,
    body: detail.body,
    has_text_content: detail.has_text_content,
    document_url: detail.document_url,
    is_pdf_only: detail.is_pdf_only,
    related_links: detail.related_links,
    status: detail.status,
    forstPublisert: detail.first_published,
    sistOppdatert: detail.last_reviewed_date,
    sistFagligOppdatert: detail.last_reviewed_date,
    url: detail.url,
    data: detail.anbefaling_fields
      ? {
          styrke: detail.anbefaling_fields.styrke,
          praktisk: detail.anbefaling_fields.praktisk,
          rasjonale: detail.anbefaling_fields.rasjonale,
          nokkelInfo: {
            fordelerogulemper: detail.anbefaling_fields.fordeler_ulemper,
            verdierogpreferanser: detail.anbefaling_fields.verdier_preferanser,
          },
        }
      : undefined,
    children,
  }
}

function isKapittel(type?: string | null) {
  return type?.trim().toLowerCase() === 'kapittel'
}

/** Extract the backend content ID from a Helsedir URL path's last segment. */
function extractBackendId(href: string): string | null {
  const last = href.split('/').filter(Boolean).pop()
  return last && last.includes('-') ? last : null
}

async function fetchLinkedChild(
  link: { id?: string | null; href?: string | null; last_reviewed_date?: string | null },
  signal?: AbortSignal,
): Promise<NestedContent | null> {
  const backendId = link.id || (link.href ? extractBackendId(link.href) : null)

  if (backendId) {
    try {
      return await fetchChapter(backendId, signal, link.last_reviewed_date || undefined)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
    }
  }

  if (link.href) {
    try {
      return await fetchChapter(link.href, signal, link.last_reviewed_date || undefined)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err

      try {
        const result = (await fetchHelsedirContent(link.href, signal)) as NestedContent
        if (!result.sistFagligOppdatert && link.last_reviewed_date) {
          result.sistFagligOppdatert = link.last_reviewed_date
        }
        return result
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error && fallbackErr.name === 'AbortError') throw fallbackErr
      }
    }
  }

  return null
}

/**
 * Fetch a chapter from the backend and its non-kapittel children in parallel.
 * Kapittel children are returned as stubs (loaded lazily when selected).
 */
async function fetchChapterFromBackend(
  id: string,
  signal?: AbortSignal,
  fallbackSistFagligOppdatert?: string,
): Promise<NestedContent> {
  const detail = await getContent(id, undefined, { signal })
  const childLinks = (detail.links ?? []).filter((l) => l.rel === 'barn')

  const contentChildren = childLinks.filter((l) => !isKapittel(l.type) && Boolean(l.id || l.href))
  const kapittelChildren = childLinks.filter((l) => isKapittel(l.type))

  const fetched = await Promise.all(
    contentChildren.map((link) =>
      fetchLinkedChild(
        {
          id: link.id,
          href: link.href,
          last_reviewed_date: link.last_reviewed_date,
        },
        signal,
      ),
    ),
  )

  const kapittelStubs: NestedContent[] = kapittelChildren.map((l) => ({
    id: l.id || l.href || '',
    tittel: l.title,
    title: l.title,
    type: l.type,
    sistFagligOppdatert: l.last_reviewed_date || undefined,
  }))

  const children = [
    ...fetched.filter((c): c is NestedContent => Boolean(c)),
    ...kapittelStubs,
  ]

  const result = contentDetailToNestedContent(detail, children.length > 0 ? children : undefined)
  if (!result.sistFagligOppdatert && fallbackSistFagligOppdatert) {
    result.sistFagligOppdatert = fallbackSistFagligOppdatert
  }
  return result
}

/**
 * Fetch a chapter from the Helsedir API and its non-kapittel children in parallel.
 * Children are found in `links` / `lenker` with rel="barn".
 */
async function fetchChapterFromHelsedir(href: string, signal?: AbortSignal): Promise<NestedContent> {
  type HelsedirLink = { rel?: string; href?: string; type?: string; tittel?: string }
  const chapter = (await fetchHelsedirContent(href, signal)) as NestedContent & {
    lenker?: HelsedirLink[]
    links?: HelsedirLink[]
  }

  const allLinks = [
    ...(chapter.lenker ?? []),
    ...((chapter.links ?? []) as HelsedirLink[]),
  ]
  const seen = new Set<string>()
  const barnLinks = allLinks.filter((l) => {
    if (l.rel !== 'barn' || !l.href) return false
    if (seen.has(l.href)) return false
    seen.add(l.href)
    return true
  })

  const contentChildren = barnLinks.filter((l) => !isKapittel(l.type))
  const kapittelChildren = barnLinks.filter((l) => isKapittel(l.type))

  const fetched = await Promise.all(
    contentChildren.map((l) => fetchChapter(l.href || '', signal)),
  )

  const kapittelStubs: NestedContent[] = kapittelChildren.map((l) => ({
    id: (l.href ? extractBackendId(l.href) : null) || l.href || '',
    tittel: l.tittel || '',
    title: l.tittel || '',
    type: l.type || 'kapittel',
  }))

  const children = [
    ...fetched.filter((c): c is NestedContent => Boolean(c)),
    ...kapittelStubs,
  ]

  return {
    ...chapter,
    children: children.length > 0 ? children : undefined,
  } as NestedContent
}

/**
 * Fetch a chapter and its non-kapittel children (anbefalinger etc.) in parallel.
 * Accepts a backend content ID or a Helsedir URL.
 *
 * For Helsedir URLs: tries backend first (by extracting the ID from the URL path),
 * then falls back to fetching directly from the Helsedir API.
 */
export async function fetchChapter(
  idOrHref: string,
  signal?: AbortSignal,
  fallbackSistFagligOppdatert?: string,
): Promise<NestedContent> {
  if (idOrHref.startsWith('http')) {
    const backendId = extractBackendId(idOrHref)
    if (backendId) {
      try {
        return await fetchChapterFromBackend(backendId, signal, fallbackSistFagligOppdatert)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
      }
    }
    return fetchChapterFromHelsedir(idOrHref, signal)
  }
  return fetchChapterFromBackend(idOrHref, signal, fallbackSistFagligOppdatert)
}
