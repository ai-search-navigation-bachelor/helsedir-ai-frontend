import {
  isEhelsestandardContentType,
  isRecommendationContentType,
  isRetningslinjeContentType,
  isTemasideContentType,
  normalizeContentType,
} from '../../constants/content'
import { countUniqueChildLinks } from './shared/linkUtils'
import type { ContentDetail } from '../../types'

export type ContentPresentationMode = 'temaside' | 'hierarchical' | 'detail'

type ContentPresentationInput = Pick<
  ContentDetail,
  'content_type' | 'links'
>

const HIERARCHICAL_SKELETON_HINT_TYPES = new Set([
  'rapport',
  'statistikk',
  'prioriteringsveileder',
  'nasjonalt-forlop',
])

function hasNavigableChildren(content: ContentPresentationInput) {
  return countUniqueChildLinks(content.links) > 0
}

export function resolveContentPresentation(content: ContentPresentationInput): ContentPresentationMode {
  const normalizedType = normalizeContentType(content.content_type)
  const hasChildren = hasNavigableChildren(content)

  if (isTemasideContentType(normalizedType)) {
    return 'temaside'
  }

  if (isRetningslinjeContentType(normalizedType)) {
    return 'hierarchical'
  }

  if (isRecommendationContentType(normalizedType)) {
    return normalizedType === 'rad' && hasChildren ? 'hierarchical' : 'detail'
  }

  return hasChildren ? 'hierarchical' : 'detail'
}

export function resolveContentPresentationFromHint(options: {
  routeContentType?: string
}): Exclude<ContentPresentationMode, 'temaside'> {
  const normalizedRouteContentType = normalizeContentType(options.routeContentType)

  if (
    isRecommendationContentType(normalizedRouteContentType) ||
    isEhelsestandardContentType(normalizedRouteContentType) ||
    normalizedRouteContentType === 'statistikkelement'
  ) {
    return 'detail'
  }

  if (
    isRetningslinjeContentType(normalizedRouteContentType) ||
    normalizedRouteContentType === 'kapittel' ||
    HIERARCHICAL_SKELETON_HINT_TYPES.has(normalizedRouteContentType)
  ) {
    return 'hierarchical'
  }

  return 'detail'
}
