/**
 * API Module Index
 * Central export point for all API functionality
 */

// Search operations
export {
  search,
  fetchSearchSuggestions,
} from './search'
export type {
  SearchOptions,
} from './search'

// Content operations
export { getContent, getContentByPath } from './content'
export type { ContentOptions } from './content'

// External Helsedirektoratet API
export {
  fetchHelsedirContent,
  fetchMultipleHelsedirContent,
  fetchChapterWithSubchapters,
  fetchHelsedirContentByTypeAndId,
  fetchHelsedirContentById,
  getHelsedirEndpointByContentType,
} from './helsedir'
export type {
  HelselinkContent,
  ChapterWithSubchapters,
} from './helsedir'

// Theme pages
export { getThemePages } from './themePages'
export type { ThemePage, ThemePagesOptions, ThemePagesResponse } from './themePages'
