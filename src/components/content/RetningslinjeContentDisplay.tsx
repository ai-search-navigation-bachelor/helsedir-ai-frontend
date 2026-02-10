import { useCallback, useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { useSearchParams } from 'react-router-dom'
import type { ContentDisplayProps } from '../../types/pages'
import { ContentPageHeader } from './ContentPageHeader'
import { PageContent } from './retningslinje/PageContent'
import { SidebarTree } from './retningslinje/SidebarTree'
import {
  buildPageTree,
  getAncestorIds,
  getSelectedAncestorIds,
} from './retningslinje/treeUtils'
import { useRetningslinjeChapters } from './retningslinje/useRetningslinjeChapters'

export function RetningslinjeContentDisplay({ content }: ContentDisplayProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const sectionFromUrl = searchParams.get('section')

  const {
    entries,
    loadedChapters,
    failedEntries,
    isChaptersLoading,
  } = useRetningslinjeChapters({
    contentId: content.id,
    links: content.links,
  })

  const pageTree = useMemo(() => buildPageTree(loadedChapters), [loadedChapters])
  const selectedPage = pageTree.pagesById.get(sectionFromUrl || '')
  const activePage = selectedPage ?? pageTree.pagesById.get(pageTree.rootIds[0] || '')
  const selectedAncestorIds = getSelectedAncestorIds(pageTree.pagesById, activePage)
  const effectiveExpandedIds = useMemo(() => {
    const next = new Set(expandedIds)
    if (!activePage) return next

    const ancestorIds = getAncestorIds(pageTree.pagesById, activePage.id)
    ancestorIds.forEach((id) => next.add(id))
    return next
  }, [expandedIds, activePage, pageTree.pagesById])
  const orderedPageIds = useMemo(() => {
    const ordered: string[] = []

    const visit = (pageId: string) => {
      const page = pageTree.pagesById.get(pageId)
      if (!page) return

      ordered.push(pageId)
      page.childrenIds.forEach((childId) => visit(childId))
    }

    pageTree.rootIds.forEach((rootId) => visit(rootId))
    return ordered
  }, [pageTree])
  const activePageIndex = activePage ? orderedPageIds.indexOf(activePage.id) : -1
  const previousPage =
    activePageIndex > 0
      ? pageTree.pagesById.get(orderedPageIds[activePageIndex - 1])
      : undefined
  const nextPage =
    activePageIndex >= 0 && activePageIndex < orderedPageIds.length - 1
      ? pageTree.pagesById.get(orderedPageIds[activePageIndex + 1])
      : undefined

  const updateSectionQuery = useCallback(
    (pageId: string, replace = true) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('section', pageId)
          return next
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  const handleSelectPage = (pageId: string) => {
    updateSectionQuery(pageId)

    const page = pageTree.pagesById.get(pageId)
    setExpandedIds(() => {
      const next = getAncestorIds(pageTree.pagesById, pageId)
      if (page && page.childrenIds.length > 0) {
        next.add(pageId)
      }
      return next
    })
  }

  useEffect(() => {
    const fallbackId = activePage?.id
    if (!fallbackId) return

    if (sectionFromUrl === fallbackId) return
    if (sectionFromUrl && pageTree.pagesById.has(sectionFromUrl)) return

    updateSectionQuery(fallbackId, true)
  }, [activePage?.id, sectionFromUrl, pageTree.pagesById, updateSectionQuery])

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
      <ContentPageHeader typeLabel="Retningslinje" title={content.title} />

      <div className="grid gap-8 lg:grid-cols-[minmax(290px,360px)_1fr]">
        <aside className="border-slate-200 lg:border-r lg:pr-6">
          {entries.length === 0 ? (
            <Paragraph style={{ marginBottom: 0, color: '#64748b' }}>
              Ingen barnesider registrert på denne retningslinjen.
            </Paragraph>
          ) : (
            <SidebarTree
              rootIds={pageTree.rootIds}
              pagesById={pageTree.pagesById}
              expandedIds={effectiveExpandedIds}
              activePageId={activePage?.id}
              selectedAncestorIds={selectedAncestorIds}
              onToggleExpanded={toggleExpanded}
              onSelectPage={handleSelectPage}
            />
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
              previousPage={previousPage}
              nextPage={nextPage}
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
                {failedEntries.length} barnesider kunne ikke lastes fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}
        </section>
      </div>
    </div>
  )
}
