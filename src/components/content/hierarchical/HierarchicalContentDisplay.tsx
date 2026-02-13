import { useCallback, useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useContentNavigationStore } from '../../../stores'
import type { ContentDisplayProps } from '../../../types/pages'
import { ContentPageHeader } from '../ContentPageHeader'
import { ContentBodyLoadingSkeleton } from '../ContentSkeletons'
import { PageContent } from './PageContent'
import { SidebarTree } from './SidebarTree'
import {
  buildPageTree,
  formatDateLabel,
  getAncestorIds,
  getSelectedAncestorIds,
} from './treeUtils'
import { useHierarchicalChapters } from './useHierarchicalChapters'

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

interface HierarchicalContentDisplayProps extends ContentDisplayProps {
  typeLabel?: string
}

export function HierarchicalContentDisplay({
  content,
  typeLabel = 'Retningslinje',
}: HierarchicalContentDisplayProps) {
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
  } = useHierarchicalChapters({
    contentId: content.id,
    links: content.links,
  })

  const pageTree = useMemo(() => buildPageTree(entries), [entries])
  const activePage = useMemo(() => {
    const asSelectable = (page?: ReturnType<typeof pageTree.pagesById.get>) =>
      page && !page.isPlaceholder ? page : undefined

    const fromLocationState =
      locationSectionId ? asSelectable(pageTree.pagesById.get(locationSectionId)) : undefined
    if (fromLocationState) return fromLocationState

    const fromLegacyQuery = legacySectionId
      ? asSelectable(pageTree.pagesById.get(legacySectionId))
      : undefined
    if (fromLegacyQuery) return fromLegacyQuery

    const fromStore = storedSectionId
      ? asSelectable(pageTree.pagesById.get(storedSectionId))
      : undefined
    if (fromStore) return fromStore

    const firstRootId = pageTree.rootIds[0]
    const firstRootPage = firstRootId ? asSelectable(pageTree.pagesById.get(firstRootId)) : undefined
    if (firstRootPage) return firstRootPage

    // Keep waiting for chapter 1 while loading to avoid jumping between chapters.
    if (isChaptersLoading) {
      return undefined
    }

    // If chapter 1 failed, fall back to the first loaded chapter after loading is complete.
    const firstLoadedRootId = pageTree.rootIds.find((rootId) => {
      const rootPage = pageTree.pagesById.get(rootId)
      return Boolean(rootPage) && !rootPage?.isPlaceholder
    })

    return firstLoadedRootId ? pageTree.pagesById.get(firstLoadedRootId) : undefined
  }, [isChaptersLoading, legacySectionId, locationSectionId, pageTree, storedSectionId])
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
    const page = pageTree.pagesById.get(pageId)
    if (!page || page.isPlaceholder) return

    setSectionForContent(content.id, pageId)
    if (locationSectionId !== pageId || hasLegacySectionParam) {
      updateHistorySection(pageId, false)
    }

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

  const metadataItems = useMemo(() => {
    if (!activePage?.node) return []

    const items: Array<{ label: string; value: string }> = []
    const node = activePage.node

    if (node.status) {
      items.push({ label: 'Status', value: node.status })
    }

    const firstPublished = formatDateLabel(node.forstPublisert)
    if (firstPublished) {
      items.push({ label: 'Først publisert', value: firstPublished })
    }

    const updated = formatDateLabel(node.sistOppdatert)
    if (updated) {
      items.push({ label: 'Sist oppdatert', value: updated })
    }

    const professionallyUpdated = formatDateLabel(node.sistFagligOppdatert)
    if (professionallyUpdated) {
      items.push({ label: 'Sist faglig oppdatert', value: professionallyUpdated })
    }

    return items
  }, [activePage])

  return (
    <div className="flex flex-col gap-8">
      <ContentPageHeader typeLabel={typeLabel} title={content.title} />

      <div className="grid gap-8 lg:grid-cols-[minmax(290px,360px)_1fr]">
        <aside className="space-y-6 border-slate-200 lg:border-r lg:pr-6">
          {entries.length === 0 ? (
            <Paragraph style={{ marginBottom: 0, color: '#64748b' }}>
              Ingen barnesider registrert på denne siden.
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
          {isChaptersLoading && loadedChapters.length > 0 && (
            <Paragraph data-size="sm" style={{ marginTop: 0, marginBottom: 0, color: '#64748b' }}>
              Laster flere kapitler i bakgrunnen...
            </Paragraph>
          )}

          {metadataItems.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Heading level={3} data-size="2xs" style={{ marginBottom: 8 }}>
                Nøkkelinformasjon
              </Heading>
              <ul className="m-0 list-none space-y-2 p-0">
                {metadataItems.map((item) => (
                  <li key={item.label}>
                    <Paragraph
                      data-size="sm"
                      style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}
                    >
                      <span className="font-semibold">{item.label}:</span> {item.value}
                    </Paragraph>
                  </li>
                ))}
              </ul>
            </section>
          )}

        </aside>

        <section className="min-w-0">
          {isChaptersLoading && !activePage && <ContentBodyLoadingSkeleton />}

          {activePage && (
            <PageContent
              activePage={activePage}
              pagesById={pageTree.pagesById}
              onSelectPage={handleSelectPage}
              previousPage={previousPage}
              nextPage={nextPage}
            />
          )}

          {!activePage && content.body && (
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

