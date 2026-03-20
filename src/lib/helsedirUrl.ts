import { CONTENT_CATEGORY_GROUPS, CONTENT_ONLY_PREFIXES } from '../constants/contentRoutes'
import { TEMASIDE_CATEGORY_SLUGS } from '../constants/temasider'

const HELSEDIREKTORATET_BASE_URL = 'https://www.helsedirektoratet.no'
const INTERNAL_APP_ROUTE_PREFIXES = new Set([
  'content',
  'search',
  'dev',
  ...CONTENT_CATEGORY_GROUPS.map((group) => group.pathPrefix),
  ...CONTENT_ONLY_PREFIXES,
  ...TEMASIDE_CATEGORY_SLUGS,
])

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

function getPathnameFirstSegment(path: string) {
  return path.split('/').filter(Boolean)[0] || ''
}

export function isInternalAppPath(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed || !trimmed.startsWith('/')) return false
  if (trimmed === '/') return true

  return INTERNAL_APP_ROUTE_PREFIXES.has(getPathnameFirstSegment(trimmed))
}

export function toAbsoluteHelsedirUrl(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('//')) return null

  if (isAbsoluteHttpUrl(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return new URL(trimmed, HELSEDIREKTORATET_BASE_URL).toString()
  }

  return null
}

export function normalizeLinkForComparison(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null

  return toAbsoluteHelsedirUrl(trimmed) || trimmed
}
