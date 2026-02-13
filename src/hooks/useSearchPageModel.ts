import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
  getMainCategoryBySubcategory,
} from '../constants/categories'
import { useCategorizedSearchQuery } from './queries/useCategorizedSearchQuery'
import { useSearchStore } from '../stores/searchStore'
import type { SearchResult } from '../types'

const MAIN_TAB_ORDER = [
  'temaside',
  'retningslinjer',
  'faglige-rad',
  'veiledere',
  'rundskriv',
  'lovfortolkning',
  'statistikk-og-rapporter',
] as const

type MainCategoryId = (typeof SEARCH_MAIN_CATEGORIES)[number]['id']
type ActiveTab = MainCategoryId | 'all'

const MAIN_CATEGORY_IDS: ReadonlySet<string> = new Set(
  SEARCH_MAIN_CATEGORIES.map((category) => category.id),
)

function isMainCategoryId(value: string): value is MainCategoryId {
  return MAIN_CATEGORY_IDS.has(value)
}

function toActiveTab(rawCategory: string): ActiveTab {
  if (rawCategory === 'all') return 'all'
  if (isMainCategoryId(rawCategory)) return rawCategory
  return getMainCategoryBySubcategory(rawCategory) || 'all'
}

export interface SearchPageTab {
  id: MainCategoryId
  label: string
}

export interface SearchResultWithCategory extends SearchResult {
  categoryName: string
  categoryId: string
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

  const allCategories = useMemo(
    () => [...(data?.priority_categories || []), ...(data?.other_categories || [])],
    [data?.priority_categories, data?.other_categories],
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    allCategories.forEach((categoryGroup) => {
      counts[categoryGroup.category] = categoryGroup.results.length
    })

    counts.all = allCategories.reduce((sum, categoryGroup) => sum + categoryGroup.results.length, 0)
    return counts
  }, [allCategories])

  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = { ...SEARCH_SUBCATEGORY_LABELS }

    allCategories.forEach((categoryGroup) => {
      labels[categoryGroup.category] = categoryGroup.display_name || categoryGroup.category
    })

    return labels
  }, [allCategories])

  const tabs = useMemo<SearchPageTab[]>(() => {
    const byId = new Map(SEARCH_MAIN_CATEGORIES.map((category) => [category.id, category]))

    return MAIN_TAB_ORDER
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((category) => ({
        id: category!.id,
        label: category!.label,
      }))
  }, [])

  const mainCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}

    SEARCH_MAIN_CATEGORIES.forEach((mainCategory) => {
      counts[mainCategory.id] = mainCategory.subcategoryIds.reduce(
        (sum, subcategoryId) => sum + (categoryCounts[subcategoryId] || 0),
        0,
      )
    })

    counts.all = Object.values(counts).reduce((sum, value) => sum + value, 0)
    return counts
  }, [categoryCounts])

  const activeTabLabel = useMemo(() => {
    if (activeTab === 'all') {
      return 'Alle'
    }

    return tabs.find((tab) => tab.id === activeTab)?.label || ''
  }, [activeTab, tabs])

  const filteredResults = useMemo<SearchResultWithCategory[]>(() => {
    if (activeTab === 'all') {
      return allCategories.flatMap((categoryGroup) =>
        categoryGroup.results.map((result) => ({
          ...result,
          categoryName:
            categoryLabels[categoryGroup.category] ||
            categoryGroup.display_name ||
            categoryGroup.category,
          categoryId: categoryGroup.category,
        })),
      )
    }

    const selectedMainCategory = SEARCH_MAIN_CATEGORIES.find((category) => category.id === activeTab)
    if (!selectedMainCategory) {
      return []
    }

    const allowedSubcategories = new Set<string>(selectedMainCategory.subcategoryIds)

    return allCategories
      .filter((categoryGroup) => allowedSubcategories.has(categoryGroup.category))
      .flatMap((categoryGroup) =>
        categoryGroup.results.map((result) => ({
          ...result,
          categoryName:
            categoryLabels[categoryGroup.category] ||
            categoryGroup.display_name ||
            categoryGroup.category,
          categoryId: categoryGroup.category,
        })),
      )
  }, [activeTab, allCategories, categoryLabels])

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

  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      if (a.score && b.score) {
        return b.score - a.score
      }
      return 0
    })
  }, [filteredResults])

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
