import { ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import type { PageNode } from './types'

interface SidebarTreeProps {
  rootIds: string[]
  pagesById: Map<string, PageNode>
  expandedIds: Set<string>
  activePageId?: string
  selectedAncestorIds: Set<string>
  onToggleExpanded: (pageId: string) => void
  onSelectPage: (pageId: string) => void
}

export function SidebarTree({
  rootIds,
  pagesById,
  expandedIds,
  activePageId,
  selectedAncestorIds,
  onToggleExpanded,
  onSelectPage,
}: SidebarTreeProps) {
  const renderNode = (nodeId: string): React.ReactNode => {
    const page = pagesById.get(nodeId)
    if (!page) return null

    const hasChildren = page.childrenIds.length > 0
    const isExpanded = expandedIds.has(page.id)
    const isSelected = activePageId === page.id
    const isAncestor = selectedAncestorIds.has(page.id)
    const textColor = isSelected
      ? 'text-blue-800'
      : isAncestor
        ? 'text-slate-900'
        : 'text-slate-500'
    const fontWeight = isSelected ? 'font-bold' : isAncestor ? 'font-semibold' : 'font-normal'

    return (
      <li key={page.id} className="border-b border-slate-200">
        <div
          className="flex items-start gap-1 py-2"
          style={{ paddingLeft: `${(page.depth - 1) * 14}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleExpanded(page.id)}
              className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-slate-700 hover:bg-slate-100"
              aria-label={isExpanded ? 'Lukk kategori' : 'Åpne kategori'}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="inline-block h-6 w-6 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onSelectPage(page.id)}
            className={`sidebar-tree__item-button min-w-0 flex-1 cursor-pointer py-0.5 text-left text-[1.05rem] leading-7 whitespace-normal break-words transition-colors ${textColor} ${fontWeight}`}
          >
            <span className="mr-2 text-sm text-slate-400">{page.numbering}</span>
            {page.title}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <ul className="m-0 list-none p-0">
            {page.childrenIds.map((childId) => renderNode(childId))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav aria-label="Retningslinje sider">
      <ul className="m-0 list-none border-t border-slate-200 p-0">
        {rootIds.map((rootId) => renderNode(rootId))}
      </ul>
    </nav>
  )
}
