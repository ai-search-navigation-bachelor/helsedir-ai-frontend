interface LinkLike {
  rel?: string
  href?: string
}

export function getUniqueChildLinks<T extends LinkLike>(links?: T[]) {
  const dedupedByHref = new Set<string>()
  const result: T[] = []

  for (const link of links ?? []) {
    if (link.rel !== 'barn' || !link.href) continue
    if (dedupedByHref.has(link.href)) continue
    dedupedByHref.add(link.href)
    result.push(link)
  }

  return result
}

export function countUniqueChildLinks(links?: LinkLike[]) {
  return getUniqueChildLinks(links).length
}

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
