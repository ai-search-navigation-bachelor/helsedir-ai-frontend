/**
 * Backend base URL configuration.
 *
 * Default matches the current .env value, but can be set to a relative path (e.g. "/api")
 * when running behind a reverse proxy on the VM.
 */

const DEFAULT_BACKEND_BASE_URL = 'http://129.241.150.141:8000'

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim()

  // Remove trailing slashes to avoid "//" when joining paths
  return trimmed.replace(/\/+$/, '')
}

const resolvedBaseUrl = import.meta.env.VITE_API_BASE_URL

export const BACKEND_BASE_URL = normalizeBaseUrl(
  resolvedBaseUrl || (import.meta.env.PROD ? '/api' : DEFAULT_BACKEND_BASE_URL),
)