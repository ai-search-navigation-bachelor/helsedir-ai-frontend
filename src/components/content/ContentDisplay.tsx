import type { ContentDisplayProps } from '../../types/pages'
import {
  toContentTypeLabel,
} from '../../constants/content'
import { DetailContentDisplay } from './detail/DetailContentDisplay'
import { HierarchicalContentDisplay } from './hierarchical/HierarchicalContentDisplay'
import { TemasideContentDisplay } from './temaside/TemasideContentDisplay'
import { resolveContentPresentation } from './contentPresentation'

export function ContentDisplay({ content }: ContentDisplayProps) {
  const typeLabel = toContentTypeLabel(content.content_type)
  const presentation = resolveContentPresentation(content)

  if (presentation === 'temaside') {
    return <TemasideContentDisplay key={content.id} content={content} />
  }

  if (presentation === 'hierarchical') {
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
