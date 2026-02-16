import {
  SEARCH_MAIN_CATEGORIES,
  type SearchMainCategoryId,
  type SearchMainCategory,
} from '../../constants/categories'
import type { CategoryGroup, CategorizedSearchResponse, SearchResult } from '../../types'

export const MAIN_TAB_ORDER: readonly SearchMainCategoryId[] = [
  'temaside',
  'retningslinjer',
  'faglige-rad',
  'veiledere',
  'rundskriv',
  'lovfortolkning',
  'statistikk-og-rapporter',
]

export interface SearchPageTab {
  id: SearchMainCategoryId
  label: string
}

export interface SearchResultWithCategory extends SearchResult {
  categoryName: string
  categoryId: string
}

export function buildAllCategories(data?: CategorizedSearchResponse): CategoryGroup[] {
  return [...(data?.priority_categories || []), ...(data?.other_categories || [])]
}

export function buildCategoryCounts(allCategories: CategoryGroup[]): Record<string, number> {
  const counts: Record<string, number> = {}

  allCategories.forEach((categoryGroup) => {
    counts[categoryGroup.category] = categoryGroup.results.length
  })

  counts.all = allCategories.reduce((sum, categoryGroup) => sum + categoryGroup.results.length, 0)
  return counts
}

export function buildCategoryLabels(
  allCategories: CategoryGroup[],
  baseLabels: Record<string, string>,
): Record<string, string> {
  const labels: Record<string, string> = { ...baseLabels }

  allCategories.forEach((categoryGroup) => {
    labels[categoryGroup.category] = categoryGroup.display_name || categoryGroup.category
  })

  return labels
}

export function buildTabs(mainTabOrder: readonly SearchMainCategoryId[] = MAIN_TAB_ORDER): SearchPageTab[] {
  const byId = new Map<SearchMainCategory['id'], SearchMainCategory>(
    SEARCH_MAIN_CATEGORIES.map((category) => [category.id, category]),
  )

  return mainTabOrder
    .map((id) => byId.get(id))
    .filter((category): category is SearchMainCategory => Boolean(category))
    .map((category) => ({
      id: category.id,
      label: category.label,
    }))
}

export function buildMainCategoryCounts(
  categoryCounts: Record<string, number>,
): Record<string, number> {
  const counts: Record<string, number> = {}

  SEARCH_MAIN_CATEGORIES.forEach((mainCategory) => {
    counts[mainCategory.id] = mainCategory.subcategoryIds.reduce(
      (sum, subcategoryId) => sum + (categoryCounts[subcategoryId] || 0),
      0,
    )
  })

  counts.all = Object.values(counts).reduce((sum, value) => sum + value, 0)
  return counts
}

export function buildActiveTabLabel(
  activeTab: SearchMainCategoryId | 'all',
  tabs: SearchPageTab[],
): string {
  if (activeTab === 'all') {
    return 'Alle'
  }

  return tabs.find((tab) => tab.id === activeTab)?.label || ''
}

export function buildFilteredResults(
  activeTab: SearchMainCategoryId | 'all',
  allCategories: CategoryGroup[],
  categoryLabels: Record<string, string>,
): SearchResultWithCategory[] {
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
}

export function sortResultsByScore(
  results: SearchResultWithCategory[],
): SearchResultWithCategory[] {
  return [...results].sort((a, b) => {
    if (a.score && b.score) {
      return b.score - a.score
    }
    return 0
  })
}
