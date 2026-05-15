/**
 * Assembles breadcrumb items for content detail pages.
 * Combines the parent chain from the API, temaside path info, and content metadata
 * to build a full ancestor trail from the home page down to the current content item.
 */
import { stripTemasidePrefix } from '../path'
import { TEMASIDE_CATEGORIES } from '../../constants/temasider'
import { getContentIdFromHref } from '../../components/content/shared/linkUtils'
import { buildContentUrl } from '../contentUrl'
import { getDisplayTitle } from '../displayTitle'
import type { ContentDetail } from '../../types'
import type { BreadcrumbItem } from '../../components/ui/Breadcrumb'
import type { TemasideInfo } from './breadcrumbUtils'
import type { ParentChainEntry } from '../../hooks/queries/useParentChainQuery'

/**
 * Extract the temaside category from the temaside's path.
 * e.g. "/temaside/forebygging-diagnose-og-behandling/adhd" -> "Forebygging, diagnose og behandling"
 */
function getCategoryFromTemasidePath(temasidePath: string): { label: string; href: string } | null {
  const stripped = stripTemasidePrefix(temasidePath)
  const segments = stripped.split('/').filter(Boolean)
  if (segments.length === 0) return null

  const categorySlug = segments[0]
  const category = TEMASIDE_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!category) return null

  return { label: category.title, href: category.path }
}

/**
 * Extract the direct parent entry from content.links (synchronous, no fetch needed).
 */
function extractDirectParent(content: ContentDetail): ParentChainEntry | null {
  const parentTitle = getDisplayTitle(content.parent, content.parent?.title ?? '')

  if (content.parent?.id && parentTitle) {
    return {
      id: content.parent.id,
      tittel: parentTitle,
      href: content.parent.path
        ? buildContentUrl({ path: content.parent.path, id: content.parent.id })
        : `/content/${content.parent.id}`,
      contentType: content.parent.content_type || content.parent.info_type,
    }
  }

  const forelderLink = content.links?.find((link) => link.rel === 'forelder')
  if (!forelderLink?.title) return null
  if (forelderLink.type?.trim().toLowerCase() === 'kapittel') return null

  const id = forelderLink.id || getContentIdFromHref(forelderLink.href)
  if (!id) return null

  const href = forelderLink.path
    ? buildContentUrl({ path: forelderLink.path, id })
    : `/content/${id}`

  return { id, tittel: forelderLink.title, href, contentType: forelderLink.type }
}

export function buildContentBreadcrumbItems(
  content: ContentDetail,
  parentChain: ParentChainEntry[],
  temaside: TemasideInfo | null,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Forside', href: '/', group: 'home' }]

  // Add category segment derived from the temaside's path
  if (temaside?.path) {
    const category = getCategoryFromTemasidePath(temaside.path)
    if (category) {
      items.push({ label: category.label, href: category.href, group: 'tema' })
    }
  }

  // Add temaside segment
  if (temaside) {
    items.push({ label: temaside.title, href: temaside.href, group: 'tema' })
  }

  // Add parent chain entries (skip temaside duplicate, current content, and kapittel types)
  if (parentChain.length > 0) {
    for (const entry of parentChain) {
      if (temaside && entry.id === temaside.id) continue
      if (entry.id === content.id) continue
      if (entry.contentType?.trim().toLowerCase() === 'kapittel') continue
      items.push({ label: entry.tittel, href: entry.href, group: 'parent' })
    }
  } else {
    // Fallback: use the direct forelder from content.links (instant, no fetch)
    const directParent = extractDirectParent(content)
    if (directParent && directParent.id !== content.id && directParent.id !== temaside?.id) {
      items.push({ label: directParent.tittel, href: directParent.href, group: 'parent' })
    }
  }

  items.push({ label: getDisplayTitle(content, content.title), href: '#', group: 'current' })

  return items
}

export function buildFallbackBreadcrumbItems(content?: ContentDetail): BreadcrumbItem[] {
  if (!content) return []

  return [
    { label: 'Forside', href: '/', group: 'home' },
    { label: getDisplayTitle(content, content.title), href: '#', group: 'current' },
  ]
}
