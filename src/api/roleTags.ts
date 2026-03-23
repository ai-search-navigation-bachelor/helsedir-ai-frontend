import { httpRequest, buildUrl } from '../lib/httpClient'
import { BACKEND_BASE_URL } from './backendBaseUrl'

export interface RoleTagDocument {
  id: string
  title: string
  info_type: string
  path: string | null
}

export interface RoleTagGroup {
  slug: string
  display_name: string
  document_count: number
  documents: RoleTagDocument[]
}

export interface RoleTagsResponse {
  roles: RoleTagGroup[]
  untagged_count: number
  untagged_documents: RoleTagDocument[]
  total_documents: number
}

export async function fetchRoleTags(signal?: AbortSignal): Promise<RoleTagsResponse> {
  const url = buildUrl(`${BACKEND_BASE_URL}/dev/role-tags`)
  return httpRequest<RoleTagsResponse>(url, { signal })
}
