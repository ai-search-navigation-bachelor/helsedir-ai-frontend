import { getContentIdFromHref } from '../../../lib/contentLinking'

interface LinkLike {
  rel?: string
  href?: string | null
  id?: string | null
}

export function getUniqueChildLinks<T extends LinkLike>(links?: T[]) {
  const seen = new Set<string>()
  const result: T[] = []

  for (const link of links ?? []) {
    if (link.rel !== 'barn') continue
    const key = link.id || link.href
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    result.push(link)
  }

  return result
}

export function countUniqueChildLinks(links?: LinkLike[]) {
  return getUniqueChildLinks(links).length
}

export { getContentIdFromHref }
