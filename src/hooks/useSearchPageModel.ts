import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
  getMainCategoryBySubcategory,
  type SearchMainCategoryId,
} from '../constants/categories'
import {
  buildActiveTabLabel,
  buildAllCategories,
  buildCategoryCounts,
  buildCategoryLabels,
  buildFilteredResults,
  buildMainCategoryCounts,
  buildTabs,
  sortResultsByScore,
} from '../lib/search/searchPageModel'
import { useCategorizedSearchQuery } from './queries/useCategorizedSearchQuery'
import { useSearchStore } from '../stores/searchStore'
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

export function useSearchPageModel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('query') || ''
  const rawCategory = (searchParams.get('category') || 'all').trim().toLowerCase()
  const activeTab = useMemo(() => toActiveTab(rawCategory), [rawCategory])
  const hasQuery = searchQuery.trim().length > 0

  const searchQueryFromStore = useSearchStore((state) => state.searchQuery)
  const setSearchId = useSearchStore((state) => state.setSearchId)
  const setSearchData = useSearchStore((state) => state.setSearchData)

  const { data, isLoading, error } = useCategorizedSearchQuery(searchQuery, {
    enabled: hasQuery,
  })

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery || searchQueryFromStore !== trimmedQuery) {
      setSearchId(null)
    }
  }, [searchQuery, searchQueryFromStore, setSearchId])

  useEffect(() => {
    const trimmedQuery = searchQuery.trim()
    if (data?.search_id && trimmedQuery) {
      setSearchData(data.search_id, trimmedQuery)
    }
  }, [data?.search_id, searchQuery, setSearchData])

  const allCategories = useMemo(() => buildAllCategories(data), [data])
  const categoryCounts = useMemo(() => buildCategoryCounts(allCategories), [allCategories])
  const categoryLabels = useMemo(
    () => buildCategoryLabels(allCategories, SEARCH_SUBCATEGORY_LABELS),
    [allCategories],
  )
  const tabs = useMemo(() => buildTabs(), [])
  const mainCategoryCounts = useMemo(
    () => buildMainCategoryCounts(categoryCounts),
    [categoryCounts],
  )
  const activeTabLabel = useMemo(() => buildActiveTabLabel(activeTab, tabs), [activeTab, tabs])
  const filteredResults = useMemo(
    () => buildFilteredResults(activeTab, allCategories, categoryLabels),
    [activeTab, allCategories, categoryLabels],
  )

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

  const sortedResults = useMemo(() => sortResultsByScore(filteredResults), [filteredResults])

  const handleTabChange = (value: string) => {
    setSearchParams({
      query: searchQuery,
      category: value,
    })
  }

  return {
    activeTab,
    activeTabLabel,
    data,
    error,
    handleTabChange,
    hasQuery,
    isLoading,
    mainCategoryCounts,
    searchQuery,
    sortedResults,
    tabs,
  }
}
