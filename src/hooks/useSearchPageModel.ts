/**
 * View-model hook for the SearchPage.
 *
 * Owns all search state: active tab, pagination, prefetching adjacent categories,
 * and synchronising URL params with the Zustand search store. Components on the
 * SearchPage should derive their data from this hook rather than reading stores
 * or query caches directly.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
  getMainCategoryBySubcategory,
  type SearchMainCategoryId,
} from '../constants/categories'
import { buildTabs } from '../lib/search/searchPageModel'
import { useSearchInfiniteQuery, prefetchCategorySearch } from './queries/useSearchInfiniteQuery'
import { useSearchStore } from '../stores/searchStore'
import { useRoleStore } from '../stores/roleStore'

type ActiveTab = SearchMainCategoryId | 'all'

const MAIN_CATEGORY_IDS: ReadonlySet<string> = new Set(
  SEARCH_MAIN_CATEGORIES.map((category) => category.id),
)

function isMainCategoryId(value: string): value is SearchMainCategoryId {
  return MAIN_CATEGORY_IDS.has(value)
}

function toActiveTab(rawCategory: string): ActiveTab {
  if (rawCategory === 'all') return 'all'
  if (isMainCategoryId(rawCategory)) return rawCategory
  return getMainCategoryBySubcategory(rawCategory) || 'all'
}

/**
 * Resolve which API category value to send for a given main tab.
 * Returns all subcategory info_type IDs as a comma-separated string.
 */
function toApiCategory(activeTab: ActiveTab): string | undefined {
  if (activeTab === 'all') return undefined

  const mainCategory = SEARCH_MAIN_CATEGORIES.find((c) => c.id === activeTab)
  if (!mainCategory) return undefined

  return mainCategory.subcategoryIds.join(',')
}

/**
 * Build tab-level category counts from the API's category_counts.
 * Aggregates subcategory counts into main category totals.
 */
function buildMainCategoryCountsFromApi(
  categoryCounts: Record<string, number>,
): Record<string, number> {
  const counts: Record<string, number> = {}

  SEARCH_MAIN_CATEGORIES.forEach((mainCategory) => {
    counts[mainCategory.id] = mainCategory.subcategoryIds.reduce(
      (sum, subcategoryId) => sum + (categoryCounts[subcategoryId] || 0),
      0,
    )
  })

  // Use raw sum of all category_counts for "Alle" to include any unmapped info_types
  counts.all = Object.values(categoryCounts).reduce((sum, value) => sum + value, 0)
  return counts
}

/**
 * Build a label for the active tab.
 */
function getActiveTabLabel(
  activeTab: ActiveTab,
  subcategoryLabels: Record<string, string>,
): string {
  if (activeTab === 'all') return 'Alle'
  const mainCategory = SEARCH_MAIN_CATEGORIES.find((c) => c.id === activeTab)
  return mainCategory?.label || subcategoryLabels[activeTab] || ''
}

export function useSearchPageModel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('query') || ''
  const rawCategory = (searchParams.get('category') || 'all').trim().toLowerCase()
  const activeTab = useMemo(() => toActiveTab(rawCategory), [rawCategory])
  const hasQuery = searchQuery.trim().length > 0

  const searchIdFromStore = useSearchStore((state) => state.searchId)
  const searchQueryFromStore = useSearchStore((state) => state.searchQuery)
  const searchRoleFromStore = useSearchStore((state) => state.searchRole)
  const setSearchData = useSearchStore((state) => state.setSearchData)

  const role = useRoleStore((state) => state.role)

  const apiCategory = useMemo(() => toApiCategory(activeTab), [activeTab])

  const queryClient = useQueryClient()

  // Compute search_id synchronously: only use stored search_id if query matches.
  // This prevents sending a stale search_id for new searches (backend must generate new).
  const trimmedQuery = searchQuery.trim()

  // Persist category counts across tab switches so we can skip empty categories
  const [knownCounts, setKnownCounts] = useState<Record<string, number>>({})
  const [knownCountsScope, setKnownCountsScope] = useState('')
  const roleKey = role ?? ''
  const countsScopeKey = `${trimmedQuery}::${roleKey}`

  // Reset counts when the search query or role changes (setState during render is the
  // recommended React pattern for adjusting state based on changed props)
  if (countsScopeKey !== knownCountsScope) {
    setKnownCounts({})
    setKnownCountsScope(countsScopeKey)
  }
  const effectiveSearchId =
    trimmedQuery &&
    trimmedQuery === searchQueryFromStore &&
    searchRoleFromStore === role
      ? searchIdFromStore || undefined
      : undefined

  // Skip API call if we already know this category has 0 results
  const categoryKnownEmpty =
    activeTab !== 'all' &&
    Object.keys(knownCounts).length > 0 &&
    (knownCounts[activeTab] || 0) === 0

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchInfiniteQuery(searchQuery, {
    enabled: hasQuery && !categoryKnownEmpty,
    category: apiCategory,
    search_id: effectiveSearchId,
    role: role ?? undefined,
  })

  const pages = data?.pages

  // Store search_id from first page response
  useEffect(() => {
    const firstPage = pages?.[0]
    if (firstPage?.search_id && trimmedQuery) {
      setSearchData(firstPage.search_id, trimmedQuery, role)
    }
  }, [pages, role, trimmedQuery, setSearchData])

  // Prefetch category pages lazily: wait a short while after results arrive so the
  // active tab's own fetch completes first, then stagger the remaining categories to
  // avoid overwhelming a single-worker backend with 5+ concurrent requests.
  const prefetchedForKey = useRef<string | null>(null)

  useEffect(() => {
    const fp = pages?.[0]
    if (!fp?.search_id || !fp.category_counts) return
    const cacheKey = `${fp.search_id}:${roleKey}`
    if (cacheKey === prefetchedForKey.current) return

    prefetchedForKey.current = cacheKey
    const { search_id, category_counts } = fp

    const categoriesToPrefetch = SEARCH_MAIN_CATEGORIES.filter((mainCategory) => {
      // Skip the currently active tab – it's already being fetched
      if (mainCategory.id === activeTab) return false
      return mainCategory.subcategoryIds.some(
        (id) => (category_counts[id] || 0) > 0,
      )
    })

    // Stagger prefetches so they don't all hit the backend at once
    const timers: ReturnType<typeof setTimeout>[] = []
    categoriesToPrefetch.forEach((mainCategory, i) => {
      timers.push(
        setTimeout(() => {
          prefetchCategorySearch(
            queryClient,
            searchQuery,
            mainCategory.subcategoryIds.join(','),
            search_id,
            role ?? undefined,
          )
        }, 600 + i * 400),
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [pages, queryClient, role, roleKey, searchQuery, activeTab])

  // Flatten all pages into a single results array with category metadata
  const allResults = useMemo(() => {
    if (!pages) return []

    return pages.flatMap((page) =>
      page.results.map((result) => {
        const mainCategoryId = getMainCategoryBySubcategory(result.info_type)
        const categoryLabel =
          SEARCH_SUBCATEGORY_LABELS[result.info_type as keyof typeof SEARCH_SUBCATEGORY_LABELS] ||
          result.info_type

        return {
          ...result,
          categoryName: categoryLabel,
          categoryId: mainCategoryId || result.info_type,
        }
      }),
    )
  }, [pages])

  // Use category_counts from the first page for tab counts
  const categoryCounts = useMemo(() => {
    const fp = pages?.[0]
    if (!fp?.category_counts) return {}
    return fp.category_counts
  }, [pages])

  const mainCategoryCounts = useMemo(
    () => buildMainCategoryCountsFromApi(categoryCounts),
    [categoryCounts],
  )

  // Update persisted counts when we get real data (typically from the "all" tab)
  const hasRealCounts = Object.keys(mainCategoryCounts).length > 0 && mainCategoryCounts.all > 0
  if (hasRealCounts && knownCounts !== mainCategoryCounts) {
    setKnownCounts(mainCategoryCounts)
  }

  // Use persisted counts when the current query has no data (e.g. disabled for empty category)
  const stableMainCategoryCounts = hasRealCounts ? mainCategoryCounts : knownCounts

  const tabs = useMemo(() => buildTabs(), [])
  const activeTabLabel = useMemo(
    () => getActiveTabLabel(activeTab, SEARCH_SUBCATEGORY_LABELS),
    [activeTab],
  )

  const total = useMemo(() => {
    const fp = pages?.[0]
    return fp?.total || 0
  }, [pages])

  // Sync URL category param
  useEffect(() => {
    if (rawCategory === activeTab) return

    setSearchParams(
      {
        query: searchQuery,
        category: activeTab,
      },
      { replace: true },
    )
  }, [activeTab, rawCategory, searchQuery, setSearchParams])

  const handleTabChange = (value: string) => {
    setSearchParams({
      query: searchQuery,
      category: value,
    })
  }

  return {
    activeTab,
    activeTabLabel,
    allResults,
    error,
    fetchNextPage,
    handleTabChange,
    hasNextPage,
    hasQuery,
    isFetchingNextPage,
    isLoading,
    mainCategoryCounts: stableMainCategoryCounts,
    searchQuery,
    tabs,
    total,
  }
}
