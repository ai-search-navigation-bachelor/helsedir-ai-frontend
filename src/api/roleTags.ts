/**
 * Role tags API (developer/admin endpoint).
 * Returns documents grouped by their assigned role tags, used by the Tags page
 * to show which health-professional roles each document is relevant for.
 */
import { httpRequest, buildUrl } from '../lib/httpClient'
import { BACKEND_BASE_URL } from './backendBaseUrl'
import type { RoleTagDocument, RoleTagGroup } from '../types/api'

export type { RoleTagDocument, RoleTagGroup }

export interface RoleTagsResponse {
  roles: RoleTagGroup[]
  untagged_count: number
  untagged_documents: RoleTagDocument[]
  total_documents: number
}

export async function fetchRoleTags(role?: string, signal?: AbortSignal): Promise<RoleTagsResponse> {
  const url = buildUrl(`${BACKEND_BASE_URL}/dev/role-tags`, role ? { role } : undefined)
  return httpRequest<RoleTagsResponse>(url, { signal })
}
