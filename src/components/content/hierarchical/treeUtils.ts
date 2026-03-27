import type { NestedContent } from '../../../types'
export { formatDateLabel } from '../../../lib/content/date'
import { dedupeNestedContents } from '../../../lib/content/nestedContentDedup'
import { getDisplayTitle } from '../../../lib/displayTitle'
import type { ChapterEntry, PageNode, TreeResult } from './types'
export { hasVisibleContent } from '../shared/contentTextUtils'

export function getNodeTitle(node: NestedContent, fallback = 'Uten tittel') {
  return getDisplayTitle(node, fallback)
}

export function getNodeType(node: NestedContent) {
  return (
    node.type ||
    node.tekniskeData?.subtype ||
    node.tekniskeData?.infoType ||
    ''
  ).trim().toLowerCase()
}

function toNodeId(chapterIndex: number, path: number[]) {
  return path.length === 0
    ? `chapter-${chapterIndex}`
    : `chapter-${chapterIndex}-node-${path.join('-')}`
}

function toNumbering(chapterIndex: number, path: number[]) {
  if (path.length === 0) return `${chapterIndex + 1}`
  return [chapterIndex + 1, ...path.map((part) => part + 1)].join('.')
}

export function buildPageTree(entries: ChapterEntry[]): TreeResult {
  const pagesById = new Map<string, PageNode>()
  const rootIds: string[] = []

  const addNode = (
    chapterIndex: number,
    node: NestedContent,
    path: number[],
    parentId: string | null,
    fallbackTitle?: string,
  ) => {
    const id = toNodeId(chapterIndex, path)
    const page: PageNode = {
      id,
      title: getNodeTitle(node, fallbackTitle),
      numbering: toNumbering(chapterIndex, path),
      depth: path.length + 1,
      parentId,
      childrenIds: [],
      expandableChildren: [],
      node,
    }
    pagesById.set(id, page)

    if (parentId) {
      const parent = pagesById.get(parentId)
      if (parent) parent.childrenIds.push(id)
    } else {
      rootIds.push(id)
    }

    dedupeNestedContents(node.children).forEach((child, childIndex) => {
      const childType = getNodeType(child)

      if (childType.includes('anbefaling') || (childType && childType !== 'kapittel')) {
        page.expandableChildren.push(child)
        return
      }

      addNode(chapterIndex, child, [...path, childIndex], id)
    })
  }

  entries.forEach((entry) => {
    if (entry.chapter) {
      addNode(entry.index, entry.chapter, [], null, entry.link.title || 'Uten tittel')
      return
    }

    const id = toNodeId(entry.index, [])
    const title = entry.link.title || 'Uten tittel'
    const placeholderNode: NestedContent = {
      id: entry.link.href || `placeholder-${entry.index}`,
      tittel: title,
      type: entry.link.type || 'kapittel',
    }

    pagesById.set(id, {
      id,
      title,
      numbering: toNumbering(entry.index, []),
      depth: 1,
      parentId: null,
      childrenIds: [],
      expandableChildren: [],
      node: placeholderNode,
      isPlaceholder: true,
      placeholderStatus: entry.fetchError ? 'error' : 'loading',
      placeholderError: entry.fetchError,
    })
    rootIds.push(id)
  })

  return { rootIds, pagesById }
}

export function getAncestorIds(
  pagesById: Map<string, PageNode>,
  pageId: string,
) {
  const ids = new Set<string>()
  let current = pagesById.get(pageId)

  while (current?.parentId) {
    ids.add(current.parentId)
    current = pagesById.get(current.parentId)
  }

  return ids
}

export function getSelectedAncestorIds(
  pagesById: Map<string, PageNode>,
  activePage?: PageNode,
) {
  if (!activePage) return new Set<string>()

  const ids = new Set<string>()
  let current: PageNode | undefined = activePage

  while (current?.parentId) {
    ids.add(current.parentId)
    current = pagesById.get(current.parentId)
  }

  return ids
}
