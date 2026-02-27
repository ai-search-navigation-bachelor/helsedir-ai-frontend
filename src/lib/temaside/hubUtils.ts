import type { CustomLayout } from '../../components/content/temaside/customLayouts'
import type { ThemeNode } from './temasiderTree'
import type { BreadcrumbItem } from '../../components/ui/Breadcrumb'
import { normalizePath } from '../path'

export type HubLink = {
  path: string
  title: string
}

export type HubSection = {
  id: string
  title: string
  links: HubLink[]
}

export function normalizeTemasidePath(path: string) {
  return normalizePath(path)
}

export function buildTemasidePath(categorySlug: string, subPath: string) {
  return normalizeTemasidePath(`/${[categorySlug, subPath].filter(Boolean).join('/')}`)
}

function titleizeSegment(segment: string) {
  const decoded = decodeURIComponent(segment || '').replace(/-/g, ' ').trim()
  if (!decoded) return ''
  return decoded.charAt(0).toUpperCase() + decoded.slice(1)
}

export function buildTemasideBreadcrumbItems(
  temaPath: string,
  nodeByPath: Map<string, ThemeNode>,
  categoryTitle?: string,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: 'Forside', href: '/' }]
  const segments = temaPath.split('/').filter(Boolean)

  // Hub page (0–1 segments) — only show "Forside", don't link to self
  if (segments.length <= 1) {
    return items
  }

  const categoryPath = `/${segments[0]}`
  const categoryNodeTitle = nodeByPath.get(categoryPath)?.title
  items.push({
    label: categoryTitle || categoryNodeTitle || titleizeSegment(segments[0]) || categoryPath,
    href: categoryPath,
  })

  const currentNodeTitle = nodeByPath.get(temaPath)?.title
  const currentSegment = segments[segments.length - 1]
  items.push({
    label: currentNodeTitle || titleizeSegment(currentSegment) || temaPath,
    href: '#',
  })

  return items
}

export function compactDetailBreadcrumbItems(items: BreadcrumbItem[]) {
  if (items.length <= 4) {
    return items
  }

  return [...items.slice(0, 3), items[items.length - 1]]
}

function collectLeafNodes(node: ThemeNode): ThemeNode[] {
  if (node.children.length === 0) {
    return [node]
  }

  return node.children.flatMap(collectLeafNodes)
}

function sortByTitle(a: HubLink, b: HubLink) {
  return a.title.localeCompare(b.title, 'nb')
}

export function buildNodeByPathLookup(tree: ThemeNode | null) {
  const lookup = new Map<string, ThemeNode>()
  if (!tree) {
    return lookup
  }

  const addNode = (current: ThemeNode) => {
    lookup.set(current.path, current)
    current.children.forEach(addNode)
  }

  addNode(tree)
  return lookup
}

export function buildHubSections(
  node: ThemeNode,
  customLayout: CustomLayout | undefined,
  isFlatStructure: boolean,
  shouldForceFlat: boolean,
  lookupNodeByPath: (path: string) => ThemeNode | undefined,
): HubSection[] {
  if (customLayout) {
    return customLayout.sections
      .map((customSection) => ({
        id: customSection.title,
        title: customSection.title,
        links: customSection.paths
          .map((path) => lookupNodeByPath(path))
          .filter((linkNode): linkNode is ThemeNode => Boolean(linkNode))
          .map((linkNode) => ({ path: linkNode.path, title: linkNode.title }))
          .sort(sortByTitle),
      }))
      .filter((section) => section.links.length > 0)
  }

  if (isFlatStructure) {
    const flatNodes = shouldForceFlat
      ? collectLeafNodes(node).filter((leaf) => leaf.path !== node.path)
      : node.children

    return [
      {
        id: `${node.path}-all`,
        title: 'Alle undertemaer',
        links: flatNodes
          .map((child) => ({ path: child.path, title: child.title }))
          .sort(sortByTitle),
      },
    ]
  }

  return node.children
    .map((section) => {
      const sectionItems = section.children.length > 0 ? section.children : [section]
      return {
        id: section.path,
        title: section.title,
        links: sectionItems
          .map((item) => ({ path: item.path, title: item.title }))
          .sort(sortByTitle),
      }
    })
    .filter((section) => section.links.length > 0)
}

export function filterHubSectionsByQuery(sections: HubSection[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return sections
  }

  return sections
    .map((section) => {
      const isSectionMatch = section.title.toLowerCase().includes(normalizedQuery)
      const links = isSectionMatch
        ? section.links
        : section.links.filter((link) => link.title.toLowerCase().includes(normalizedQuery))

      return { ...section, links }
    })
    .filter((section) => section.links.length > 0)
}

export function countHubLinks(sections: HubSection[]) {
  return sections.reduce((sum, section) => sum + section.links.length, 0)
}

export function sanitizeTemasideBreadcrumbItems(items: BreadcrumbItem[]) {
  return items.filter((item) => item.label.toLowerCase() !== 'temasider')
}
