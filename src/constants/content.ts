export const RETNINGSLINJE_CONTENT_TYPES = new Set([
  'retningslinje',
  'nasjonal-faglig-retningslinje',
])

export const RECOMMENDATION_CONTENT_TYPES = new Set([
  'anbefaling',
  'rad',
  'pakkeforlop-anbefaling',
])

export const TEMASIDE_CONTENT_TYPES = new Set([
  'temaside',
  'tema-side',
])

export const EHELSESTANDARD_CONTENT_TYPES = new Set([
  'ehelsestandard',
])

const DETAIL_TYPE_LABEL_BY_CONTENT_TYPE: Record<string, string> = {
  anbefaling: 'Anbefaling',
  rad: 'Råd',
  'pakkeforlop-anbefaling': 'Pakkeforløp-anbefaling',
}

const TYPE_SEGMENT_LABEL_OVERRIDES: Record<string, string> = {
  api: 'API',
  pdf: 'PDF',
  pico: 'PICO',
}

const TYPE_LABEL_BY_CONTENT_TYPE: Record<string, string> = {
  ehelsestandard: 'Nasjonal e-helsestandard',
}

export function normalizeContentType(contentType?: string) {
  return contentType?.trim().toLowerCase() || ''
}

export function isRetningslinjeContentType(contentType: string) {
  return RETNINGSLINJE_CONTENT_TYPES.has(normalizeContentType(contentType))
}

export function isRecommendationContentType(contentType: string) {
  return RECOMMENDATION_CONTENT_TYPES.has(normalizeContentType(contentType))
}

export function isTemasideContentType(contentType: string) {
  return TEMASIDE_CONTENT_TYPES.has(normalizeContentType(contentType))
}

export function isEhelsestandardContentType(contentType: string) {
  return EHELSESTANDARD_CONTENT_TYPES.has(normalizeContentType(contentType))
}

export function getDetailContentTypeLabel(contentType: string) {
  return DETAIL_TYPE_LABEL_BY_CONTENT_TYPE[normalizeContentType(contentType)] || 'Innhold'
}

export function toContentTypeLabel(contentType: string) {
  const normalizedType = normalizeContentType(contentType)
  if (!normalizedType) return 'Innhold'
  if (TYPE_LABEL_BY_CONTENT_TYPE[normalizedType]) return TYPE_LABEL_BY_CONTENT_TYPE[normalizedType]

  return normalizedType
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => {
      const override = TYPE_SEGMENT_LABEL_OVERRIDES[segment]
      if (override) return override
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    })
    .join(' ')
}
