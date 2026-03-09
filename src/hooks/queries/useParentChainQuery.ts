import { useQuery } from '@tanstack/react-query'
import { getContent, fetchHelsedirContent } from '../../api'
import type { HelselinkContent } from '../../api'
import { getContentIdFromHref } from '../../components/content/shared/linkUtils'
import { buildContentUrl } from '../../lib/contentUrl'
import { extractTemasideInfo } from '../../lib/content/breadcrumbUtils'
import type { TemasideInfo } from '../../lib/content/breadcrumbUtils'
import type { ContentDetail } from '../../types'

export type { TemasideInfo }

export interface ParentChainEntry {
  id: string
  tittel: string
  href: string
  contentType?: string
}

export interface ParentChainResult {
  chain: ParentChainEntry[]
  temaside: TemasideInfo | null
}

const MAX_DEPTH = 10

/** Strip the last path segment (e.g. "/a/b/c" → "/a/b"). Returns empty string for single-segment paths. */
function stripLastPathSegment(path: string): string {
  return path.replace(/\/[^/]+$/, '')
}

function hasForelderLink(content?: ContentDetail): boolean {
  return Boolean(content?.links?.some((link) => link.rel === 'forelder'))
}

/** Convert a HelselinkContent (Helsedir API) response into a minimal ContentDetail. */
function helsedirToContentDetail(hc: HelselinkContent): ContentDetail {
  return {
    id: hc.id,
    title: hc.tittel,
    body: '',
    content_type: hc.type ?? '',
    links: hc.lenker?.map((l) => ({
      rel: l.rel,
      type: l.type ?? '',
      title: l.tittel ?? '',
      href: l.href ?? null,
      id: l.strukturId ?? null,
      path: null,
    })),
  }
}

async function fetchParentChain(
  signal: AbortSignal,
  content: ContentDetail,
  searchId?: string,
): Promise<ParentChainResult> {
  const chain: ParentChainEntry[] = []
  const visited = new Set<string>()
  let current: ContentDetail = content
  let childPath = content.path ?? null

  // Collect temaside info: prefer from root parent, fall back to current content
  let temaside: TemasideInfo | null = extractTemasideInfo(content.links)

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const forelderLink = current.links?.find((link) => link.rel === 'forelder')
    if (!forelderLink) break

    const parentId = forelderLink.id || getContentIdFromHref(forelderLink.href)
    if (!parentId || visited.has(parentId)) break

    visited.add(parentId)

    let parent: ContentDetail | null = null
    try {
      parent = await getContent(parentId, searchId, { signal, suppressErrorStatuses: [404] })
    } catch (error) {
      // Rethrow abort errors so React Query handles cancellation
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      // Backend failed — try Helsedir API directly as fallback
      if (forelderLink.href) {
        try {
          parent = helsedirToContentDetail(await fetchHelsedirContent(forelderLink.href, signal))
        } catch (fallbackError) {
          if (fallbackError instanceof DOMException && fallbackError.name === 'AbortError')
            throw fallbackError
          // Both failed, parent stays null
        }
      }
    }

    if (!parent) break

    // Derive href: prefer parent's own path, then derive from child's path
    let href: string
    if (parent.path) {
      href = buildContentUrl({ path: parent.path, id: parent.id })
    } else if (childPath) {
      href = stripLastPathSegment(childPath) || `/content/${parent.id}`
    } else {
      href = `/content/${parent.id}`
    }

    chain.unshift({
      id: parent.id,
      tittel: parent.title,
      href,
      contentType: parent.content_type,
    })

    // Overwrite temaside with the one from the highest ancestor found so far
    const parentTemaside = extractTemasideInfo(parent.links)
    if (parentTemaside) {
      temaside = parentTemaside
    }

    // Move up: track derived path for next iteration
    childPath = parent.path ?? (childPath ? stripLastPathSegment(childPath) : null)
    current = parent
  }

  return { chain, temaside }
}

export function useParentChainQuery(content?: ContentDetail, searchId?: string) {
  const enabled = hasForelderLink(content)

  return useQuery<ParentChainResult>({
    queryKey: ['parentChain', content?.id, searchId],
    queryFn: ({ signal }) => fetchParentChain(signal, content!, searchId),
    enabled: enabled && Boolean(content),
    staleTime: 5 * 60 * 1000,
  })
}
