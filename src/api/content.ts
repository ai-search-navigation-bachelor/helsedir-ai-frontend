/**
 * Content API
 * Handles content retrieval by ID
 */

import { httpRequest, buildUrl } from '../lib/httpClient'
import type { BaseRequestOptions, ContentDetail } from '../types'
import { BACKEND_BASE_URL } from './backendBaseUrl'

/**
 * Content request options
 */
export interface ContentOptions extends BaseRequestOptions {
  depth?: number
  suppressErrorStatuses?: number[]
}

/**
 * Get content by ID
 */
export async function getContent(
  contentId: string,
  searchId?: string,
  { signal, suppressErrorStatuses }: ContentOptions = {},
): Promise<ContentDetail> {
  const trimmed = contentId.trim()

  if (!trimmed) {
    throw new Error('Content ID is required')
  }

  const url = buildUrl(`${BACKEND_BASE_URL}/content/${encodeURIComponent(trimmed)}`, {
    search_id: searchId,
  })

  return httpRequest<ContentDetail>(url, { signal, suppressErrorStatuses })
}

/**
 * Get content by its path (e.g. "/retningslinjer/adhd")
 */
export async function getContentByPath(
  path: string,
  searchId?: string,
  { signal, suppressErrorStatuses }: ContentOptions = {},
): Promise<ContentDetail> {
  const trimmed = path.trim()

  if (!trimmed) {
    throw new Error('Content path is required')
  }

  const url = buildUrl(`${BACKEND_BASE_URL}/content/by-path`, {
    path: trimmed,
    search_id: searchId,
  })

  return httpRequest<ContentDetail>(url, { signal, suppressErrorStatuses })
}

