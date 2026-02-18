import { buildUrl, httpRequest } from '../lib/httpClient'
import { stripTemasidePrefix } from '../lib/path'
import type { BaseRequestOptions } from '../types'
import { BACKEND_BASE_URL } from './backendBaseUrl'

export interface ThemePage {
  id: string
  title: string
  info_type: string
  path: string
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

  const response = await httpRequest<ThemePagesResponse>(url, { signal })

  return {
    ...response,
    results: response.results.map((result) => ({
      ...result,
      path: stripTemasidePrefix(result.path),
    })),
  }
}
