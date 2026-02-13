import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Paragraph } from '@digdir/designsystemet-react'
import {
  getMainCategoryBySubcategory,
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
} from '../constants/categories'
import { useContentByIdQuery } from '../hooks/queries/useContentByIdQuery'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useTemasideBreadcrumbStore } from '../stores'
import { useSearchStore } from '../stores/searchStore'
import { ContentDisplay } from '../components/content'
import { ContentPageLoadingSkeleton } from '../components/content/ContentSkeletons'
import { getContentIdFromHref } from '../components/content/shared/linkUtils'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import type { BreadcrumbItem } from '../types/components'
import {
  getSearchCategoryContextFromLocationState,
  getSearchQueryFromLocationState,
  getSourceContentContextFromLocationState,
  getSourceTemasideIdFromLocationState,
  getTemasideCategoryByPath,
  getTemasideCategoryPathFromContentLinks,
  sanitizeTemasideItems,
} from './contentDetailUtils'

export function ContentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const searchId = useSearchStore((state) => state.searchId)
  const routeState = (location.state as { contentType?: string } | null) ?? null
  const routeContentType = routeState?.contentType?.trim().toLowerCase() || ''
  const temasideTrailByPath = useTemasideBreadcrumbStore((state) => state.trailByPath)
  const temasideLastPath = useTemasideBreadcrumbStore((state) => state.lastPath)

  const effectiveSearchId = searchId || undefined
  const sourceTemasideId = getSourceTemasideIdFromLocationState(location.state)
  const searchReturnQuery = getSearchQueryFromLocationState(location.state)
  const { categoryId: searchCategoryId, categoryName: searchCategoryName } =
    getSearchCategoryContextFromLocationState(location.state)
  const { id: sourceContentId, title: sourceContentTitleFromState } =
    getSourceContentContextFromLocationState(location.state)

  const { data: content, isLoading, error } = useContentDetailQuery({
    contentId: id,
    searchId: effectiveSearchId,
    routeContentType,
  })

  const { data: sourceTemasideContent } = useContentByIdQuery({
    contentId: sourceTemasideId,
    searchId: effectiveSearchId,
    enabled: Boolean(sourceTemasideId && sourceTemasideId !== id),
  })

  const { data: sourceContentForBreadcrumb } = useContentByIdQuery({
    contentId: sourceContentId,
    searchId: effectiveSearchId,
    enabled: Boolean(
      sourceContentId &&
      sourceContentId !== id &&
      sourceContentId !== sourceTemasideId &&
      !sourceContentTitleFromState,
    ),
  })

  const fallbackBreadcrumbItems: BreadcrumbItem[] = content
    ? [
        { label: 'Forside', href: '/' },
        { label: content.title, href: '#' },
      ]
    : []

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

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-10 pb-8">
      {activeBreadcrumbItems.length > 0 ? (
        <Breadcrumb items={activeBreadcrumbItems} />
      ) : (
        <Button
          variant="tertiary"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '24px' }}
        >
          &larr; Tilbake
        </Button>
      )}

      {isLoading && <ContentPageLoadingSkeleton />}

      {error && (
        <Alert data-color="danger">
          <Paragraph>
            {error instanceof Error ? error.message : 'Henting av innhold feilet'}
          </Paragraph>
        </Alert>
      )}

      {content && <ContentDisplay content={content} />}
    </div>
  )
}

