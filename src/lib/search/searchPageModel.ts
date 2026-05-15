/**
 * Pure model functions for the SearchPage tab structure.
 *
 * Separated from the view-model hook so the tab definitions and ordering
 * can be unit-tested without a React environment.
 */
import {
  SEARCH_MAIN_CATEGORIES,
  type SearchMainCategoryId,
  type SearchMainCategory,
} from '../../constants/categories'

export const MAIN_TAB_ORDER: readonly SearchMainCategoryId[] = [
  'temaside',
  'retningslinjer',
  'faglige-rad',
  'veiledere',
  'regelverk',
  'statistikk-og-rapporter',
]

export interface SearchPageTab {
  id: SearchMainCategoryId
  label: string
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
