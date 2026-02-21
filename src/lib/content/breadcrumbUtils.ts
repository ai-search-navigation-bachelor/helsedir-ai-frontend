import { TEMASIDE_CATEGORIES } from '../../constants/temasider'
import { stripTemasidePrefix } from '../path'

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
