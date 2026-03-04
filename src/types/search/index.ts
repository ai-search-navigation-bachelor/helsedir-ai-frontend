/**
 * Search Types
 * Types for search results and queries
 */

/**
 * Base search result item
 */
export interface SearchResult {
  id: string;
  title: string;
  info_type: string;
  path?: string;
  score: number;
  bm25_score?: number;
  semantic_score?: number;
  rrf_score?: number;
  explanation?: string;
  children?: SearchResultChildGroup[] | null;
}

export interface SearchResultChildGroup {
  info_type: string;
  display_name: string;
  items: SearchResult[];
}

/**
 * Category group
 */
export interface CategoryGroup {
  category: string;
  display_name: string;
  count: number;
  is_priority: boolean;
  results: SearchResult[];
}

/**
 * General search response
 */
export interface SearchResponse {
  query: string;
  total: number;
  offset: number;
  limit: number;
  search_id: string;
  has_next: boolean;
  has_prev: boolean;
  results: SearchResult[];
  category_counts: Record<string, number>;
}

/**
 * Search suggestion item
 */
export interface SearchSuggestion {
  id: string;
  title: string;
}

/**
 * Search suggestions response
 */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}
