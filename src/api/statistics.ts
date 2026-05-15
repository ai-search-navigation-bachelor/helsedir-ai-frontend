/**
 * Content statistics API.
 *
 * Fetches usage statistics (e.g. page views, geographic breakdowns) for a given
 * content item. The response shape is normalised here because the backend may
 * return loosely typed numeric/string values; all coercion helpers in this module
 * are intentionally private — consumers always receive the typed
 * {@link ContentStatisticsResponse}.
 */
import type { BaseRequestOptions, ContentStatisticsResponse, StatisticPoint, StatisticSeries } from '../types'
import { BACKEND_BASE_URL } from './backendBaseUrl'

const JSON_HEADERS = {
  Accept: 'application/json',
} as const

function createEmptyStatisticsResponse(contentId: string): ContentStatisticsResponse {
  return {
    has_statistics: false,
    content_id: contentId,
    statistics_status: 'not_configured',
  }
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function asNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

function asDimensionString(value: unknown) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  return null
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const normalized = value.trim().replace(/\s+/g, '').replace(',', '.')
  if (!normalized) return null

  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : null
}

function toUniqueStringList(values: unknown) {
  if (!Array.isArray(values)) return undefined

  const normalized = values
    .map((value) => asDimensionString(value))
    .filter((value): value is string => Boolean(value))

  return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined
}

function extractDimensionEntries(rawValue: unknown) {
  if (!rawValue || typeof rawValue !== 'object') return {} as Record<string, string | null>

  return Object.entries(rawValue as Record<string, unknown>).reduce<Record<string, string | null>>((acc, [key, value]) => {
    const normalizedValue = asDimensionString(value)
    if (normalizedValue) {
      acc[key] = normalizedValue
    }
    return acc
  }, {})
}

function normalizeStatisticPoint(rawPoint: unknown): StatisticPoint | null {
  if (!rawPoint || typeof rawPoint !== 'object') return null

  const point = rawPoint as Record<string, unknown>
  const x = asNullableString(point.x)
  const y = asNumber(point.y)
  const location = asNullableString(point.location)

  const nestedDimensions = extractDimensionEntries(point.dimensions)
  const dimensions = Object.entries(point).reduce<Record<string, string | null>>((acc, [key, value]) => {
    if (key === 'y' || key === 'dimensions') return acc

    const normalizedValue = asDimensionString(value)
    if (normalizedValue) {
      acc[key] = normalizedValue
    }

    return acc
  }, { ...nestedDimensions })

  return {
    x,
    y,
    location,
    parent_location: asNullableString(point.parent_location),
    time_from: asNullableString(point.time_from),
    time_to: asNullableString(point.time_to),
    period_type: asNullableString(point.period_type),
    dimensions,
  }
}

function normalizeStatisticSeries(rawSeries: unknown, index: number): StatisticSeries | null {
  if (!rawSeries || typeof rawSeries !== 'object') return null

  const series = rawSeries as Record<string, unknown>
  const points = Array.isArray(series.points)
    ? series.points
        .map((point) => normalizeStatisticPoint(point))
        .filter((point): point is StatisticPoint => Boolean(point))
    : []

  return {
    name: asString(series.name)?.trim() || `Serie ${index + 1}`,
    points,
  }
}

function normalizeStatisticsResponse(
  contentId: string,
  payload: unknown,
): ContentStatisticsResponse {
  if (!payload || typeof payload !== 'object') {
    return createEmptyStatisticsResponse(contentId)
  }

  const record = payload as Record<string, unknown>
  const series = Array.isArray(record.series)
    ? record.series
        .map((entry, index) => normalizeStatisticSeries(entry, index))
        .filter((entry): entry is StatisticSeries => Boolean(entry))
    : []
  const dimensions =
    record.dimensions && typeof record.dimensions === 'object'
      ? (() => {
          const rawDimensions = record.dimensions as Record<string, unknown>
          const fields = Object.entries(rawDimensions).reduce<Record<string, string[]>>((acc, [key, value]) => {
            const normalized = toUniqueStringList(value)
            if (normalized && normalized.length > 0) {
              acc[key] = normalized
            }
            return acc
          }, {})

          return {
            measures: fields.measures,
            locations: fields.locations,
            parent_locations: fields.parent_locations,
            period_types: fields.period_types,
            fields,
          }
        })()
      : undefined
  const hasStatistics = record.has_statistics === true
  const status = asString(record.statistics_status)
  const attachments =
    Array.isArray(record.attachments)
      ? record.attachments.reduce<Array<{ title?: string | null; url?: string | null }>>((acc, entry) => {
          if (!entry || typeof entry !== 'object') return acc

          const attachment = entry as Record<string, unknown>
          acc.push({
            title: asNullableString(attachment.title),
            url: asNullableString(attachment.url),
          })

          return acc
        }, [])
      : undefined

  return {
    has_statistics: hasStatistics,
    statistics_status:
      status === 'available' ||
      status === 'unavailable' ||
      status === 'not_configured' ||
      status === 'empty'
        ? status
        : hasStatistics
          ? 'available'
          : 'not_configured',
    content_id: asString(record.content_id)?.trim() || contentId,
    nki_indicator_id: asNullableString(record.nki_indicator_id),
    title: asNullableString(record.title),
    description: asNullableString(record.description),
    attachments,
    series,
    dimensions,
    message: asNullableString(record.message),
  }
}

async function fetchStatisticsFromUrl(
  url: string,
  contentId: string,
  signal?: AbortSignal,
) {
  const response = await fetch(url, {
    method: 'GET',
    headers: JSON_HEADERS,
    signal,
  })

  if (response.status === 204) {
    return {
      ...createEmptyStatisticsResponse(contentId),
      statistics_status: 'empty' as const,
    }
  }

  if (!response.ok) {
    throw new Error(`Kunne ikke hente statistikk (${response.status} ${response.statusText}).`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error('Statistikk-endpoint returnerte ikke JSON.')
  }

  const payload = await response.json()
  return normalizeStatisticsResponse(contentId, payload)
}

export async function getContentStatistics(
  contentId: string,
  { signal }: BaseRequestOptions = {},
): Promise<ContentStatisticsResponse> {
  const trimmed = contentId.trim()

  if (!trimmed) {
    throw new Error('Content ID is required')
  }

  const encodedId = encodeURIComponent(trimmed)
  const url = `${BACKEND_BASE_URL}/content/${encodedId}/statistics`

  return fetchStatisticsFromUrl(url, trimmed, signal)
}
