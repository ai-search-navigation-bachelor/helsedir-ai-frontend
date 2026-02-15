import type { ContentDisplayProps } from '../../types/pages'
import {
  isRecommendationContentType,
  isRetningslinjeContentType,
  normalizeContentType,
  toContentTypeLabel,
} from '../../constants/content'
import { DetailContentDisplay } from './detail/DetailContentDisplay'
import { HierarchicalContentDisplay } from './hierarchical/HierarchicalContentDisplay'
import { countUniqueChildLinks } from './shared/linkUtils'

export function ContentDisplay({ content }: ContentDisplayProps) {
  const normalizedType = normalizeContentType(content.content_type)
  const childrenCount = countUniqueChildLinks(content.links)
  const typeLabel = toContentTypeLabel(content.content_type)

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
