/**
 * Roles API.
 * Returns the list of health-professional roles available for search personalisation
 * (e.g. "lege", "sykepleier"). The selected role is forwarded with search requests
 * to boost results relevant to that profession.
 */
import { httpRequest, buildUrl } from '../lib/httpClient'
import { BACKEND_BASE_URL } from './backendBaseUrl'

export interface Role {
  slug: string
  display_name: string
}

interface RolesResponse {
  roles: Role[]
}

export async function fetchRoles(signal?: AbortSignal): Promise<Role[]> {
  const url = buildUrl(`${BACKEND_BASE_URL}/roles`)
  const data = await httpRequest<RolesResponse | Role[]>(url, { signal })
  return Array.isArray(data) ? data : data.roles
}
