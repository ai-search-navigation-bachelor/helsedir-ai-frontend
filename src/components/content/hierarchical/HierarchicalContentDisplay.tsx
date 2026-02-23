import { useCallback, useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useContentNavigationStore } from '../../../stores'
import { useHierarchicalChapters } from '../../../hooks/queries/useHierarchicalChapters'
import { useBackgroundPrefetch } from '../../../hooks/queries/useBackgroundPrefetch'
import type { ContentDisplayProps } from '../ContentDisplay'
import type { NestedContent } from '../../../types'
import { ContentPageHeader } from '../ContentPageHeader'
import { ContentBodyLoadingSkeleton } from '../ContentSkeletons'
import { PageContent } from './PageContent'
import { SidebarTree } from './SidebarTree'
import {
  buildPageTree,
  formatDateLabel,
  getAncestorIds,
  getNodeType,
  getSelectedAncestorIds,
} from './treeUtils'
import { fetchChapter } from '../../../lib/content/chapterFetch'

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
  // Lazy-load content for stub pages (sub-chapters with no body/expandable content)
  const activeNodeId = activePage?.node?.id ?? null
  const isStubPage =
    Boolean(activeNodeId) &&
    !activePage?.isPlaceholder &&
    !activePage?.node?.body &&
    !activePage?.node?.tekst &&
    !activePage?.node?.intro &&
    activePage?.expandableChildren.length === 0 &&
    activePage?.childrenIds.length === 0

  // Lazy-load full content when the active page has expandable children stubs (no body/data yet)
  const needsExpandableContent =
    Boolean(activeNodeId) &&
    activePage !== undefined &&
    !activePage.isPlaceholder &&
    !isStubPage &&
    activePage.expandableChildren.length > 0 &&
    activePage.expandableChildren.some(
      (child) => !child.body && !child.tekst && !child.intro && !child.data,
    )

  const { data: lazyPageContent, isFetching: isLazyPageFetching } = useQuery({
    queryKey: ['lazy-page-content', activeNodeId],
    queryFn: async ({ signal }) => {
      if (!activeNodeId) return null
      return fetchChapter(activeNodeId, signal)
    },
    enabled: Boolean(isStubPage || needsExpandableContent),
    staleTime: 10 * 60 * 1000,
  })

  // Stage 1: Merge lazy page content into activePage
  // For stub pages (not in the tree), ALL children become expandable (including kapittel)
  // For non-stub pages, only non-kapittel children become expandable (kapittel are tree nodes)
  const pageWithLazyContent = useMemo(() => {
    if (!activePage) return activePage

    let node = activePage.node
    let expandableChildren = activePage.expandableChildren

    if (lazyPageContent) {
      node = lazyPageContent
      const allLazyChildren = lazyPageContent.children ?? []
      const lazyExpandable = isStubPage
        ? allLazyChildren
        : allLazyChildren.filter((child) => {
            const type = getNodeType(child as NestedContent)
            return type.includes('anbefaling') || (type && type !== 'kapittel')
          })
      if (lazyExpandable.length > 0) {
        expandableChildren = lazyExpandable
      }
    }

    return { ...activePage, node, expandableChildren }
  }, [activePage, lazyPageContent, isStubPage])

  // Stage 2: Fetch expandable children stubs individually (their id is often an href URL)
  const expandableStubIds = useMemo(() => {
    if (!pageWithLazyContent || pageWithLazyContent.expandableChildren.length === 0) return []
    return pageWithLazyContent.expandableChildren
      .filter((child) => child.id && !child.body && !child.tekst && !child.intro && !child.data)
      .map((child) => child.id)
  }, [pageWithLazyContent])

  const { data: fetchedExpandableMap, isFetching: isExpandableFetching } = useQuery({
    queryKey: ['expandable-children', activeNodeId, expandableStubIds],
    queryFn: async ({ signal }) => {
      const map = new Map<string, NestedContent>()
      await Promise.all(
        expandableStubIds.map(async (stubId) => {
          try {
            const content = await fetchChapter(stubId, signal)
            map.set(stubId, content)
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') throw err
          }
        }),
      )
      return map
    },
    enabled: expandableStubIds.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  const isLazyFetching = isLazyPageFetching || isExpandableFetching

  // Stage 3: Replace stubs with individually fetched content
  const effectiveActivePage = useMemo(() => {
    if (!pageWithLazyContent) return pageWithLazyContent

    if (fetchedExpandableMap && fetchedExpandableMap.size > 0) {
      const expandableChildren = pageWithLazyContent.expandableChildren.map((stub) => {
        if (!stub.id) return stub
        return fetchedExpandableMap.get(stub.id) ?? stub
      })
      return { ...pageWithLazyContent, expandableChildren }
    }

    return pageWithLazyContent
  }, [pageWithLazyContent, fetchedExpandableMap])

  useBackgroundPrefetch(pageTree.pagesById, activePage?.id, isLazyFetching)

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

    setExpandedIds((prev) => {
      const next = getAncestorIds(pageTree.pagesById, pageId)
      if (page.childrenIds.length > 0) {
        // Toggle: collapse if already expanded, expand if not
        if (!prev.has(pageId)) {
          next.add(pageId)
        }
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

      <div className="grid gap-8 lg:grid-cols-[minmax(230px,270px)_1fr]">
        <aside className="space-y-6 border-slate-200 lg:border-r lg:pr-6">
          {entries.length === 0 ? (
            <Paragraph style={{ marginBottom: 0, color: '#64748b' }}>
              Ingen undersider registrert på denne siden.
            </Paragraph>
          ) : (
            <SidebarTree
              rootIds={pageTree.rootIds}
              pagesById={pageTree.pagesById}
              expandedIds={effectiveExpandedIds}
              activePageId={activePage?.id}
              selectedAncestorIds={selectedAncestorIds}
              onSelectPage={handleSelectPage}
            />
          )}
          {isChaptersLoading && loadedChapters.length > 0 && (
            <Paragraph data-size="sm" style={{ marginTop: 0, marginBottom: 0, color: '#64748b' }}>
              Laster flere kapitler i bakgrunnen...
            </Paragraph>
          )}

        </aside>

        <section className="min-w-0">
          {isChaptersLoading && !activePage && <ContentBodyLoadingSkeleton />}

          {isStubPage && isLazyFetching && <ContentBodyLoadingSkeleton />}

          {effectiveActivePage && !(isStubPage && isLazyFetching) && (
            <PageContent
              activePage={effectiveActivePage}
              pagesById={pageTree.pagesById}
              onSelectPage={handleSelectPage}
              previousPage={previousPage}
              nextPage={nextPage}
              isLoadingExpandable={isExpandableFetching || (isLazyPageFetching && needsExpandableContent)}
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
                {failedEntries.length} undersider kunne ikke lastes fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}

          {metadataItems.length > 0 && (
            <section className="mt-8 border-t border-slate-200 pt-6">
              <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Nøkkelinformasjon
              </p>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {metadataItems.map((item) => (
                  <li key={item.label}>
                    <p className="m-0 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{item.label}:</span> {item.value}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </div>
    </div>
  )
}

