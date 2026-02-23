import type { ContentDetail } from '../../types'
import {
  isRecommendationContentType,
  isRetningslinjeContentType,
  isTemasideContentType,
  normalizeContentType,
  toContentTypeLabel,
} from '../../constants/content'
import { DetailContentDisplay } from './detail/DetailContentDisplay'
import { HierarchicalContentDisplay } from './hierarchical/HierarchicalContentDisplay'
import { TemasideContentDisplay } from './temaside/TemasideContentDisplay'
import { countUniqueChildLinks } from './shared/linkUtils'

/**
 * Content display props
 */
export interface ContentDisplayProps {
  content: ContentDetail
}

export function ContentDisplay({ content }: ContentDisplayProps) {
  const normalizedType = normalizeContentType(content.content_type)
  const childrenCount = countUniqueChildLinks(content.links)
  const typeLabel = toContentTypeLabel(content.content_type)

  if (isTemasideContentType(normalizedType)) {
    return <TemasideContentDisplay key={content.id} content={content} />
  }

  if (isRetningslinjeContentType(normalizedType)) {
    return <HierarchicalContentDisplay key={content.id} content={content} typeLabel={typeLabel} />
  }

  if (isRecommendationContentType(normalizedType)) {
    return <DetailContentDisplay key={content.id} content={content} />
  }

  if (childrenCount > 0) {
    return <HierarchicalContentDisplay key={content.id} content={content} typeLabel={typeLabel} />
  }

  return (
    <DetailContentDisplay
      key={content.id}
      content={content}
      typeLabelOverride={typeLabel}
      primarySectionTitle="Innhold"
    />
  )
}
