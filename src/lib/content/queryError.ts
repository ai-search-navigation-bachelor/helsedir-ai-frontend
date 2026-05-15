/**
 * Error classification helpers for content detail queries.
 *
 * When the backend returns a 400, 404 or 405 for a content request, the app
 * falls back to fetching the same content from the Helsedirektoratet external
 * API. These helpers centralise the logic for deciding when to trigger that
 * fallback and when to surface the error to the user.
 */
export function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

export function getStatusCodeFromError(error: unknown) {
  if (!(error instanceof Error)) return null

  const match = error.message.match(/\b(\d{3})\b/)
  if (!match) return null

  const statusCode = Number(match[1])
  return Number.isNaN(statusCode) ? null : statusCode
}

export function shouldFallbackToTypedEndpoint(error: unknown) {
  if (isAbortError(error)) return false
  const statusCode = getStatusCodeFromError(error)
  return statusCode === 400 || statusCode === 404 || statusCode === 405
}
