import { getContentIdFromHref } from '../../components/content/shared/linkUtils'
import { buildContentUrl } from '../contentUrl'
import type { ContentDetail } from '../../types'
import type { BreadcrumbItem } from '../../types/components'

interface TemasideTrailBreadcrumbContext {
  contentTitle?: string
  temasideLastPath: string | null
  trailByPath: Record<string, BreadcrumbItem[]>
  sanitizeTemasideItems: (items: BreadcrumbItem[]) => BreadcrumbItem[]
}

interface ActiveBreadcrumbCandidates {
  fallbackBreadcrumbItems: BreadcrumbItem[]
  linkHierarchyBreadcrumbItems: BreadcrumbItem[]
  temasideCanonicalBreadcrumbItems: BreadcrumbItem[]
  relatedTemasideBreadcrumbItems: BreadcrumbItem[]
  extendedTemasideBreadcrumbItems: BreadcrumbItem[]
  temasideBreadcrumbItems: BreadcrumbItem[]
}

interface RelatedTemasideContext {
  content?: ContentDetail
  sourceTemasideContent?: ContentDetail
  sourceTemasideCategoryPath: string | null
  sourceTemasideCategoryTitle?: string
}

interface ExtendedTemasideContext extends RelatedTemasideContext {
  sourceContentId: string | null
  sourceContentTitle: string | null
}

export function buildFallbackBreadcrumbItems(content?: ContentDetail): BreadcrumbItem[] {
  if (!content) return []

  return [
    { label: 'Forside', href: '/' },
    { label: content.title, href: '#' },
  ]
}

export function buildLinkHierarchyBreadcrumbItems(content?: ContentDetail): BreadcrumbItem[] {
  if (!content) return []

  const rootLink = content.links?.find((link) => link.rel === 'root')
  const parentLink = content.links?.find((link) => link.rel === 'forelder')
  const rootContentId = getContentIdFromHref(rootLink?.href)
  const parentContentId = getContentIdFromHref(parentLink?.href)

  if (!rootContentId && !parentContentId) {
    return []
  }

  return [
    { label: 'Forside', href: '/' },
    ...(rootContentId && rootLink?.tittel && rootContentId !== content.id
      ? [{ label: rootLink.tittel, href: buildContentUrl({ id: rootContentId }) }]
      : []),
    ...(parentContentId &&
    parentLink?.tittel &&
    parentContentId !== content.id &&
    parentContentId !== rootContentId
      ? [{ label: parentLink.tittel, href: buildContentUrl({ id: parentContentId }) }]
      : []),
    { label: content.title, href: '#' },
  ]
}

export function buildTemasideCanonicalBreadcrumbItems(
  content: ContentDetail | undefined,
  temasideCategoryPath: string | null,
  temasideCategoryTitle?: string,
): BreadcrumbItem[] {
  if (!content || content.content_type !== 'temaside' || !temasideCategoryPath) {
    return []
  }

  return [
    { label: 'Forside', href: '/' },
    {
      label: temasideCategoryTitle || content.title,
      href: temasideCategoryPath,
    },
    ...(temasideCategoryTitle !== content.title ? [{ label: content.title, href: '#' }] : []),
  ]
}

export function buildRelatedTemasideBreadcrumbItems(
  context: RelatedTemasideContext,
): BreadcrumbItem[] {
  const {
    content,
    sourceTemasideContent,
    sourceTemasideCategoryPath,
    sourceTemasideCategoryTitle,
  } = context

  if (
    !content ||
    content.content_type === 'temaside' ||
    !sourceTemasideContent ||
    !sourceTemasideCategoryPath
  ) {
    return []
  }

  return [
    { label: 'Forside', href: '/' },
    {
      label: sourceTemasideCategoryTitle || sourceTemasideContent.title,
      href: sourceTemasideCategoryPath,
    },
    {
      label: sourceTemasideContent.title,
      href: `${sourceTemasideCategoryPath}/${sourceTemasideContent.id}`,
    },
    { label: content.title, href: '#' },
  ]
}

export function buildExtendedTemasideBreadcrumbItems(
  context: ExtendedTemasideContext,
): BreadcrumbItem[] {
  const {
    content,
    sourceTemasideContent,
    sourceTemasideCategoryPath,
    sourceTemasideCategoryTitle,
    sourceContentId,
    sourceContentTitle,
  } = context

  if (
    !content ||
    content.content_type === 'temaside' ||
    !sourceTemasideContent ||
    !sourceTemasideCategoryPath ||
    !sourceContentId ||
    !sourceContentTitle ||
    sourceContentId === sourceTemasideContent.id ||
    sourceContentId === content.id
  ) {
    return []
  }

  return [
    { label: 'Forside', href: '/' },
    {
      label: sourceTemasideCategoryTitle || sourceTemasideContent.title,
      href: sourceTemasideCategoryPath,
    },
    {
      label: sourceTemasideContent.title,
      href: `${sourceTemasideCategoryPath}/${sourceTemasideContent.id}`,
    },
    { label: sourceContentTitle, href: `${sourceTemasideCategoryPath}/${sourceContentId}` },
    { label: content.title, href: '#' },
  ]
}

export function buildTemasideTrailBreadcrumbItems(
  context: TemasideTrailBreadcrumbContext,
): BreadcrumbItem[] {
  const { contentTitle, temasideLastPath, trailByPath, sanitizeTemasideItems } = context

  if (!temasideLastPath) {
    return []
  }

  const trail = trailByPath[temasideLastPath]
  if (!trail) return []

  const sanitizedTrail = sanitizeTemasideItems(trail.slice(0, Math.max(trail.length - 1, 0)))
  return [...sanitizedTrail, { label: contentTitle || 'Laster...', href: '#' }]
}

export function resolveActiveContentDetailBreadcrumbs({
  temasideCanonicalBreadcrumbItems,
  extendedTemasideBreadcrumbItems,
  relatedTemasideBreadcrumbItems,
  linkHierarchyBreadcrumbItems,
  temasideBreadcrumbItems,
  fallbackBreadcrumbItems,
}: ActiveBreadcrumbCandidates): BreadcrumbItem[] {
  if (temasideCanonicalBreadcrumbItems.length > 0) {
    return temasideCanonicalBreadcrumbItems
  }

  if (extendedTemasideBreadcrumbItems.length > 0) {
    return extendedTemasideBreadcrumbItems
  }

  if (relatedTemasideBreadcrumbItems.length > 0) {
    return relatedTemasideBreadcrumbItems
  }

  if (linkHierarchyBreadcrumbItems.length > 0) {
    return linkHierarchyBreadcrumbItems
  }

  if (temasideBreadcrumbItems.length > 0) {
    return temasideBreadcrumbItems
  }

  return fallbackBreadcrumbItems
}
