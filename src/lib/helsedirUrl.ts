const HELSEDIREKTORATET_BASE_URL = 'https://www.helsedirektoratet.no'

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value)
}

export function toAbsoluteHelsedirUrl(rawUrl?: string | null) {
  const trimmed = rawUrl?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('//')) return null

  if (isAbsoluteHttpUrl(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('/')) {
    return new URL(trimmed, HELSEDIREKTORATET_BASE_URL).toString()
  }

  return null
}
