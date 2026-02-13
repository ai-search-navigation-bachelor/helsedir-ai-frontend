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
import {
  buildExtendedTemasideBreadcrumbItems,
  buildFallbackBreadcrumbItems,
  buildLinkHierarchyBreadcrumbItems,
  buildRelatedTemasideBreadcrumbItems,
  buildSearchHierarchyBreadcrumbItems,
  buildTemasideCanonicalBreadcrumbItems,
  buildTemasideTrailBreadcrumbItems,
  resolveActiveContentDetailBreadcrumbs,
} from '../lib/content/contentDetailBreadcrumbModel'
import { useTemasideBreadcrumbStore } from '../stores'
import type { ContentDetail } from '../types'

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

  const fallbackBreadcrumbItems = buildFallbackBreadcrumbItems(content)
  const linkHierarchyBreadcrumbItems = buildLinkHierarchyBreadcrumbItems(content)
  const searchHierarchyBreadcrumbItems = buildSearchHierarchyBreadcrumbItems(content, {
    searchQuery: searchReturnQuery,
    mainCategoryId: searchMainCategoryId,
    mainCategoryLabel: searchMainCategoryLabel,
    categoryId: searchCategoryId,
    subcategoryLabel: searchSubcategoryLabel,
  })

  const temasideCategoryPath = getTemasideCategoryPathFromContentLinks(content?.links)
  const temasideCategory = temasideCategoryPath
    ? getTemasideCategoryByPath(temasideCategoryPath)
    : undefined
  const temasideCanonicalBreadcrumbItems = buildTemasideCanonicalBreadcrumbItems(
    content,
    temasideCategoryPath,
    temasideCategory?.title,
  )

  const sourceTemasideCategoryPath = getTemasideCategoryPathFromContentLinks(sourceTemasideContent?.links)
  const sourceTemasideCategory = sourceTemasideCategoryPath
    ? getTemasideCategoryByPath(sourceTemasideCategoryPath)
    : undefined
  const relatedTemasideBreadcrumbItems = buildRelatedTemasideBreadcrumbItems({
    content,
    sourceTemasideContent,
    sourceTemasideCategoryPath,
    sourceTemasideCategoryTitle: sourceTemasideCategory?.title,
  })

  const sourceContentTitle = sourceContentTitleFromState || sourceContentForBreadcrumb?.title || null
  const extendedTemasideBreadcrumbItems = buildExtendedTemasideBreadcrumbItems({
    content,
    sourceTemasideContent,
    sourceTemasideCategoryPath,
    sourceTemasideCategoryTitle: sourceTemasideCategory?.title,
    sourceContentId,
    sourceContentTitle,
  })

  const temasideBreadcrumbItems = buildTemasideTrailBreadcrumbItems({
    contentTitle: content?.title,
    searchQuery: searchReturnQuery,
    temasideLastPath,
    trailByPath: temasideTrailByPath,
    sanitizeTemasideItems,
  })

  const activeBreadcrumbItems = resolveActiveContentDetailBreadcrumbs({
    fallbackBreadcrumbItems,
    linkHierarchyBreadcrumbItems,
    searchHierarchyBreadcrumbItems,
    temasideCanonicalBreadcrumbItems,
    relatedTemasideBreadcrumbItems,
    extendedTemasideBreadcrumbItems,
    temasideBreadcrumbItems,
  })

  return {
    activeBreadcrumbItems,
  }
}
