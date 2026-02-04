import { useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Heading, Link, Paragraph, Spinner } from '@digdir/designsystemet-react'
import type { ContentDisplayProps } from '../../types/pages'
import { PageContent } from './retningslinje/PageContent'
import { SidebarTree } from './retningslinje/SidebarTree'
import {
  buildPageTree,
  getAncestorIds,
  getSelectedAncestorIds,
} from './retningslinje/treeUtils'
import { useRetningslinjeChapters } from './retningslinje/useRetningslinjeChapters'

export function RetningslinjeContentDisplay({ content }: ContentDisplayProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const {
    entries,
    loadedChapters,
    failedEntries,
    supportingLinks,
    isChaptersLoading,
  } = useRetningslinjeChapters({
    contentId: content.id,
    links: content.links,
  })

  const pageTree = useMemo(() => buildPageTree(loadedChapters), [loadedChapters])
  const selectedPage = pageTree.pagesById.get(selectedPageId || '')
  const activePage = selectedPage ?? pageTree.pagesById.get(pageTree.rootIds[0] || '')
  const selectedAncestorIds = getSelectedAncestorIds(pageTree.pagesById, activePage)

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId)

    const page = pageTree.pagesById.get(pageId)
    setExpandedIds(() => {
      const next = getAncestorIds(pageTree.pagesById, pageId)
      if (page && page.childrenIds.length > 0) {
        next.add(pageId)
      }
      return next
    })
  }

  const toggleExpanded = (pageId: string) => {
    const page = pageTree.pagesById.get(pageId)
    if (!page || page.childrenIds.length === 0) return

    setExpandedIds((prev) => {
      if (prev.has(pageId)) {
        return getAncestorIds(pageTree.pagesById, pageId)
      }

      const next = getAncestorIds(pageTree.pagesById, pageId)
      next.add(pageId)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">Retningslinje</span>
        </div>
        <Heading level={1} data-size="xl" style={{ marginBottom: 0 }}>
          {content.title}
        </Heading>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(290px,360px)_1fr]">
        <aside className="border-slate-200 lg:border-r lg:pr-6">
          {entries.length === 0 ? (
            <Paragraph style={{ marginBottom: 0, color: '#64748b' }}>
              Ingen barnesider registrert pa denne retningslinjen.
            </Paragraph>
          ) : (
            <SidebarTree
              rootIds={pageTree.rootIds}
              pagesById={pageTree.pagesById}
              expandedIds={expandedIds}
              activePageId={activePage?.id}
              selectedAncestorIds={selectedAncestorIds}
              onToggleExpanded={toggleExpanded}
              onSelectPage={handleSelectPage}
            />
          )}

          {supportingLinks.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-4">
              <Heading level={3} data-size="2xs" style={{ marginBottom: 8 }}>
                Relaterte lenker
              </Heading>
              <ul className="m-0 list-none space-y-1 p-0">
                {supportingLinks.map((link) => (
                  <li key={`${link.rel}-${link.href}`}>
                    <Link href={link.href} className="text-sm">
                      {link.tittel || link.rel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {isChaptersLoading && (
            <div className="flex justify-center py-12">
              <Spinner aria-label="Laster kapitler..." />
            </div>
          )}

          {!isChaptersLoading && activePage && (
            <PageContent
              activePage={activePage}
              pagesById={pageTree.pagesById}
              onSelectPage={handleSelectPage}
            />
          )}

          {!isChaptersLoading && !activePage && content.body && (
            <div
              className="content-html text-base leading-7 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          )}

          {!isChaptersLoading && failedEntries.length > 0 && (
            <Alert data-color="warning" className="mt-6">
              <Paragraph style={{ marginTop: 0 }}>
                {failedEntries.length} barnesider kunne ikke lastes fra Helsedirektoratet API akkurat na.
              </Paragraph>
            </Alert>
          )}
        </section>
      </div>
    </div>
  )
}
