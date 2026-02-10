import { useCallback, useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useContentNavigationStore } from '../../stores'
import type { ContentDisplayProps } from '../../types/pages'
import { ContentPageHeader } from './ContentPageHeader'
import { ContentBodyLoadingSkeleton, ContentSidebarLoadingSkeleton } from './ContentSkeletons'
import { PageContent } from './retningslinje/PageContent'
import { SidebarTree } from './retningslinje/SidebarTree'
import {
  buildPageTree,
  getAncestorIds,
  getSelectedAncestorIds,
} from './retningslinje/treeUtils'
import { useRetningslinjeChapters } from './retningslinje/useRetningslinjeChapters'

function getSectionIdFromLocationState(state: unknown) {
  if (!state || typeof state !== 'object') return null
  const sectionId = (state as { sectionId?: unknown }).sectionId
  if (typeof sectionId !== 'string') return null
  const trimmed = sectionId.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toLocationStateObject(state: unknown) {
  if (!state || typeof state !== 'object') return {}
  return state as Record<string, unknown>
}

export function RetningslinjeContentDisplay({ content }: ContentDisplayProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const sectionByContentId = useContentNavigationStore((state) => state.sectionByContentId)
  const setSectionForContent = useContentNavigationStore((state) => state.setSectionForContent)
  const storedSectionId = sectionByContentId[content.id] || null
  const locationSectionId = useMemo(
    () => getSectionIdFromLocationState(location.state),
    [location.state]
  )
  const legacySectionId = useMemo(() => {
    const sectionId = new URLSearchParams(location.search).get('section')
    if (!sectionId) return null
    const trimmed = sectionId.trim()
    return trimmed.length > 0 ? trimmed : null
  }, [location.search])
  const searchWithoutSection = useMemo(() => {
    const params = new URLSearchParams(location.search)
    params.delete('section')
    const next = params.toString()
    return next ? `?${next}` : ''
  }, [location.search])
  const hasLegacySectionParam = useMemo(
    () => new URLSearchParams(location.search).has('section'),
    [location.search]
  )

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
  const activePage = useMemo(() => {
    const fromLocationState =
      locationSectionId ? pageTree.pagesById.get(locationSectionId) : undefined
    if (fromLocationState) return fromLocationState

    const fromLegacyQuery = legacySectionId ? pageTree.pagesById.get(legacySectionId) : undefined
    if (fromLegacyQuery) return fromLegacyQuery

    const fromStore = storedSectionId ? pageTree.pagesById.get(storedSectionId) : undefined
    if (fromStore) return fromStore

    return pageTree.pagesById.get(pageTree.rootIds[0] || '')
  }, [legacySectionId, locationSectionId, pageTree, storedSectionId])
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

  const updateHistorySection = useCallback(
    (pageId: string, replace = true) => {
      navigate(
        {
          pathname: location.pathname,
          search: searchWithoutSection,
          hash: location.hash,
        },
        {
          replace,
          state: {
            ...toLocationStateObject(location.state),
            sectionId: pageId,
          },
        },
      )
    },
    [location.hash, location.pathname, location.state, navigate, searchWithoutSection],
  )

  const handleSelectPage = (pageId: string) => {
    if (!pageTree.pagesById.has(pageId)) return

    setSectionForContent(content.id, pageId)
    if (locationSectionId !== pageId || hasLegacySectionParam) {
      updateHistorySection(pageId, false)
    }

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
    if (!activePage?.id) return

    if (storedSectionId !== activePage.id) {
      setSectionForContent(content.id, activePage.id)
    }

    if (locationSectionId !== activePage.id || hasLegacySectionParam) {
      updateHistorySection(activePage.id, true)
    }
  }, [
    activePage?.id,
    content.id,
    hasLegacySectionParam,
    locationSectionId,
    setSectionForContent,
    storedSectionId,
    updateHistorySection,
  ])

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
          {isChaptersLoading ? (
            <ContentSidebarLoadingSkeleton />
          ) : entries.length === 0 ? (
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
          {isChaptersLoading && <ContentBodyLoadingSkeleton />}

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
