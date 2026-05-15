/**
 * Theme pages (temasider) API.
 * Returns the list of all published theme pages, optionally filtered by category.
 */
import { buildUrl, httpRequest } from '../lib/httpClient'
import type { BaseRequestOptions } from '../types'
import { BACKEND_BASE_URL } from './backendBaseUrl'

export interface ThemePage {
  id: string
  title: string
  info_type: string
  path: string
  tags?: string[]
  has_body_content?: boolean
  has_linked_content?: boolean
  has_children?: boolean
  child_count?: number
  should_display?: boolean
}

export interface ThemePagesResponse {
  results: ThemePage[]
  total: number
}

export interface ThemePagesOptions extends BaseRequestOptions {
  category?: string
}

export async function getThemePages(
  { signal, category }: ThemePagesOptions = {},
): Promise<ThemePagesResponse> {
  const trimmedCategory = category?.trim()
  const url = buildUrl(`${BACKEND_BASE_URL}/theme-pages`, {
    category: trimmedCategory || undefined,
  })

  return httpRequest<ThemePagesResponse>(url, { signal })
}
