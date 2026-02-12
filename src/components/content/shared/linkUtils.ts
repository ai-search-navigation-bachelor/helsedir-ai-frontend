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
