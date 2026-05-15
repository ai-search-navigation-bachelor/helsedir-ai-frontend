/**
 * Counts the number of text-filter matches within a NestedContent subtree.
 * Used by the hierarchical sidebar to show match counts per chapter so users
 * can quickly identify which sections contain the search term.
 */
import type { NestedContent } from '../../../types'
import { getNodeTitle, getNodeType } from './treeUtils'

function isReferenceNode(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

function decodeEntities(text: string) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

function stripHtml(html: string) {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function countOccurrences(text: string, query: string): number {
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let count = 0
  let pos = 0
  while ((pos = lower.indexOf(lowerQuery, pos)) !== -1) {
    count++
    pos += lowerQuery.length
  }
  return count
}

/** Count all matches in a NestedContent node's title + text, recursively including children */
export function countNodeMatches(node: NestedContent, query: string): number {
  if (!query || isReferenceNode(node)) return 0
  const lowerQuery = query.toLowerCase()
  let count = 0

  // Title
  count += countOccurrences(getNodeTitle(node), lowerQuery)

  // Own texts
  const texts = [node.intro, node.tekst, node.body, node.data?.praktisk, node.data?.rasjonale,
    node.data?.nokkelInfo?.fordelerogulemper, node.data?.nokkelInfo?.verdierogpreferanser]
  for (const t of texts) {
    if (t) count += countOccurrences(stripHtml(t), lowerQuery)
  }

  // Children
  if (node.children) {
    for (const child of node.children) {
      count += countNodeMatches(child, query)
    }
  }

  return count
}

/** Count matches for a PageNode including all child pages in the tree */
export function countPageMatches(
  page: { node: NestedContent; childrenIds: string[]; expandableChildren: NestedContent[] },
  query: string,
  pagesById: Map<string, { node: NestedContent; childrenIds: string[]; expandableChildren: NestedContent[] }>,
  getCachedContent: (nodeId: string) => NestedContent | null,
): number {
  if (!query) return 0
  const cached = getCachedContent(page.node.id)
  let count = countNodeMatches(cached ?? page.node, query)

  // Count from child pages in the tree
  for (const childId of page.childrenIds) {
    const child = pagesById.get(childId)
    if (child) count += countPageMatches(child, query, pagesById, getCachedContent)
  }

  return count
}
