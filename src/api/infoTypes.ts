import { httpRequest, buildUrl } from '../lib/httpClient'
import { BACKEND_BASE_URL } from './backendBaseUrl'
import type { InfoType } from '../types/api'

export type { InfoType }

export async function fetchInfoTypes(signal?: AbortSignal): Promise<InfoType[]> {
  const url = buildUrl(`${BACKEND_BASE_URL}/dev/info-types`)
  return httpRequest<InfoType[]>(url, { signal })
}
