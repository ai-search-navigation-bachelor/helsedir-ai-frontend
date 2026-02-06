import type { ContentDisplayProps } from '../../types/pages'
import { GenericContentDisplay } from './GenericContentDisplay'
import { RetningslinjeContentDisplay } from './RetningslinjeContentDisplay'

const RETNINGSLINJE_TYPES = new Set(['retningslinje', 'nasjonal-faglig-retningslinje'])

export function ContentDisplay({ content }: ContentDisplayProps) {
  const normalizedType = content.content_type.trim().toLowerCase()

  if (RETNINGSLINJE_TYPES.has(normalizedType)) {
    return <RetningslinjeContentDisplay key={content.id} content={content} />
  }

  return <GenericContentDisplay key={content.id} content={content} />
}
