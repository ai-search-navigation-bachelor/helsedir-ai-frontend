const API_HELSEDIREKTORATET_HOST = 'api.helsedirektoratet.no'

export function getContentIdFromHref(href?: string | null) {
  if (!href) return null

  try {
    const parsed = new URL(href)
    const segments = parsed.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  } catch {
    const normalized = href.split('?')[0].replace(/\/+$/, '')
    const segments = normalized.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  }
}

export function getApiContentInternalPath(href?: string | null) {
  if (!href) return undefined

  try {
    const parsed = new URL(href)
    if (parsed.hostname.toLowerCase() !== API_HELSEDIREKTORATET_HOST) {
      return undefined
    }

    const contentId = getContentIdFromHref(parsed.toString())
    if (!contentId) return undefined

    return `/content/${contentId}`
  } catch {
    return undefined
  }
}
