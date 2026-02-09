import type { ContentDisplayProps } from '../../types/pages'
import { GenericContentDisplay } from './GenericContentDisplay'
import { RecommendationContentDisplay } from './RecommendationContentDisplay'
import { RetningslinjeContentDisplay } from './RetningslinjeContentDisplay'

const RETNINGSLINJE_TYPES = new Set(['retningslinje', 'nasjonal-faglig-retningslinje'])
const RECOMMENDATION_TYPES = new Set(['anbefaling', 'rad', 'pakkeforlop-anbefaling'])

export function ContentDisplay({ content }: ContentDisplayProps) {
  const normalizedType = content.content_type.trim().toLowerCase()

  if (RETNINGSLINJE_TYPES.has(normalizedType)) {
    return <RetningslinjeContentDisplay key={content.id} content={content} />
  }

  if (RECOMMENDATION_TYPES.has(normalizedType)) {
    return <RecommendationContentDisplay key={content.id} content={content} />
  }

  return <GenericContentDisplay key={content.id} content={content} />
}
