import { TEMASIDE_CATEGORIES } from '../../constants/temasider'
import { stripTemasidePrefix } from '../path'
import type { BreadcrumbItem } from '../../types/components'

export function getTemasideCategoryByPath(path: string) {
  return TEMASIDE_CATEGORIES.find((category) => category.path === path)
}

export function getTemasideCategoryPathFromContentLinks(
  links: Array<{ rel: string; href: string }> | undefined,
): string | null {
  const parentHref = links?.find((link) => link.rel === 'forelder')?.href
  if (!parentHref) return null

  const normalizedParentPath = stripTemasidePrefix(parentHref)
  const segments = normalizedParentPath.split('/').filter(Boolean)
  if (segments.length === 0) return null

  return `/${segments[0]}`
}

export function getSourceTemasideIdFromLocationState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null

  const sourceTemasideId = (state as { sourceTemasideId?: unknown }).sourceTemasideId
  if (typeof sourceTemasideId !== 'string') return null

  const trimmed = sourceTemasideId.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getSearchQueryFromLocationState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null

  const fromSearch = (state as { fromSearch?: unknown }).fromSearch
  const searchQuery = (state as { searchQuery?: unknown }).searchQuery
  if (fromSearch !== true || typeof searchQuery !== 'string') return null

  const trimmed = searchQuery.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function getSearchCategoryContextFromLocationState(
  state: unknown,
): { categoryId: string | null; categoryName: string | null } {
  if (!state || typeof state !== 'object') {
    return { categoryId: null, categoryName: null }
  }

  const fromSearch = (state as { fromSearch?: unknown }).fromSearch
  if (fromSearch !== true) {
    return { categoryId: null, categoryName: null }
  }

  const rawCategoryId = (state as { searchCategoryId?: unknown }).searchCategoryId
  const rawCategoryName = (state as { searchCategoryName?: unknown }).searchCategoryName

  const categoryId =
    typeof rawCategoryId === 'string' && rawCategoryId.trim().length > 0
      ? rawCategoryId.trim()
      : null
  const categoryName =
    typeof rawCategoryName === 'string' && rawCategoryName.trim().length > 0
      ? rawCategoryName.trim()
      : null

  return { categoryId, categoryName }
}

export function getSourceContentContextFromLocationState(
  state: unknown,
): { id: string | null; title: string | null } {
  if (!state || typeof state !== 'object') return { id: null, title: null }

  const rawSourceContentId = (state as { sourceContentId?: unknown }).sourceContentId
  const rawSourceContentTitle = (state as { sourceContentTitle?: unknown }).sourceContentTitle

  const id =
    typeof rawSourceContentId === 'string' && rawSourceContentId.trim().length > 0
      ? rawSourceContentId.trim()
      : null
  const title =
    typeof rawSourceContentTitle === 'string' && rawSourceContentTitle.trim().length > 0
      ? rawSourceContentTitle.trim()
      : null

  return { id, title }
}

export function sanitizeTemasideItems(items: BreadcrumbItem[]) {
  return items.filter((item) => item.label.toLowerCase() !== 'temasider')
}
