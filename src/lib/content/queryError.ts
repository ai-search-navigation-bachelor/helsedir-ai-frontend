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
