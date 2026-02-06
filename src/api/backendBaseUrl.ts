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

export const BACKEND_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_BACKEND_BASE_URL,
)
