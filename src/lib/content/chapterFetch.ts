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
    status: detail.status,
    forstPublisert: detail.forstPublisert,
    sistOppdatert: detail.sistOppdatert,
    sistFagligOppdatert: detail.sistFagligOppdatert,
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

/**
 * Fetch a single child content item.
 * Prefers backend (by id or by extracting id from href), falls back to Helsedir.
 */
async function fetchChild(
  link: { id?: string | null; href?: string | null },
  signal?: AbortSignal,
): Promise<NestedContent | null> {
  const backendId = link.id || (link.href ? extractBackendId(link.href) : null)

  if (backendId) {
    try {
      return contentDetailToNestedContent(await getContent(backendId, undefined, { signal }))
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err
      // Backend didn't have it — try Helsedir below
    }
  }

  if (link.href) {
    try {
      return (await fetchHelsedirContent(link.href, signal)) as unknown as NestedContent
    } catch {
      return null
    }
  }

  return null
}

/**
 * Fetch a chapter from the backend and its non-kapittel children in parallel.
 * Kapittel children are returned as stubs (loaded lazily when selected).
 */
async function fetchChapterFromBackend(id: string, signal?: AbortSignal): Promise<NestedContent> {
  const detail = await getContent(id, undefined, { signal })
  const childLinks = (detail.links ?? []).filter((l) => l.rel === 'barn')

  const contentChildren = childLinks.filter((l) => !isKapittel(l.type) && Boolean(l.id || l.href))
  const kapittelChildren = childLinks.filter((l) => isKapittel(l.type))

  const fetched = await Promise.all(contentChildren.map((link) => fetchChild(link, signal)))

  const kapittelStubs: NestedContent[] = kapittelChildren.map((l) => ({
    id: l.id || l.href || '',
    tittel: l.tittel,
    type: l.type,
  }))

  const children = [
    ...fetched.filter((c): c is NestedContent => Boolean(c)),
    ...kapittelStubs,
  ]

  return contentDetailToNestedContent(detail, children.length > 0 ? children : undefined)
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
    contentChildren.map((l) => fetchChild({ href: l.href }, signal)),
  )

  const kapittelStubs: NestedContent[] = kapittelChildren.map((l) => ({
    id: (l.href ? extractBackendId(l.href) : null) || l.href || '',
    tittel: l.tittel || '',
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
): Promise<NestedContent> {
  if (idOrHref.startsWith('http')) {
    const backendId = extractBackendId(idOrHref)
    if (backendId) {
      try {
        return await fetchChapterFromBackend(backendId, signal)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        // Backend doesn't have this chapter — fetch from Helsedir
      }
    }
    return fetchChapterFromHelsedir(idOrHref, signal)
  }
  return fetchChapterFromBackend(idOrHref, signal)
}
