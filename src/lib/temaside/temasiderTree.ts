import { normalizePath } from '../path'

export type ThemeNode = {
  path: string // "/forebygging-diagnose-og-behandling"
  segment: string // "forebygging-diagnose-og-behandling"
  title: string // best-effort display title
  hasPage: boolean // true when this path exists as a real temaside page
  contentId?: string // content id for this temaside path when available
  children: ThemeNode[]
}

type ThemePathMeta = {
  title?: string
  contentId?: string
}

function titleize(segment: string) {
  // simple: "-" -> " ", capitalize first letter. You can override later.
  const s = segment.replace(/-/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function buildThemeTree(
  paths: readonly string[],
  metaByPath: Readonly<Record<string, ThemePathMeta>> = {},
): ThemeNode {
  const root: ThemeNode = { path: '/', segment: '', title: 'Root', hasPage: false, children: [] }

  for (const p of paths) {
    const clean = normalizePath(p)
    if (clean === '/') continue

    const parts = clean.split('/').filter(Boolean)

    let current = root
    let currentPath = ''
    for (const part of parts) {
      currentPath += `/${part}`
      const preferredMeta = metaByPath[currentPath]
      const preferredTitle = preferredMeta?.title
      const preferredContentId = preferredMeta?.contentId
      let child = current.children.find((c) => c.segment === part)

      if (!child) {
        child = {
          path: currentPath,
          segment: part,
          title: preferredTitle || titleize(part),
          hasPage: Boolean(preferredTitle || preferredContentId),
          contentId: preferredContentId,
          children: [],
        }
        current.children.push(child)
      } else if (preferredTitle || preferredContentId) {
        if (preferredTitle) {
          child.title = preferredTitle
        }
        child.hasPage = true
        if (preferredContentId) {
          child.contentId = preferredContentId
        }
      }
      current = child
    }
  }

  // Sort for stable UI
  const sortRec = (n: ThemeNode) => {
    n.children.sort((a, b) => a.title.localeCompare(b.title, 'nb'))
    n.children.forEach(sortRec)
  }
  sortRec(root)

  return root
}

export function findNodeByPath(root: ThemeNode, path: string): ThemeNode | null {
  const clean = normalizePath(path)
  if (clean === '/') return root

  const parts = clean.split('/').filter(Boolean)
  let current: ThemeNode = root

  for (const part of parts) {
    const next = current.children.find((c) => c.segment === part)
    if (!next) return null
    current = next
  }
  return current
}

export function splitIntoColumns<T>(items: T[], cols = 2): T[][] {
  const out: T[][] = Array.from({ length: cols }, () => [])
  items.forEach((item, i) => out[i % cols].push(item))
  return out
}
