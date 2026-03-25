import type { NestedContent } from '../../types'
import { getDisplayTitle } from '../displayTitle'

function normalizeValue(value?: string | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function getFallbackKey(node: NestedContent) {
  const title = normalizeValue(getDisplayTitle(node))
  const type = normalizeValue(
    node.type ||
    node.tekniskeData?.subtype ||
    node.tekniskeData?.infoType,
  )

  return [title, type].filter(Boolean).join('|')
}

function getNestedContentKey(node: NestedContent) {
  return normalizeValue(node.id)
    || normalizeValue(node.path)
    || normalizeValue(node.url)
    || getFallbackKey(node)
}

function getNodeRichness(node: NestedContent) {
  let score = 0

  if (normalizeValue(node.body) || normalizeValue(node.tekst)) score += 4
  if (normalizeValue(node.intro) || normalizeValue(node.kortIntro)) score += 2
  if (node.data && Object.keys(node.data).length > 0) score += 2
  if ((node.children?.length ?? 0) > 0) score += 3
  if (normalizeValue(node.path)) score += 1
  if (normalizeValue(node.url)) score += 1

  return score
}

function mergeNodes(current: NestedContent, incoming: NestedContent) {
  const winner = getNodeRichness(incoming) > getNodeRichness(current) ? incoming : current
  const loser = winner === incoming ? current : incoming

  const mergedChildren = dedupeNestedContents([
    ...(winner.children ?? []),
    ...(loser.children ?? []),
  ])

  return {
    ...loser,
    ...winner,
    children: mergedChildren.length > 0 ? mergedChildren : undefined,
  }
}

export function dedupeNestedContents(children?: NestedContent[] | null) {
  const deduped = new Map<string, NestedContent>()

  for (const child of children ?? []) {
    const sanitizedChild = {
      ...child,
      children: dedupeNestedContents(child.children),
    }
    const key = getNestedContentKey(sanitizedChild)

    if (!key) {
      const uniqueKey = `__index__${deduped.size}`
      deduped.set(uniqueKey, sanitizedChild)
      continue
    }

    const existing = deduped.get(key)
    deduped.set(key, existing ? mergeNodes(existing, sanitizedChild) : sanitizedChild)
  }

  return Array.from(deduped.values())
}
