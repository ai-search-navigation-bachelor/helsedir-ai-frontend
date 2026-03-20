import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import type Highcharts from 'highcharts'
import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import type { ContentStatisticsResponse, StatisticPoint, StatisticSeries } from '../../../types'

const ALL_FILTER_VALUE = '__all__'
const CHART_COLORS = ['#025169', '#b45309', '#0f766e', '#4338ca', '#be123c', '#7c3aed', '#0369a1', '#15803d']
const MAX_SELECTED_LOCATIONS = 8

type LocationMode = 'average' | 'all' | 'custom'

const numberFormatter = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 })
const yearFormatter = new Intl.DateTimeFormat('nb-NO', { year: 'numeric' })
const monthFormatter = new Intl.DateTimeFormat('nb-NO', { month: 'short', year: 'numeric' })

interface ContentStatisticsSectionProps {
  statistics?: ContentStatisticsResponse
  isLoading?: boolean
  error?: Error | null
}

interface PreparedStatisticPoint {
  index: number
  x: string
  parsedX: number | null
  y: number
  location: string | null
  parent_location: string | null
  period_type: string | null
}

interface PreparedMeasure {
  name: string
  points: PreparedStatisticPoint[]
  xMode: 'datetime' | 'category'
  locations: string[]
  parentLocations: string[]
  periodTypes: string[]
}

interface PreparedStatisticsModel {
  measureNames: string[]
  measuresByName: Map<string, PreparedMeasure>
}


function toUniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))))
}

function getNormalizedText(value: string | null | undefined) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function parseTimestamp(value: string | null | undefined) {
  const normalized = getNormalizedText(value)
  if (!normalized) return null
  const timestamp = Date.parse(normalized)
  return Number.isNaN(timestamp) ? null : timestamp
}

function getPointTimeRangeLabel(point: StatisticPoint) {
  const timeFrom = getNormalizedText(point.time_from)
  const timeTo = getNormalizedText(point.time_to)
  if (timeFrom && timeTo) {
    return timeFrom === timeTo ? timeFrom : `${timeFrom} - ${timeTo}`
  }
  return timeFrom || timeTo
}

function getPointCategory(point: StatisticPoint, index: number) {
  const x = getNormalizedText(point.x)
  if (x) return x

  const fallbackParts = [
    getPointTimeRangeLabel(point),
    getNormalizedText(point.location),
    getNormalizedText(point.parent_location),
    getNormalizedText(point.period_type),
  ].filter((value): value is string => Boolean(value))

  if (fallbackParts.length > 0) {
    return fallbackParts.join(' / ')
  }

  return `Punkt ${index + 1}`
}

function getPointLocation(point: StatisticPoint) {
  return getNormalizedText(point.location)
}

function getPointParentLocation(point: StatisticPoint) {
  return getNormalizedText(point.parent_location)
}

function getPointPeriodType(point: StatisticPoint) {
  return getNormalizedText(point.period_type)
}

function getPointValue(point: StatisticPoint) {
  return typeof point.y === 'number' && Number.isFinite(point.y) ? point.y : null
}

function getPointTimestamp(point: StatisticPoint) {
  return parseTimestamp(point.x) ?? parseTimestamp(point.time_from) ?? parseTimestamp(point.time_to)
}

function normalizeSeriesPoints(series: StatisticSeries) {
  const points: PreparedStatisticPoint[] = []
  series.points.forEach((point, index) => {
    const x = getPointCategory(point, index)
    const y = getPointValue(point)
    if (!x || y === null) return
    points.push({
      index,
      x,
      parsedX: getPointTimestamp(point),
      y,
      location: getPointLocation(point),
      parent_location: getPointParentLocation(point),
      period_type: getPointPeriodType(point),
    })
  })
  return points
}

function buildPreparedStatisticsModel(statistics?: ContentStatisticsResponse): PreparedStatisticsModel {
  const measuresByName = new Map<string, PreparedMeasure>()

  ;(statistics?.series ?? []).forEach((series) => {
    const points = normalizeSeriesPoints(series)
    const name = series.name.trim()
    const xMode = points.length > 0 && points.every((point) => point.parsedX !== null) ? 'datetime' : 'category'
    if (xMode === 'datetime') points.sort((left, right) => (left.parsedX ?? 0) - (right.parsedX ?? 0))

    measuresByName.set(name, {
      name,
      points,
      xMode,
      locations: toUniqueStrings(points.map((point) => point.location)),
      parentLocations: toUniqueStrings(points.map((point) => point.parent_location)),
      periodTypes: toUniqueStrings(points.map((point) => point.period_type)),
    })
  })

  const measureNames = (() => {
    const seriesNames = Array.from(measuresByName.keys())
    const fromDimensions = (statistics?.dimensions?.measures ?? []).filter((name) => measuresByName.has(name))
    if (fromDimensions.length > 0) {
      return Array.from(new Set([...fromDimensions, ...seriesNames]))
    }
    return seriesNames
  })()

  return { measureNames, measuresByName }
}

function formatTimestampLabel(timestamp: number) {
  const date = new Date(timestamp)
  const isWholeYearValue =
    (date.getUTCMonth() === 11 && date.getUTCDate() === 31) ||
    (date.getUTCMonth() === 0 && date.getUTCDate() === 1)
  return isWholeYearValue ? yearFormatter.format(date) : monthFormatter.format(date)
}

function formatPointLabel(point: PreparedStatisticPoint, xMode: PreparedMeasure['xMode']) {
  if (xMode === 'datetime' && point.parsedX !== null) return formatTimestampLabel(point.parsedX)
  return point.x
}

function getFallbackMessage(statistics?: ContentStatisticsResponse) {
  if (statistics?.message) return statistics.message
  switch (statistics?.statistics_status) {
    case 'not_configured': return 'Det er ikke konfigurert statistikk for denne siden.'
    case 'empty': return 'Det finnes ingen tilgjengelige datapunkter for denne siden akkurat nå.'
    case 'unavailable': return 'Statistikken er midlertidig utilgjengelig.'
    default: return 'Denne siden har ingen visbar statistikk.'
  }
}

function getLocationOptions(measure?: PreparedMeasure, statistics?: ContentStatisticsResponse) {
  if (measure && measure.locations.length > 0) return measure.locations
  return statistics?.dimensions?.locations ?? []
}

function getParentLocationOptions(measure?: PreparedMeasure, statistics?: ContentStatisticsResponse) {
  if (measure && measure.parentLocations.length > 0) return measure.parentLocations
  return statistics?.dimensions?.parent_locations ?? []
}

function getPeriodTypeOptions(measure?: PreparedMeasure, statistics?: ContentStatisticsResponse) {
  if (measure && measure.periodTypes.length > 0) return measure.periodTypes
  return statistics?.dimensions?.period_types ?? []
}

function sortPointsByMode(points: PreparedStatisticPoint[], xMode: PreparedMeasure['xMode'] | undefined) {
  const copy = [...points]
  if (xMode === 'datetime') return copy.sort((left, right) => (left.parsedX ?? 0) - (right.parsedX ?? 0))
  return copy.sort((left, right) => left.index - right.index)
}

function filterPoints(
  points: PreparedStatisticPoint[],
  selectedLocation: string,
  selectedParentLocation: string,
  selectedPeriodType: string,
) {
  return points.filter((point) => {
    if (selectedLocation !== ALL_FILTER_VALUE && point.location !== selectedLocation) return false
    if (selectedParentLocation !== ALL_FILTER_VALUE && point.parent_location !== selectedParentLocation) return false
    if (selectedPeriodType !== ALL_FILTER_VALUE && point.period_type !== selectedPeriodType) return false
    return true
  })
}

function buildCategoryAxisValues(seriesCollection: PreparedStatisticPoint[][]) {
  const seen = new Set<string>()
  const categories: string[] = []
  seriesCollection.forEach((points) => {
    points.forEach((point) => {
      if (seen.has(point.x)) return
      seen.add(point.x)
      categories.push(point.x)
    })
  })
  return categories
}

function buildSeriesData(
  points: PreparedStatisticPoint[],
  xMode: PreparedMeasure['xMode'],
  categories: string[],
) {
  if (xMode === 'datetime') {
    return points
      .filter((point): point is PreparedStatisticPoint & { parsedX: number } => point.parsedX !== null)
      .map((point) => [point.parsedX, point.y] as [number, number])
  }
  const valueByCategory = new Map<string, number>()
  points.forEach((point) => { valueByCategory.set(point.x, point.y) })
  return categories.map((category) => valueByCategory.get(category) ?? null)
}

function buildSumPoints(points: PreparedStatisticPoint[], xMode: PreparedMeasure['xMode']) {
  const grouped = new Map<string, { x: string; parsedX: number | null; sum: number }>()
  points.forEach((point) => {
    const key = xMode === 'datetime' && point.parsedX !== null ? String(point.parsedX) : point.x
    const current = grouped.get(key) ?? { x: point.x, parsedX: point.parsedX, sum: 0 }
    current.sum += point.y
    grouped.set(key, current)
  })
  const summedPoints = Array.from(grouped.values()).map((group, index) => ({
    index,
    x: group.x,
    parsedX: group.parsedX,
    y: group.sum,
    location: null,
    parent_location: null,
    period_type: null,
  }))
  return sortPointsByMode(summedPoints, xMode)
}

function buildAveragePoints(points: PreparedStatisticPoint[], xMode: PreparedMeasure['xMode']) {
  const grouped = new Map<string, { x: string; parsedX: number | null; values: number[] }>()
  points.forEach((point) => {
    const key = xMode === 'datetime' && point.parsedX !== null ? String(point.parsedX) : point.x
    const current = grouped.get(key) ?? { x: point.x, parsedX: point.parsedX, values: [] }
    current.values.push(point.y)
    grouped.set(key, current)
  })
  const averagedPoints = Array.from(grouped.values()).map((group, index) => ({
    index,
    x: group.x,
    parsedX: group.parsedX,
    y: group.values.reduce((sum, value) => sum + value, 0) / group.values.length,
    location: null,
    parent_location: null,
    period_type: null,
  }))
  return sortPointsByMode(averagedPoints, xMode)
}



// ─── Sub-components ──────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  options,
  onChange,
  defaultOptionLabel = 'Alle',
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  defaultOptionLabel?: string
}) {
  if (options.length === 0) return null
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '7px 12px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: 'white',
          fontSize: '0.875rem',
          color: '#1e293b',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value={ALL_FILTER_VALUE}>{defaultOptionLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  )
}

function LocationSelector({
  locations,
  mode,
  customLocations,
  onModeChange,
  onCustomLocationsChange,
}: {
  locations: string[]
  mode: LocationMode
  customLocations: Set<string>
  onModeChange: (mode: LocationMode) => void
  onCustomLocationsChange: (locations: Set<string>) => void
}) {
  if (locations.length <= 1) return null

  const customArray = Array.from(customLocations)
  const availableToAdd = locations.filter((loc) => !customLocations.has(loc))
  const atLimit = customLocations.size >= MAX_SELECTED_LOCATIONS

  const presetButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 14px',
    borderRadius: 8,
    border: `1.5px solid ${active ? '#025169' : '#e2e8f0'}`,
    background: active ? '#025169' : 'white',
    color: active ? 'white' : '#475569',
    fontSize: '0.8125rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
        Lokasjoner
      </span>

      {/* Mode presets */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          style={presetButtonStyle(mode === 'average')}
          onClick={() => { onModeChange('average'); onCustomLocationsChange(new Set()) }}
        >
          Gjennomsnitt
        </button>
        <button
          type="button"
          style={presetButtonStyle(mode === 'all')}
          onClick={() => { onModeChange('all'); onCustomLocationsChange(new Set()) }}
        >
          Alle
        </button>

        <span style={{ color: '#cbd5e1', userSelect: 'none' }}>|</span>

        {/* Custom chips */}
        {customArray.map((loc, i) => (
          <span
            key={loc}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: CHART_COLORS[i % CHART_COLORS.length],
              color: 'white',
              padding: '4px 10px 4px 12px',
              borderRadius: 999,
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {loc}
            <button
              type="button"
              aria-label={`Fjern ${loc}`}
              onClick={() => {
                const next = new Set(customLocations)
                next.delete(loc)
                onCustomLocationsChange(next)
                if (next.size === 0) onModeChange('average')
              }}
              style={{
                background: 'rgba(255,255,255,0.25)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </span>
        ))}

        {/* Add dropdown */}
        {!atLimit && availableToAdd.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              const next = new Set(customLocations)
              next.add(e.target.value)
              onModeChange('custom')
              onCustomLocationsChange(next)
            }}
            style={{
              padding: '5px 10px',
              borderRadius: 8,
              border: '1px dashed #94a3b8',
              background: 'white',
              color: '#475569',
              fontSize: '0.8125rem',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="">+ Legg til lokasjon</option>
            {availableToAdd.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        )}
      </div>

    </div>
  )
}


type ViewMode = 'chart' | 'table'

function DataTable({
  seriesList,
  allRows,
  seriesColors,
}: {
  seriesList: Array<{ name: string; map: Map<string, number> }>
  allRows: Array<{ label: string; key: string }>
  seriesColors: string[]
}) {
  const MAX_ROWS = 200
  const displayRows = allRows.slice(0, MAX_ROWS)
  const truncated = allRows.length > MAX_ROWS

  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight: '32rem', overflowY: 'auto', borderRadius: 12, border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc' }}>
                Periode
              </th>
              {seriesList.map((series, i) => (
                <th
                  key={series.name}
                  style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc' }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: seriesColors[i % seriesColors.length], display: 'inline-block', flexShrink: 0 }} />
                    {series.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={row.key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '8px 16px', color: '#475569', whiteSpace: 'nowrap' }}>{row.label}</td>
                {seriesList.map((series) => {
                  const val = series.map.get(row.key)
                  return (
                    <td key={series.name} style={{ padding: '8px 16px', textAlign: 'right', color: val !== undefined ? '#1e293b' : '#94a3b8', fontWeight: val !== undefined ? 500 : 400 }}>
                      {val !== undefined ? numberFormatter.format(val) : '–'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {truncated && (
        <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
          Viser de første {MAX_ROWS} av {allRows.length} rader.
        </p>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ContentStatisticsSection({
  statistics,
  isLoading = false,
  error,
}: ContentStatisticsSectionProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<Highcharts.Chart | null>(null)

  const preparedStatistics = useMemo(() => buildPreparedStatisticsModel(statistics), [statistics])
  const measureOptions = preparedStatistics.measureNames

  const [selectedMeasure, setSelectedMeasure] = useState('')
  const [locationMode, setLocationMode] = useState<LocationMode>('average')
  const [customLocations, setCustomLocations] = useState<Set<string>>(new Set())
  const [selectedParentLocation, setSelectedParentLocation] = useState(ALL_FILTER_VALUE)
  const [selectedPeriodType, setSelectedPeriodType] = useState(ALL_FILTER_VALUE)
  const [viewMode, setViewMode] = useState<ViewMode>('chart')
  const [showAverage, setShowAverage] = useState(false)
  const [isChartRendering, setIsChartRendering] = useState(false)
  const [chartRenderError, setChartRenderError] = useState<string | null>(null)

  const deferredMeasure = useDeferredValue(selectedMeasure)
  const deferredLocationMode = useDeferredValue(locationMode)
  const deferredCustomLocations = useDeferredValue(customLocations)
  const deferredParentLocation = useDeferredValue(selectedParentLocation)
  const deferredPeriodType = useDeferredValue(selectedPeriodType)
  const deferredShowAverage = useDeferredValue(showAverage)

  const isFilterPending =
    selectedMeasure !== deferredMeasure ||
    locationMode !== deferredLocationMode ||
    customLocations !== deferredCustomLocations ||
    selectedParentLocation !== deferredParentLocation ||
    selectedPeriodType !== deferredPeriodType ||
    showAverage !== deferredShowAverage

  useEffect(() => {
    if (measureOptions.length === 0) { setSelectedMeasure(''); return }
    setSelectedMeasure((current) => (measureOptions.includes(current) ? current : measureOptions[0]))
  }, [measureOptions])

  useEffect(() => {
    setLocationMode('average')
    setCustomLocations(new Set())
  }, [selectedMeasure])

  const selectedMeasureModel = useMemo(
    () =>
      preparedStatistics.measuresByName.get(deferredMeasure) ??
      preparedStatistics.measuresByName.get(measureOptions[0]) ??
      null,
    [deferredMeasure, measureOptions, preparedStatistics.measuresByName],
  )

  const locationOptions = useMemo(
    () => getLocationOptions(selectedMeasureModel ?? undefined, statistics),
    [selectedMeasureModel, statistics],
  )
  const parentLocationOptions = useMemo(
    () => getParentLocationOptions(selectedMeasureModel ?? undefined, statistics),
    [selectedMeasureModel, statistics],
  )
  const periodTypeOptions = useMemo(
    () => getPeriodTypeOptions(selectedMeasureModel ?? undefined, statistics),
    [selectedMeasureModel, statistics],
  )

  useEffect(() => {
    setCustomLocations((current) => {
      if (current.size === 0) return current
      const next = new Set(Array.from(current).filter((loc: string) => locationOptions.includes(loc)))
      return next.size === current.size ? current : next
    })
  }, [locationOptions])

  // One resolved series per displayed line — drives both chart and table
  const resolvedSeries = useMemo((): Array<{ name: string; points: PreparedStatisticPoint[]; isBaseline?: boolean }> => {
    if (!selectedMeasureModel) return []
    const xMode = selectedMeasureModel.xMode
    const hasMultipleLocations = locationOptions.length > 1
    const allFiltered = sortPointsByMode(
      filterPoints(selectedMeasureModel.points, ALL_FILTER_VALUE, deferredParentLocation, deferredPeriodType),
      xMode,
    )

    if (deferredLocationMode === 'average') {
      if (allFiltered.length === 0) return []
      const points = hasMultipleLocations ? buildAveragePoints(allFiltered, xMode) : allFiltered
      const name = hasMultipleLocations ? 'Gjennomsnitt' : selectedMeasureModel.name
      return [{ name, points }]
    }

    if (deferredLocationMode === 'all') {
      if (allFiltered.length === 0) return []
      return [{ name: 'Totalt', points: buildSumPoints(allFiltered, xMode) }]
    }

    // custom
    const customSeries = Array.from(deferredCustomLocations).map((loc) => ({
      name: loc,
      points: sortPointsByMode(
        filterPoints(selectedMeasureModel.points, loc, deferredParentLocation, deferredPeriodType),
        xMode,
      ),
    }))

    if (deferredShowAverage && hasMultipleLocations && customSeries.length > 0) {
      const avgPoints = buildAveragePoints(allFiltered, xMode)
      return [...customSeries, { name: 'Gjennomsnitt', points: avgPoints, isBaseline: true }]
    }

    return customSeries
  }, [selectedMeasureModel, deferredLocationMode, deferredCustomLocations, deferredParentLocation, deferredPeriodType, deferredShowAverage, locationOptions.length])

  const categoryAxisValues = useMemo(() => {
    if (selectedMeasureModel?.xMode !== 'category') return []
    return buildCategoryAxisValues(resolvedSeries.map((s) => s.points))
  }, [selectedMeasureModel, resolvedSeries])

  const chartSeries = useMemo<Highcharts.SeriesOptionsType[]>(() => {
    if (!selectedMeasureModel) return []
    const xMode = selectedMeasureModel.xMode
    const nonBaseline = resolvedSeries.filter((s) => !s.isBaseline)
    const single = nonBaseline.length === 1 && resolvedSeries.length === 1
    return resolvedSeries.map((series, i) => ({
      type: 'line',
      name: series.name,
      data: buildSeriesData(series.points, xMode, categoryAxisValues),
      color: series.isBaseline ? '#94a3b8' : CHART_COLORS[i % CHART_COLORS.length],
      dashStyle: series.isBaseline ? ('ShortDash' as const) : ('Solid' as const),
      lineWidth: single ? 3 : series.isBaseline ? 1.5 : 2.5,
      marker: { enabled: !series.isBaseline && series.points.length <= 48, radius: single ? 4 : 3 },
    } as Highcharts.SeriesOptionsType))
  }, [selectedMeasureModel, resolvedSeries, categoryAxisValues])

  const tableData = useMemo(() => {
    if (!selectedMeasureModel || resolvedSeries.length === 0) return null
    const xMode = selectedMeasureModel.xMode
    const seen = new Set<string>()
    const allRows: Array<{ label: string; key: string }> = []
    resolvedSeries.forEach(({ points }) => {
      points.forEach((p) => {
        const key = xMode === 'datetime' && p.parsedX !== null ? String(p.parsedX) : p.x
        if (!seen.has(key)) {
          seen.add(key)
          allRows.push({ label: formatPointLabel(p, xMode), key })
        }
      })
    })
    const seriesList = resolvedSeries.map(({ name, points }) => ({
      name,
      map: new Map(points.map((p) => {
        const key = xMode === 'datetime' && p.parsedX !== null ? String(p.parsedX) : p.x
        return [key, p.y]
      })),
    }))
    return { seriesList, allRows }
  }, [selectedMeasureModel, resolvedSeries])


  const hasChartData = chartSeries.length > 0

  const chartOptions = useMemo<Highcharts.Options>(() => ({
    chart: {
      type: 'line',
      backgroundColor: 'transparent',
      spacingTop: 20,
      spacingRight: 20,
      spacingBottom: 12,
      spacingLeft: 8,
      animation: false,
      zooming: {
        type: selectedMeasureModel?.xMode === 'datetime' ? 'x' : undefined,
      },
      style: { fontFamily: '"Open Sans", sans-serif' },
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      enabled: chartSeries.length > 1,
      itemStyle: { color: '#334155', fontWeight: '500', fontSize: '13px' },
      margin: 20,
    },
    xAxis: {
      ...(selectedMeasureModel?.xMode === 'datetime'
        ? { type: 'datetime' as const, ordinal: false }
        : { categories: categoryAxisValues }),
      crosshair: true,
      lineColor: '#cbd5e1',
      tickColor: '#cbd5e1',
      labels: {
        style: { color: '#64748b', fontSize: '12px' },
        formatter() {
          if (selectedMeasureModel?.xMode === 'datetime') return formatTimestampLabel(Number(this.value))
          return String(this.value ?? '')
        },
      },
    },
    yAxis: {
      title: { text: undefined },
      gridLineColor: '#e2e8f0',
      labels: {
        style: { color: '#475569', fontSize: '12px' },
        formatter() { return numberFormatter.format(Number(this.value)) },
      },
    },
    tooltip: {
      shared: true,
      backgroundColor: 'white',
      borderColor: '#e2e8f0',
      borderRadius: 10,
      shadow: { color: 'rgba(0,0,0,0.08)', offsetX: 0, offsetY: 4, width: 16 },
      style: { fontSize: '13px', color: '#1e293b' },
      valueDecimals: 2,
      headerFormat:
        selectedMeasureModel?.xMode === 'datetime'
          ? '<span style="font-size:0.75rem;color:#64748b">{point.key:%e. %b %Y}</span><br/>'
          : '<span style="font-size:0.75rem;color:#64748b">{point.key}</span><br/>',
    },
    plotOptions: {
      series: { animation: false, turboThreshold: 0, stickyTracking: false },
      line: { marker: { enabled: true, radius: 3 } },
    },
    series: chartSeries,
  }), [categoryAxisValues, chartSeries, selectedMeasureModel?.xMode])

  useEffect(() => {
    if (!chartContainerRef.current || !hasChartData) {
      chartInstanceRef.current?.destroy()
      chartInstanceRef.current = null
      setIsChartRendering(false)
      setChartRenderError(null)
      return
    }

    let isCancelled = false
    const container = chartContainerRef.current
    setIsChartRendering(true)
    setChartRenderError(null)

    void (async () => {
      const HighchartsModule = await import('highcharts')
      if (isCancelled) return

      if (!chartInstanceRef.current) {
        chartInstanceRef.current = HighchartsModule.default.chart(container, chartOptions)
        if (!isCancelled) setIsChartRendering(false)
        return
      }

      chartInstanceRef.current.update(chartOptions, true, true, false)
      if (!isCancelled) setIsChartRendering(false)
    })().catch(() => {
      if (!isCancelled) {
        setIsChartRendering(false)
        setChartRenderError('Kunne ikke vise diagrammet akkurat nå.')
      }
    })

    return () => { isCancelled = true }
  }, [chartOptions, hasChartData])

  useEffect(() => () => {
    chartInstanceRef.current?.destroy()
    chartInstanceRef.current = null
  }, [])

  // ─── Loading / error / empty states ────────────────────────────────────────

  if (isLoading) {
    return (
      <section style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 16 }}>
          Statistikk
        </Heading>
        <div style={{ height: 380, borderRadius: 12, background: '#f8fafc' }} />
      </section>
    )
  }

  if (error) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 0 }}>Statistikk</Heading>
        <Alert data-color="warning">
          <Paragraph style={{ margin: 0 }}>Kunne ikke hente statistikk akkurat nå.</Paragraph>
        </Alert>
      </section>
    )
  }

  if (!statistics) return null

  if (statistics.statistics_status === 'unavailable') {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 0 }}>Statistikk</Heading>
        <Alert data-color="warning">
          <Paragraph style={{ margin: 0 }}>{getFallbackMessage(statistics)}</Paragraph>
        </Alert>
      </section>
    )
  }

  if (!statistics.has_statistics) {
    return null
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <section style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: 'white', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 0 }}>
            Statistikk
          </Heading>
          {statistics.title && (
            <Paragraph style={{ marginTop: 4, marginBottom: 0, color: '#334155', fontWeight: 500 }}>
              {statistics.title}
            </Paragraph>
          )}
          {statistics.description && (
            <Paragraph data-size="sm" style={{ marginTop: 4, marginBottom: 0, color: '#64748b' }}>
              {statistics.description}
            </Paragraph>
          )}
        </div>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 3, background: '#f1f5f9', borderRadius: 8, padding: 3, flexShrink: 0, alignSelf: 'flex-start' }}>
          {([['chart', 'Diagram'], ['table', 'Tabell']] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 500,
                transition: 'all 0.15s',
                background: viewMode === mode ? 'white' : 'transparent',
                color: viewMode === mode ? '#025169' : '#64748b',
                boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Controls row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <FilterSelect
            label="Måling"
            value={selectedMeasure}
            options={measureOptions}
            onChange={(value) => startTransition(() => setSelectedMeasure(value))}
            defaultOptionLabel="Velg måling"
          />
          <FilterSelect
            label="Periode"
            value={selectedPeriodType}
            options={periodTypeOptions}
            onChange={(value) => startTransition(() => setSelectedPeriodType(value))}
          />
          <FilterSelect
            label="Overordnet geografi"
            value={selectedParentLocation}
            options={parentLocationOptions}
            onChange={(value) => startTransition(() => setSelectedParentLocation(value))}
          />
          {(selectedParentLocation !== ALL_FILTER_VALUE || selectedPeriodType !== ALL_FILTER_VALUE) && (
            <button
              type="button"
              onClick={() => startTransition(() => {
                setSelectedParentLocation(ALL_FILTER_VALUE)
                setSelectedPeriodType(ALL_FILTER_VALUE)
              })}
              style={{
                padding: '7px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: 'white',
                fontSize: '0.8125rem',
                color: '#64748b',
                cursor: 'pointer',
                alignSelf: 'flex-end',
              }}
            >
              Nullstill filtre
            </button>
          )}
        </div>

        {/* Location selector */}
        <LocationSelector
          locations={locationOptions}
          mode={locationMode}
          customLocations={customLocations}
          onModeChange={(m) => startTransition(() => { setLocationMode(m); setShowAverage(false) })}
          onCustomLocationsChange={(next) => startTransition(() => setCustomLocations(next))}
        />

        {/* Show average baseline toggle — only in custom mode with multiple locations */}
        {locationMode === 'custom' && locationOptions.length > 1 && customLocations.size > 0 && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', width: 'fit-content' }}>
            <input
              type="checkbox"
              checked={showAverage}
              onChange={(e) => startTransition(() => setShowAverage(e.target.checked))}
              style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#025169' }}
            />
            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
              Vis gjennomsnitt som sammenligning
            </span>
          </label>
        )}

{/* Chart render error */}
        {chartRenderError && viewMode === 'chart' && (
          <Alert data-color="warning">
            <Paragraph style={{ margin: 0 }}>{chartRenderError}</Paragraph>
          </Alert>
        )}

        {/* Chart — always in DOM so Highcharts instance is preserved; hidden when table view */}
        <div style={{ display: viewMode === 'chart' ? undefined : 'none' }}>
          <div style={{ position: 'relative' }}>
            {(isFilterPending || isChartRendering) && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.75)',
                zIndex: 2,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Oppdaterer…</span>
              </div>
            )}
            {hasChartData ? (
              <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '8px 4px' }}>
                {selectedMeasureModel?.xMode === 'datetime' && (
                  <p style={{ margin: '4px 16px 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Dra for å zoome inn på tidsperiode
                  </p>
                )}
                <div ref={chartContainerRef} style={{ minHeight: '24rem' }} />
              </div>
            ) : (
              <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 24 }}>
                <Paragraph style={{ margin: 0, color: '#475569' }}>
                  Ingen datapunkter tilgjengelig for valgt utsnitt.
                </Paragraph>
              </div>
            )}
          </div>
        </div>

        {/* Table — only mounted when table view */}
        {viewMode === 'table' && (
          tableData ? (
            <DataTable
              seriesList={tableData.seriesList}
              allRows={tableData.allRows}
              seriesColors={CHART_COLORS}
            />
          ) : (
            <div style={{ borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', padding: 24 }}>
              <Paragraph style={{ margin: 0, color: '#475569' }}>
                Ingen datapunkter tilgjengelig for valgt utsnitt.
              </Paragraph>
            </div>
          )
        )}

        {/* Footer */}
        {(statistics.nki_indicator_id || (statistics.attachments?.length ?? 0) > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: '0.8125rem', color: '#64748b', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            {statistics.nki_indicator_id && (
              <span>
                <span style={{ fontWeight: 600, color: '#475569' }}>Kilde:</span> {statistics.nki_indicator_id}
              </span>
            )}
            {(statistics.attachments ?? []).map((attachment) => (
              <a
                key={`${attachment.title ?? 'vedlegg'}-${attachment.url ?? ''}`}
                href={attachment.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#025169', textDecoration: 'none', fontWeight: 500 }}
                onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
              >
                {attachment.title ?? 'Vedlegg'} ↗
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
