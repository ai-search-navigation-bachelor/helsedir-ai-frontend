/**
 * API Module Index
 * Central export point for all API functionality
 */

// Search operations
export {
  searchCategorized,
  searchCategory,
  search,
} from './search'
export type {
  CategorizedSearchOptions,
  CategorySearchOptions,
  SearchOptions,
} from './search'

// Content operations
export { getContent, getInfobit } from './content'
export type { ContentOptions } from './content'

// External Helsedirektoratet API
export {
  fetchHelsedirContent,
  fetchMultipleHelsedirContent,
  fetchChapterWithSubchapters,
  fetchHelsedirContentByTypeAndId,
  getHelsedirEndpointByContentType,
} from './helsedir'
export type {
  HelselinkContent,
  ChapterWithSubchapters,
} from './helsedir'

// Theme pages
export { getThemePages } from './themePages'
export type { ThemePage, ThemePagesOptions, ThemePagesResponse } from './themePages'
