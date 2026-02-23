import { useParentChainQuery } from './queries/useParentChainQuery'
import { extractTemasideInfo } from '../lib/content/breadcrumbUtils'
import {
  buildContentBreadcrumbItems,
  buildFallbackBreadcrumbItems,
} from '../lib/content/contentDetailBreadcrumbModel'
import type { ContentDetail } from '../types'

interface UseContentDetailBreadcrumbsOptions {
  content?: ContentDetail
  searchId?: string
}

export function useContentDetailBreadcrumbs({
  content,
  searchId,
}: UseContentDetailBreadcrumbsOptions) {
  const { data: parentChainResult, isLoading: isParentChainLoading } = useParentChainQuery(
    content,
    searchId,
  )

  const hasLinks = Boolean(content?.links && content.links.length > 0)

  // Use temaside from parent chain when available, otherwise extract from current content
  const temaside = parentChainResult?.temaside ?? extractTemasideInfo(content?.links) ?? null

  const activeBreadcrumbItems =
    content && hasLinks
      ? buildContentBreadcrumbItems(content, parentChainResult?.chain ?? [], temaside)
      : buildFallbackBreadcrumbItems(content)

  const collapsible = Boolean(content?.links?.some((link) => link.rel === 'forelder'))

  return {
    activeBreadcrumbItems,
    isParentChainLoading,
    collapsible,
  }
}
