import { useContentByIdQuery } from './queries/useContentByIdQuery'
import {
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

  const fallbackBreadcrumbItems = buildFallbackBreadcrumbItems(content)
  const linkHierarchyBreadcrumbItems = buildLinkHierarchyBreadcrumbItems(content)

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
    temasideLastPath,
    trailByPath: temasideTrailByPath,
    sanitizeTemasideItems,
  })

  const activeBreadcrumbItems = resolveActiveContentDetailBreadcrumbs({
    fallbackBreadcrumbItems,
    linkHierarchyBreadcrumbItems,
    temasideCanonicalBreadcrumbItems,
    relatedTemasideBreadcrumbItems,
    extendedTemasideBreadcrumbItems,
    temasideBreadcrumbItems,
  })

  return {
    activeBreadcrumbItems,
  }
}
