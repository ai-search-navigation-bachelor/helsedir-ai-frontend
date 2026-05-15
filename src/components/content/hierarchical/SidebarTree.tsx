/** Tree navigation sidebar for hierarchical content; renders the chapter tree with expand/collapse and active-node highlighting. */
import { ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import type { PageNode } from './types'

interface SidebarTreeProps {
  rootIds: string[]
  pagesById: Map<string, PageNode>
  expandedIds: Set<string>
  activePageId?: string
  selectedAncestorIds: Set<string>
  onSelectPage: (pageId: string) => void
  onToggleExpand?: (pageId: string) => void
  emphasizeExpandControl?: boolean
  onShowOverview?: () => void
  isOverviewActive?: boolean
}

export function SidebarTree({
  rootIds,
  pagesById,
  expandedIds,
  activePageId,
  selectedAncestorIds,
  onSelectPage,
  onToggleExpand,
  emphasizeExpandControl = false,
  onShowOverview,
  isOverviewActive = false,
}: SidebarTreeProps) {
  const renderNode = (nodeId: string): React.ReactNode => {
    const page = pagesById.get(nodeId)
    if (!page) return null

    const hasChildren = page.childrenIds.length > 0
    const isPlaceholder = page.isPlaceholder === true
    const placeholderStatus = page.placeholderStatus || 'loading'
    const isPlaceholderError = isPlaceholder && placeholderStatus === 'error'
    const isExpanded = expandedIds.has(page.id)
    const isSelected = activePageId === page.id
    const isAncestor = selectedAncestorIds.has(page.id)

    const showChevron = hasChildren

    const textColor = isSelected
      ? 'text-[#025169]'
      : isAncestor
        ? 'text-slate-800'
        : 'text-slate-500'
    const fontWeight = isSelected ? 'font-semibold' : isAncestor ? 'font-medium' : 'font-normal'

    const handleClick = () => {
      if (isPlaceholder) return
      onSelectPage(page.id)
    }

    const handleToggleExpand = () => {
      if (!hasChildren || isPlaceholder) return
      if (onToggleExpand) {
        onToggleExpand(page.id)
        return
      }
      onSelectPage(page.id)
    }

    return (
      <li key={page.id} className="border-b border-slate-200">
        {isPlaceholder ? (
          <div
            className="flex items-start gap-1 py-2"
            style={{ paddingLeft: `${(page.depth - 1) * 14}px` }}
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden="true">
              {isPlaceholderError ? (
                <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-semibold text-amber-700">
                  !
                </span>
              ) : (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
              )}
            </span>
            <span
              className={`min-w-0 flex-1 py-0.5 text-left text-sm leading-6 whitespace-normal break-words ${
                isPlaceholderError ? 'cursor-not-allowed text-slate-400' : 'cursor-progress text-slate-500'
              }`}
              title={isPlaceholderError ? page.placeholderError || 'Kunne ikke laste kapittel' : undefined}
            >
              <span className="mr-2 text-sm text-slate-400">{page.numbering}</span>
              {page.title}
            </span>
          </div>
        ) : (
          <div
            className="flex items-center gap-1 py-1"
            style={{ paddingLeft: `${(page.depth - 1) * 14}px` }}
          >
            <button
              type="button"
              onClick={handleClick}
              className={`min-w-0 flex-1 border-0 bg-transparent py-1 text-left transition-colors hover:text-[#025169] hover:underline ${textColor} ${fontWeight} cursor-pointer`}
            >
              <span className="min-w-0 flex-1 py-0.5 text-sm leading-6 whitespace-normal break-words">
                <span className="mr-2 text-sm text-slate-400">{page.numbering}</span>
                {page.title}
              </span>
            </button>
            {showChevron && (
              <button
                type="button"
                onClick={handleToggleExpand}
                aria-label={`${isExpanded ? 'Skjul' : 'Vis'} underkapitler for ${page.title}`}
                aria-expanded={isExpanded}
                className={
                  emphasizeExpandControl
                    ? `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white transition-colors ${
                        isExpanded
                          ? 'border-slate-300 text-[#025169]'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`
                    : 'flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:text-slate-700'
                }
              >
                {isExpanded ? (
                  <ChevronDownIcon className={emphasizeExpandControl ? 'h-5 w-5' : 'h-4 w-4'} />
                ) : (
                  <ChevronRightIcon className={emphasizeExpandControl ? 'h-5 w-5' : 'h-4 w-4'} />
                )}
              </button>
            )}
          </div>
        )}

        {hasChildren && isExpanded && (
          <ul className="m-0 list-none p-0">
            {page.childrenIds.map((childId) => renderNode(childId))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav aria-label="Innholdssider">
      <ul className="m-0 list-none border-t border-slate-200 p-0">
        {onShowOverview && (
          <li className="border-b border-slate-200">
            <button
              type="button"
              onClick={onShowOverview}
              aria-current={isOverviewActive ? 'page' : undefined}
              className={`flex w-full items-start gap-1 border-0 bg-transparent py-2 text-left text-sm transition-colors cursor-pointer ${
                isOverviewActive
                  ? 'text-[#025169] font-semibold'
                  : 'text-slate-500 font-normal hover:text-[#025169] hover:underline'
              }`}
            >
              <span className="min-w-0 flex-1 py-0.5 leading-6 whitespace-normal break-words">
                Oversikt
              </span>
            </button>
          </li>
        )}
        {rootIds.map((rootId) => renderNode(rootId))}
      </ul>
    </nav>
  )
}
