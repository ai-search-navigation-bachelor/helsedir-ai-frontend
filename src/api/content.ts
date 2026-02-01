/**
 * Content API
 * Handles content retrieval by ID
 */

import { httpRequest, buildUrl } from '../lib/httpClient'
import type { BaseRequestOptions, ContentDetail, InfoResultItem } from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://129.241.150.141:8000'

/**
 * Content request options
 */
export interface ContentOptions extends BaseRequestOptions {
  depth?: number
}

/**
 * Get content by ID
 */
export async function getContent(
  contentId: string,
  searchId?: string,
  { signal }: BaseRequestOptions = {},
): Promise<ContentDetail> {
  const trimmed = contentId.trim()

  if (!trimmed) {
    throw new Error('Content ID is required')
  }

  const url = buildUrl(`${BASE_URL}/content/${encodeURIComponent(trimmed)}`, {
    search_id: searchId,
  })

  return httpRequest<ContentDetail>(url, { signal })
}

/**
 * @deprecated Use getContent instead
 * Get infobit by ID (legacy endpoint)
 */
export async function getInfobit(
  infobitId: string,
  { signal, depth = 2 }: ContentOptions = {},
): Promise<InfoResultItem> {
  const trimmed = infobitId.trim()

  if (!trimmed) {
    throw new Error('Infobit ID is required')
  }

  // Legacy endpoint for backwards compatibility
  const url = buildUrl(`${BASE_URL}/helsedir/infobit/${encodeURIComponent(trimmed)}`, {
    include_children: true,
    depth,
  })

  return httpRequest<InfoResultItem>(url, { signal })
}
