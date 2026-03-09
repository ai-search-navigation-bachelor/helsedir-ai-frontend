import { TEMASIDE_CATEGORIES } from '../../constants/temasider'
import { stripTemasidePrefix } from '../path'
import { buildContentUrl } from '../contentUrl'
import type { ContentLink } from '../../types'

export interface TemasideInfo {
  id: string | null
  tittel: string
  href: string
  path: string
}

export function extractTemasideInfo(links?: ContentLink[]): TemasideInfo | null {
  const temasideLink = links?.find(
    (link) => link.rel === 'temaside' && link.title && link.path,
  )
  if (!temasideLink?.path) return null

  return {
    id: temasideLink.id ?? null,
    tittel: temasideLink.title,
    href: buildContentUrl({ path: temasideLink.path, id: temasideLink.id ?? '' }),
    path: temasideLink.path,
  }
}

export function getTemasideCategoryByPath(path: string) {
  return TEMASIDE_CATEGORIES.find((category) => category.path === path)
}

export function getTemasideCategoryPathFromContentLinks(
  links: Array<{ rel: string; href: string | null }> | undefined,
): string | null {
  const parentHref = links?.find((link) => link.rel === 'forelder')?.href
  if (!parentHref) return null

  const normalizedParentPath = stripTemasidePrefix(parentHref)
  const segments = normalizedParentPath.split('/').filter(Boolean)
  if (segments.length === 0) return null

  return `/${segments[0]}`
}
