import type { ContentDisplayProps } from '../../types/pages'
import { DetailContentDisplay } from './detail/DetailContentDisplay'
import { HierarchicalContentDisplay } from './hierarchical/HierarchicalContentDisplay'

const RETNINGSLINJE_TYPES = new Set(['retningslinje', 'nasjonal-faglig-retningslinje'])
const RECOMMENDATION_TYPES = new Set(['anbefaling', 'rad', 'pakkeforlop-anbefaling'])

function toTypeLabel(contentType: string) {
  const trimmed = contentType.trim().toLowerCase()
  if (!trimmed) return 'Innhold'

  return trimmed
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export function ContentDisplay({ content }: ContentDisplayProps) {
  const normalizedType = content.content_type.trim().toLowerCase()
  const childrenCount = (() => {
    const uniqueChildren = new Set<string>()
    for (const link of content.links ?? []) {
      if (link.rel !== 'barn' || !link.href) continue
      uniqueChildren.add(link.href)
    }
    return uniqueChildren.size
  })()
  const typeLabel = toTypeLabel(content.content_type)

  if (RETNINGSLINJE_TYPES.has(normalizedType)) {
    return <HierarchicalContentDisplay key={content.id} content={content} typeLabel={typeLabel} />
  }

  if (RECOMMENDATION_TYPES.has(normalizedType)) {
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
