export interface StatisticPoint {
  x?: string | null
  y?: number | null
  location?: string | null
  parent_location?: string | null
  time_from?: string | null
  time_to?: string | null
  period_type?: string | null
}

export interface StatisticSeries {
  name: string
  points: StatisticPoint[]
}

export interface StatisticsDimensions {
  measures?: string[]
  locations?: string[]
  parent_locations?: string[]
  period_types?: string[]
}

export interface ContentStatisticsResponse {
  has_statistics: boolean
  statistics_status?: 'available' | 'unavailable' | 'not_configured' | 'empty'
  content_id?: string
  nki_indicator_id?: string | null
  title?: string | null
  description?: string | null
  attachments?: Array<{
    title?: string | null
    url?: string | null
  }>
  series?: StatisticSeries[]
  dimensions?: StatisticsDimensions
  message?: string | null
}
