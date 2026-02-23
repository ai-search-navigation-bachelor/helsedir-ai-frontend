import { useQuery } from '@tanstack/react-query'
import { getContent } from '../../api'
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
}

export interface ParentChainResult {
  chain: ParentChainEntry[]
  temaside: TemasideInfo | null
}

const MAX_DEPTH = 10

function hasForelderLink(content?: ContentDetail): boolean {
  return Boolean(content?.links?.some((link) => link.rel === 'forelder'))
}

async function fetchParentChain(
  signal: AbortSignal,
  content: ContentDetail,
  searchId?: string,
): Promise<ParentChainResult> {
  const chain: ParentChainEntry[] = []
  const visited = new Set<string>()
  let current = content

  // Collect temaside info: prefer from root parent, fall back to current content
  let temaside: TemasideInfo | null = extractTemasideInfo(content.links)

  for (let depth = 0; depth < MAX_DEPTH; depth++) {
    const forelderLink = current.links?.find((link) => link.rel === 'forelder')
    if (!forelderLink) break

    const parentId = forelderLink.id || getContentIdFromHref(forelderLink.href)
    if (!parentId || visited.has(parentId)) break

    visited.add(parentId)

    let parent: ContentDetail
    try {
      parent = await getContent(parentId, searchId, { signal, suppressErrorStatuses: [404] })
    } catch (error) {
      // Rethrow abort errors so React Query handles cancellation
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      // Parent not found (404) or other error — stop climbing
      break
    }

    const href = parent.path
      ? buildContentUrl({ path: parent.path, id: parent.id })
      : `/content/${parent.id}`

    chain.unshift({
      id: parent.id,
      tittel: parent.title,
      href,
    })

    // Overwrite temaside with the one from the highest ancestor found so far
    const parentTemaside = extractTemasideInfo(parent.links)
    if (parentTemaside) {
      temaside = parentTemaside
    }

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
    staleTime: 10 * 60 * 1000,
  })
}
