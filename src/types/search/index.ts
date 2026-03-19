/**
 * Search Types
 * Types for search results and queries
 */

/**
 * Base search result item
 */
export interface SearchResultRelationSummary {
  detail_level?: string;
  id: string;
  title: string;
  short_title?: string | null;
  display_title?: string | null;
  content_type?: string | null;
  path?: string | null;
  href?: string | null;
}

export interface SearchResult {
  id: string;
  title: string;
  short_title?: string | null;
  display_title?: string | null;
  info_type: string;
  path?: string | null;
  should_display?: boolean;
  has_body_content?: boolean;
  has_linked_content?: boolean;
  has_children?: boolean;
  child_count?: number;
  has_text_content?: boolean;
  document_url?: string | null;
  is_pdf_only?: boolean;
  score: number;
  bm25_score?: number;
  semantic_score?: number;
  rrf_score?: number;
  role_boost?: number | null;
  explanation?: string;
  pipeline?: SearchPipeline | null;
  parent?: SearchResultRelationSummary | null;
  root_publication?: SearchResultRelationSummary | null;
  children?: SearchResultChildGroup[] | null;
}

export interface SearchRerankPipeline {
  score?: number;
  rank_change?: number;
  contributions?: Record<string, number>;
}

export interface SearchPipeline {
  bm25?: number;
  semantic?: number;
  rrf?: number;
  role_boost?: number | null;
  rerank?: SearchRerankPipeline | null;
}

export interface SearchResultChildGroup {
  info_type: string;
  display_name: string;
  child_count?: number;
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
  short_title?: string | null;
  display_title?: string | null;
  info_type?: string | null;
  path?: string | null;
}

/**
 * Search suggestions response
 */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
}
