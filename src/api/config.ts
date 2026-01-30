/**
 * API Configuration
 * Centralizes all API endpoint configuration
 */

const DEFAULT_BASE_URL = 'http://129.241.150.141:8000'

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback: string): string {
  const value = import.meta.env[key] as string | undefined
  return value && value.trim().length > 0 ? value : fallback
}

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  search: getEnvVar('VITE_SEARCH_ENDPOINT', `${DEFAULT_BASE_URL}/search`),
  categorizedSearch: getEnvVar('VITE_CATEGORIZED_SEARCH_ENDPOINT', `${DEFAULT_BASE_URL}/search/categorized`),
  categorySearch: getEnvVar('VITE_CATEGORIZED_SEARCH_ENDPOINT', `${DEFAULT_BASE_URL}/search/categorized`).replace('/search/categorized', '/search/category'),
  content: getEnvVar('VITE_CONTENT_ENDPOINT', `${DEFAULT_BASE_URL}/content`),
} as const

/**
 * Default request headers
 */
export const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const
