import type { NestedContent } from '../../../types'
import type { ChapterEntry, PageNode, TreeResult } from './types'

export function getNodeTitle(node: NestedContent, fallback = 'Uten tittel') {
  return node.tittel || node.title || fallback
}

export function getNodeType(node: NestedContent) {
  if (!node.type) return ''
  return node.type.trim().toLowerCase()
}

export function formatDateLabel(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('nb-NO')
}

export function hasVisibleContent(value?: string) {
  if (!value) return false
  const plainText = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return plainText.length > 0
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

export function buildPageTree(entries: Array<ChapterEntry & { chapter: NestedContent }>): TreeResult {
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

    node.children?.forEach((child, childIndex) => {
      const childType = getNodeType(child)

      if (childType.includes('anbefaling') || (childType && childType !== 'kapittel')) {
        page.expandableChildren.push(child)
        return
      }

      addNode(chapterIndex, child, [...path, childIndex], id)
    })
  }

  entries.forEach((entry) => {
    addNode(entry.index, entry.chapter, [], null, entry.link.tittel || 'Uten tittel')
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
