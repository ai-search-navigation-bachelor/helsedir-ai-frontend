import {
  getMainCategoryBySubcategory,
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
} from '../constants/categories'
import { useContentByIdQuery } from './queries/useContentByIdQuery'
import {
  getSearchCategoryContextFromLocationState,
  getSearchQueryFromLocationState,
  getSourceContentContextFromLocationState,
  getSourceTemasideIdFromLocationState,
  getTemasideCategoryByPath,
  getTemasideCategoryPathFromContentLinks,
  sanitizeTemasideItems,
} from '../lib/content/breadcrumbUtils'
import { useTemasideBreadcrumbStore } from '../stores'
import type { ContentDetail } from '../types'
import type { BreadcrumbItem } from '../types/components'
import { getContentIdFromHref } from '../components/content/shared/linkUtils'

interface UseContentDetailBreadcrumbsOptions {
  content?: ContentDetail
  currentContentId?: string
  locationState: unknown
  searchId?: string
}

export function useContentDetailBreadcrumbs({
  content,
  currentContentId,
  locationState,
  searchId,
}: UseContentDetailBreadcrumbsOptions) {
  const temasideTrailByPath = useTemasideBreadcrumbStore((state) => state.trailByPath)
  const temasideLastPath = useTemasideBreadcrumbStore((state) => state.lastPath)

  const sourceTemasideId = getSourceTemasideIdFromLocationState(locationState)
  const searchReturnQuery = getSearchQueryFromLocationState(locationState)
  const { categoryId: searchCategoryId, categoryName: searchCategoryName } =
    getSearchCategoryContextFromLocationState(locationState)
  const { id: sourceContentId, title: sourceContentTitleFromState } =
    getSourceContentContextFromLocationState(locationState)

  const { data: sourceTemasideContent } = useContentByIdQuery({
    contentId: sourceTemasideId,
    searchId,
    enabled: Boolean(sourceTemasideId && sourceTemasideId !== currentContentId),
  })

  const { data: sourceContentForBreadcrumb } = useContentByIdQuery({
    contentId: sourceContentId,
    searchId,
    enabled: Boolean(
      sourceContentId &&
      sourceContentId !== currentContentId &&
      sourceContentId !== sourceTemasideId &&
      !sourceContentTitleFromState,
    ),
  })

  const searchMainCategoryId = searchCategoryId
    ? getMainCategoryBySubcategory(searchCategoryId)
    : undefined
  const searchMainCategoryLabel = searchMainCategoryId
    ? SEARCH_MAIN_CATEGORIES.find((category) => category.id === searchMainCategoryId)?.label
    : undefined
  const searchSubcategoryLabel = searchCategoryName || (
    searchCategoryId && searchCategoryId in SEARCH_SUBCATEGORY_LABELS
      ? SEARCH_SUBCATEGORY_LABELS[searchCategoryId as keyof typeof SEARCH_SUBCATEGORY_LABELS]
      : undefined
  )

  const fallbackBreadcrumbItems: BreadcrumbItem[] = content
    ? [
        { label: 'Forside', href: '/' },
        { label: content.title, href: '#' },
      ]
    : []

  const rootLink = content?.links?.find((link) => link.rel === 'root')
  const parentLink = content?.links?.find((link) => link.rel === 'forelder')
  const rootContentId = getContentIdFromHref(rootLink?.href)
  const parentContentId = getContentIdFromHref(parentLink?.href)

  const linkHierarchyBreadcrumbItems: BreadcrumbItem[] =
    content && (rootContentId || parentContentId)
      ? [
          { label: 'Forside', href: '/' },
          ...(rootContentId && rootLink?.tittel && rootContentId !== content.id
            ? [{ label: rootLink.tittel, href: `/content/${rootContentId}` }]
            : []),
          ...(parentContentId &&
          parentLink?.tittel &&
          parentContentId !== content.id &&
          parentContentId !== rootContentId
            ? [{ label: parentLink.tittel, href: `/content/${parentContentId}` }]
            : []),
          { label: content.title, href: '#' },
        ]
      : []

  const searchHierarchyBreadcrumbItems: BreadcrumbItem[] =
    content && searchReturnQuery && content.content_type !== 'temaside'
      ? [
          { label: 'Forside', href: '/' },
          { label: 'Søk', href: '#' },
          ...(searchMainCategoryId && searchMainCategoryLabel
            ? [{ label: searchMainCategoryLabel, href: '#' }]
            : []),
          ...(searchCategoryId && searchSubcategoryLabel && searchCategoryId !== searchMainCategoryId
            ? [{ label: searchSubcategoryLabel, href: '#' }]
            : []),
          { label: content.title, href: '#' },
        ]
      : []

  const temasideCategoryPath = getTemasideCategoryPathFromContentLinks(content?.links)
  const temasideCategory = temasideCategoryPath
    ? getTemasideCategoryByPath(temasideCategoryPath)
    : undefined

  const temasideCanonicalBreadcrumbItems: BreadcrumbItem[] =
    content?.content_type === 'temaside' && temasideCategoryPath
      ? [
          { label: 'Forside', href: '/' },
          {
            label: temasideCategory?.title || content.title,
            href: `/temaside${temasideCategoryPath}`,
          },
          ...(temasideCategory?.title !== content.title
            ? [{ label: content.title, href: '#' }]
            : []),
        ]
      : []

  const sourceTemasideCategoryPath = getTemasideCategoryPathFromContentLinks(sourceTemasideContent?.links)
  const sourceTemasideCategory = sourceTemasideCategoryPath
    ? getTemasideCategoryByPath(sourceTemasideCategoryPath)
    : undefined

  const relatedTemasideBreadcrumbItems: BreadcrumbItem[] =
    content && content.content_type !== 'temaside' && sourceTemasideContent && sourceTemasideCategoryPath
      ? [
          { label: 'Forside', href: '/' },
          {
            label: sourceTemasideCategory?.title || sourceTemasideContent.title,
            href: `/temaside${sourceTemasideCategoryPath}`,
          },
          { label: sourceTemasideContent.title, href: `/content/${sourceTemasideContent.id}` },
          { label: content.title, href: '#' },
        ]
      : []

  const sourceContentTitle = sourceContentTitleFromState || sourceContentForBreadcrumb?.title || null

  const extendedTemasideBreadcrumbItems: BreadcrumbItem[] =
    content &&
    content.content_type !== 'temaside' &&
    sourceTemasideContent &&
    sourceTemasideCategoryPath &&
    sourceContentId &&
    sourceContentId !== sourceTemasideContent.id &&
    sourceContentId !== content.id &&
    sourceContentTitle
      ? [
          { label: 'Forside', href: '/' },
          {
            label: sourceTemasideCategory?.title || sourceTemasideContent.title,
            href: `/temaside${sourceTemasideCategoryPath}`,
          },
          { label: sourceTemasideContent.title, href: `/content/${sourceTemasideContent.id}` },
          { label: sourceContentTitle, href: `/content/${sourceContentId}` },
          { label: content.title, href: '#' },
        ]
      : []

  const temasideBreadcrumbItems: BreadcrumbItem[] =
    !searchReturnQuery && temasideLastPath && temasideTrailByPath[temasideLastPath]
      ? [
          ...sanitizeTemasideItems(
            temasideTrailByPath[temasideLastPath].slice(
              0,
              Math.max(temasideTrailByPath[temasideLastPath].length - 1, 0),
            ),
          ),
          { label: content?.title || 'Laster...', href: '#' },
        ]
      : []

  // Keep canonical and explicitly related temaside trails ahead of inferred link/search fallbacks.
  const activeBreadcrumbItems =
    temasideCanonicalBreadcrumbItems.length > 0
      ? temasideCanonicalBreadcrumbItems
      : extendedTemasideBreadcrumbItems.length > 0
        ? extendedTemasideBreadcrumbItems
        : relatedTemasideBreadcrumbItems.length > 0
          ? relatedTemasideBreadcrumbItems
          : linkHierarchyBreadcrumbItems.length > 0
            ? linkHierarchyBreadcrumbItems
            : searchHierarchyBreadcrumbItems.length > 0
              ? searchHierarchyBreadcrumbItems
              : temasideBreadcrumbItems.length > 0
                ? temasideBreadcrumbItems
                : fallbackBreadcrumbItems

  return {
    activeBreadcrumbItems,
  }
}
