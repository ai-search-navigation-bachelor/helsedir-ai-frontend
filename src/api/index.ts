/**
 * API Module Index
 * Central export point for all API functionality
 */

// Core utilities
export { API_ENDPOINTS, DEFAULT_HEADERS } from './config'
export { httpRequest, buildUrl, ApiError } from './httpClient'
export type { HttpRequestOptions } from './httpClient'

// Shared types
export type {
  SearchResultBase,
  PaginatedResponse,
  BaseRequestOptions,
  ContentDetail,
  InfoResultItem,
} from './types'

// Categorized search
export {
  searchCategorizedApi,
} from './categorized'
export type {
  CategoryResult,
  CategoryGroup,
  CategorizedSearchResponse,
  CategorizedSearchOptions,
} from './categorized'

// Category search
export {
  searchCategoryApi,
} from './categorySearch'
export type {
  CategorySearchResult,
  CategorySearchResponse,
  CategorySearchOptions,
} from './categorySearch'

// General search and content
export {
  searchApi,
  getContentApi,
  getInfobitApi,
} from './search'
export type {
  SearchResultItem,
  SearchApiResult,
  SearchApiOptions,
} from './search'
