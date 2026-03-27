import type { ReactNode } from 'react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import type { NestedContent } from '../../../types'
import { getNodeTitle, getNodeType } from './treeUtils'

function isReferenceNode(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

const MAX_SNIPPETS = 5
const CONTEXT_CHARS = 60

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

export function MatchCount({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-2 inline-flex translate-y-[-1px] items-center rounded-full bg-amber-100 px-2 py-0.5 align-middle text-xs font-semibold tabular-nums text-amber-800">
      {count} {count === 1 ? 'treff' : 'treff'}
    </span>
  )
}

/**
 * Highlights all occurrences of `query` in `text` with a <mark> tag.
 * Returns plain text if no query or no match.
 */
export function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>

  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: ReactNode[] = []
  let lastIndex = 0
  let matchIndex = lower.indexOf(lowerQuery)

  while (matchIndex !== -1) {
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex))
    }
    parts.push(
      <mark
        key={matchIndex}
        className="rounded-sm bg-amber-100 px-0.5 text-inherit"
      >
        {text.slice(matchIndex, matchIndex + query.length)}
      </mark>,
    )
    lastIndex = matchIndex + query.length
    matchIndex = lower.indexOf(lowerQuery, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>
}

interface Snippet {
  before: string
  match: string
  after: string
}

function extractSnippets(text: string, query: string, max: number): Snippet[] {
  const plain = stripHtml(text)
  const lower = plain.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const snippets: Snippet[] = []
  let searchFrom = 0

  while (snippets.length < max) {
    const idx = lower.indexOf(lowerQuery, searchFrom)
    if (idx === -1) break

    const beforeStart = Math.max(0, idx - CONTEXT_CHARS)
    const afterEnd = Math.min(plain.length, idx + query.length + CONTEXT_CHARS)

    const rawBefore = plain.slice(beforeStart, idx)
    const rawAfter = plain.slice(idx + query.length, afterEnd)

    const before = (beforeStart > 0 ? '...' : '') +
      (beforeStart > 0 ? rawBefore.replace(/^\S*\s/, '') : rawBefore)
    const after =
      (afterEnd < plain.length ? rawAfter.replace(/\s\S*$/, '') : rawAfter) +
      (afterEnd < plain.length ? '...' : '')

    snippets.push({
      before,
      match: plain.slice(idx, idx + query.length),
      after,
    })

    searchFrom = idx + query.length
  }

  return snippets
}

function getOwnTexts(node: NestedContent): string[] {
  const texts: string[] = []
  if (node.intro) texts.push(node.intro)
  if (node.tekst) texts.push(node.tekst)
  if (node.body) texts.push(node.body)
  if (node.data?.praktisk) texts.push(node.data.praktisk)
  if (node.data?.rasjonale) texts.push(node.data.rasjonale)
  return texts
}

function extractSnippetsFromTexts(texts: string[], query: string, max: number): Snippet[] {
  const snippets: Snippet[] = []
  for (const text of texts) {
    if (snippets.length >= max) break
    const found = extractSnippets(text, query, max - snippets.length)
    snippets.push(...found)
  }
  return snippets
}

interface MatchGroup {
  /** Title of the child where matches were found, null for own-text matches */
  childTitle: string | null
  /** ID of the child (for navigation) */
  childId: string | null
  /** The child node (for match counting) */
  childNode: NestedContent | null
  snippets: Snippet[]
}

function buildMatchGroups(node: NestedContent, query: string): MatchGroup[] {
  const lowerQuery = query.toLowerCase()
  const groups: MatchGroup[] = []

  // 1. Check own text
  const ownSnippets = extractSnippetsFromTexts(getOwnTexts(node), query, MAX_SNIPPETS)
  if (ownSnippets.length > 0) {
    groups.push({ childTitle: null, childId: null, childNode: null, snippets: ownSnippets })
  }

  if (!node.children) return groups

  // 2. Check each child (and their descendants), skip references
  for (const child of node.children) {
    if (isReferenceNode(child)) continue

    const childTitle = getNodeTitle(child)
    const titleMatches = childTitle.toLowerCase().includes(lowerQuery)

    // Collect text from this child and all its descendants, skipping references
    const collectAllTexts = (n: NestedContent): string[] => {
      const texts = getOwnTexts(n)
      if (n.children) {
        for (const c of n.children) {
          if (!isReferenceNode(c)) texts.push(...collectAllTexts(c))
        }
      }
      return texts
    }

    const childSnippets = extractSnippetsFromTexts(collectAllTexts(child), query, MAX_SNIPPETS)

    if (titleMatches || childSnippets.length > 0) {
      groups.push({ childTitle, childId: child.id || null, childNode: child, snippets: childSnippets })
    }
  }

  return groups
}

function SnippetLine({ snippet }: { snippet: Snippet }) {
  return (
    <p className="m-0 text-xs leading-relaxed text-slate-500">
      {snippet.before}
      <mark className="rounded-sm bg-amber-100 px-0.5 font-medium text-slate-700">
        {snippet.match}
      </mark>
      {snippet.after}
    </p>
  )
}

/**
 * Shows up to 3 context snippets from text matches in a NestedContent node.
 * Groups results by child, showing child titles so users know where matches come from.
 * Child groups are clickable when onNavigateToChild is provided.
 */
export function TextMatchSnippets({
  node,
  query,
  onNavigateToChild,
}: {
  node: NestedContent
  query: string
  onNavigateToChild?: (expandableId: string) => void
}) {
  if (!query) return null

  const groups = buildMatchGroups(node, query)
  if (groups.length === 0) return null

  return (
    <div className="mt-1.5 space-y-1.5">
      {groups.map((group, gi) => {
        if (!group.childTitle) {
          return group.snippets.map((snippet, si) => (
            <SnippetLine key={`own-${si}`} snippet={snippet} />
          ))
        }

        const content = (
          <>
            <div className="flex items-center gap-3">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900">
                <HighlightText text={group.childTitle} query={query} />
              </span>
              {group.childNode && <MatchCount count={countNodeMatches(group.childNode, query)} />}
            </div>
            {group.snippets.length > 0 && (
              <div className="mt-1.5 ml-7 space-y-0.5">
                {group.snippets.map((snippet, si) => (
                  <SnippetLine key={si} snippet={snippet} />
                ))}
              </div>
            )}
          </>
        )

        return onNavigateToChild && group.childId ? (
          <button
            key={gi}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onNavigateToChild(group.childId!)
            }}
            className="group/match flex w-full flex-col rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-left cursor-pointer transition-all hover:border-brand/30 hover:shadow-sm [&_span.text-slate-900]:group-hover/match:text-brand [&_svg.text-slate-400]:group-hover/match:text-brand"
          >
            {content}
          </button>
        ) : (
          <div key={gi} className="flex flex-col rounded-lg border border-slate-200 bg-white px-4 py-3.5">
            {content}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Renders highlighted title for a NestedContent node.
 */
export function HighlightNodeTitle({
  node,
  query,
  fallback = 'Uten tittel',
}: {
  node: NestedContent
  query: string
  fallback?: string
}) {
  return <HighlightText text={getNodeTitle(node, fallback)} query={query} />
}
