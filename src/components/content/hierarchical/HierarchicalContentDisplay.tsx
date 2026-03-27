import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { IoSearch, IoClose } from 'react-icons/io5'
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useHierarchicalChapters } from '../../../hooks/queries/useHierarchicalChapters'
import { useBackgroundPrefetch } from '../../../hooks/queries/useBackgroundPrefetch'
import type { ContentDisplayProps } from '../../../types/pages'
import type { NestedContent } from '../../../types'
import { ContentPageHeader } from '../ContentPageHeader'
import { ContentBodyLoadingSkeleton } from '../ContentSkeletons'
import { PageContent } from './PageContent'
import type { PageNode } from './types'
import { SidebarTree } from './SidebarTree'
import {
  buildPageTree,
  formatDateLabel,
  getAncestorIds,
  getNodeTitle,
  getNodeType,
  getSelectedAncestorIds,
} from './treeUtils'
import { fetchChapter } from '../../../lib/content/chapterFetch'
import { dedupeNestedContents } from '../../../lib/content/nestedContentDedup'
import { RichContentHtml } from '../shared/RichContentHtml'

const DESKTOP_LG_MEDIA_QUERY = '(min-width: 1024px)'

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function textMatchesQuery(texts: Array<string | undefined | null>, lower: string): boolean {
  return texts.some((t) => t && stripHtml(t).toLowerCase().includes(lower))
}

function isReferenceType(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

function nestedContentMatchesQuery(node: NestedContent, lower: string): boolean {
  if (isReferenceType(node)) return false
  if (getNodeTitle(node).toLowerCase().includes(lower)) return true
  if (textMatchesQuery([node.intro, node.tekst, node.body, node.data?.praktisk, node.data?.rasjonale], lower)) return true
  if (node.children) {
    return node.children.some((child) => nestedContentMatchesQuery(child, lower))
  }
  return false
}

/** Only checks the page's own title/text, not its children */
function pageOwnContentMatches(
  node: PageNode,
  lower: string,
  cachedContent: NestedContent | null,
): boolean {
  if (node.title.toLowerCase().includes(lower)) return true
  if (textMatchesQuery([node.node.intro, node.node.tekst, node.node.body], lower)) return true
  if (cachedContent && textMatchesQuery([cachedContent.intro, cachedContent.tekst, cachedContent.body], lower)) return true
  return false
}

function getExpandableChildren(page: PageNode, cached: NestedContent | null): NestedContent[] {
  if (!cached?.children) return page.expandableChildren
  return cached.children.filter((c) => {
    const t = getNodeType(c)
    return t && t !== 'kapittel'
  })
}

function filterPage(
  page: PageNode,
  query: string,
  pagesById: Map<string, PageNode>,
  getCachedContent: (nodeId: string) => NestedContent | null,
): PageNode | null {
  const lower = query.toLowerCase()
  const cached = getCachedContent(page.node.id)

  // If the page's own title/text matches, show everything
  if (pageOwnContentMatches(page, lower, cached)) return page

  // Filter expandable children to only matching ones
  const expandableSource = getExpandableChildren(page, cached)
  const matchingExpandable = expandableSource.filter((child) =>
    nestedContentMatchesQuery(child, lower),
  )

  // Recursively filter tree children
  const matchingChildIds = page.childrenIds.filter((childId) => {
    const child = pagesById.get(childId)
    if (!child) return false
    return filterPage(child, lower, pagesById, getCachedContent) !== null
  })

  if (matchingExpandable.length === 0 && matchingChildIds.length === 0) return null

  return {
    ...page,
    expandableChildren: matchingExpandable,
    childrenIds: matchingChildIds,
  }
}

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
  const queryClient = useQueryClient()
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [autoOpenExpandableId, setAutoOpenExpandableId] = useState<string | null>(null)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [overviewFilter, setOverviewFilter] = useState('')
  const contentRef = useRef<HTMLElement>(null)
  const mobileSidebarDialogRef = useRef<HTMLDivElement>(null)
  const mobileSidebarCloseButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)
  const mobileSidebarDialogId = 'mobile-chapter-nav-dialog'
  const mobileSidebarDialogTitleId = 'mobile-chapter-nav-dialog-title'
  const scrollOnNextPageChange = useRef(false)
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

  // Reverse lookup: content node ID → page tree ID
  const contentIdToPageId = useMemo(() => {
    const map = new Map<string, string>()
    for (const [pageId, page] of pageTree.pagesById) {
      if (page.node?.id) map.set(page.node.id, pageId)
    }
    return map
  }, [pageTree])

  const activePage = useMemo(() => {
    const asSelectable = (page?: ReturnType<typeof pageTree.pagesById.get>) =>
      page && !page.isPlaceholder ? page : undefined

    const resolveById = (id: string | null) => {
      if (!id) return undefined
      // Try direct page tree ID first, then fall back to content node ID
      return asSelectable(pageTree.pagesById.get(id))
        ?? asSelectable(pageTree.pagesById.get(contentIdToPageId.get(id) ?? ''))
    }

    const fromLocationState = resolveById(locationSectionId)
    if (fromLocationState) return fromLocationState

    const fromLegacyQuery = resolveById(legacySectionId)
    if (fromLegacyQuery) return fromLegacyQuery

    return undefined
  }, [contentIdToPageId, legacySectionId, locationSectionId, pageTree])
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
      return fetchChapter(activeNodeId, signal, activePage?.node?.sistFagligOppdatert)
    },
    enabled: Boolean(isStubPage || needsExpandableContent),
    staleTime: 5 * 60 * 1000,
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
      const allLazyChildren = dedupeNestedContents(lazyPageContent.children)
      const lazyExpandable = isStubPage
        ? allLazyChildren
        : allLazyChildren.filter((child) => {
            const type = getNodeType(child)
            return type && type !== 'kapittel'
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

  const { data: fetchedExpandableResult, isFetching: isExpandableFetching } = useQuery({
    queryKey: ['expandable-children', activeNodeId, expandableStubIds],
    queryFn: async ({ signal }) => {
      const map = new Map<string, NestedContent>()
      const failedStubIds: string[] = []
      const stubFallbacks = new Map<string, string | undefined>()
      if (pageWithLazyContent) {
        for (const child of pageWithLazyContent.expandableChildren) {
          if (child.id && child.sistFagligOppdatert) {
            stubFallbacks.set(child.id, child.sistFagligOppdatert)
          }
        }
      }
      await Promise.all(
        expandableStubIds.map(async (stubId) => {
          try {
            const fetchedChapter = await fetchChapter(stubId, signal, stubFallbacks.get(stubId))
            map.set(stubId, fetchedChapter)
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') throw err
            failedStubIds.push(stubId)
          }
        }),
      )
      return { map, failedStubIds }
    },
    enabled: expandableStubIds.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const isLazyFetching = isLazyPageFetching || isExpandableFetching

  // Stage 3: Replace stubs with individually fetched content
  const effectiveActivePage = useMemo(() => {
    if (!pageWithLazyContent) return pageWithLazyContent

    if (fetchedExpandableResult?.map && fetchedExpandableResult.map.size > 0) {
      const expandableChildren = dedupeNestedContents(pageWithLazyContent.expandableChildren.map((stub) => {
        if (!stub.id) return stub
        return fetchedExpandableResult.map.get(stub.id) ?? stub
      }))
      return { ...pageWithLazyContent, expandableChildren }
    }

    return pageWithLazyContent
  }, [pageWithLazyContent, fetchedExpandableResult])

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

  const handleShowOverview = useCallback(() => {
    setAutoOpenExpandableId(null)
    navigate(
      {
        pathname: location.pathname,
        search: searchWithoutSection,
        hash: location.hash,
      },
      {
        replace: true,
        state: {
          ...toLocationStateObject(location.state),
          sectionId: undefined,
        },
      },
    )
  }, [location.hash, location.pathname, location.state, navigate, searchWithoutSection])

  const closeMobileSidebarNav = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  const handleSelectPage = useCallback((pageId: string, expandableId?: string, scrollTo?: boolean) => {
    const page = pageTree.pagesById.get(pageId)
    if (!page || page.isPlaceholder) return

    scrollOnNextPageChange.current = scrollTo === true
    setAutoOpenExpandableId(expandableId ?? null)
    if (locationSectionId !== pageId || hasLegacySectionParam) {
      updateHistorySection(pageId)
    }

    setExpandedIds(() => {
      const ancestorIds = getAncestorIds(pageTree.pagesById, pageId)
      const next = new Set(ancestorIds)
      if (page.childrenIds.length > 0) {
        next.add(pageId)
      }
      return next
    })
  }, [
    hasLegacySectionParam,
    locationSectionId,
    pageTree.pagesById,
    updateHistorySection,
  ])

  const handleMobileSelectPage = useCallback(
    (pageId: string) => {
      handleSelectPage(pageId)
      closeMobileSidebarNav()
    },
    [closeMobileSidebarNav, handleSelectPage],
  )

  const handleMobileShowOverview = useCallback(() => {
    handleShowOverview()
    closeMobileSidebarNav()
  }, [closeMobileSidebarNav, handleShowOverview])

  const handleSidebarSelectPage = useCallback((pageId: string, expandableId?: string, scrollTo?: boolean) => {
    setOverviewFilter('')
    handleSelectPage(pageId, expandableId, scrollTo)
  }, [handleSelectPage])

  const handleSidebarShowOverview = useCallback(() => {
    setOverviewFilter('')
    handleShowOverview()
  }, [handleShowOverview])

  const handleMobileSidebarSelectPage = useCallback((pageId: string) => {
    setOverviewFilter('')
    handleMobileSelectPage(pageId)
  }, [handleMobileSelectPage])

  const handleMobileSidebarShowOverview = useCallback(() => {
    setOverviewFilter('')
    handleMobileShowOverview()
  }, [handleMobileShowOverview])

  const handleToggleExpand = useCallback((pageId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pageId)) {
        next.delete(pageId)
      } else {
        next.add(pageId)
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!isMobileSidebarOpen) return

    const desktopMediaQuery = window.matchMedia(DESKTOP_LG_MEDIA_QUERY)
    if (desktopMediaQuery.matches) {
      setIsMobileSidebarOpen(false)
      return
    }

    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const getFocusableElements = () => {
      const dialog = mobileSidebarDialogRef.current
      if (!dialog) return [] as HTMLElement[]

      const elements = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )

      return Array.from(elements).filter((element) => {
        if (element.hasAttribute('disabled')) return false
        if (element.getAttribute('aria-hidden') === 'true') return false
        return element.offsetParent !== null || element === document.activeElement
      })
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileSidebarOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const dialog = mobileSidebarDialogRef.current
      if (!dialog) return

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const activeInsideDialog = active instanceof Node && dialog.contains(active)

      if (event.shiftKey) {
        if (!activeInsideDialog || active === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (!activeInsideDialog || active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    const handleDesktopBreakpointChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false)
      }
    }
    desktopMediaQuery.addEventListener('change', handleDesktopBreakpointChange)

    const focusTimer = window.setTimeout(() => {
      mobileSidebarCloseButtonRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.removeEventListener('keydown', handleKeyDown)
      desktopMediaQuery.removeEventListener('change', handleDesktopBreakpointChange)

      const previousFocused = previousFocusedElementRef.current
      if (previousFocused && previousFocused.isConnected) {
        previousFocused.focus()
      }
      previousFocusedElementRef.current = null
    }
  }, [isMobileSidebarOpen])

  useEffect(() => {
    if (!activePage?.id) return

    if (locationSectionId !== activePage.id || hasLegacySectionParam) {
      updateHistorySection(activePage.id, true)
    }
  }, [
    activePage?.id,
    hasLegacySectionParam,
    locationSectionId,
    updateHistorySection,
  ])

  useEffect(() => {
    if (!activePage || autoOpenExpandableId || !scrollOnNextPageChange.current) return
    scrollOnNextPageChange.current = false

    const contentEl = contentRef.current
    if (!contentEl) return

    contentEl.scrollIntoView({ block: 'start' })
  }, [activePage, autoOpenExpandableId])

  useEffect(() => {
    if (!autoOpenExpandableId || !activePage) return

    let attempts = 0
    const maxAttempts = 20
    const interval = setInterval(() => {
      const escaped = CSS.escape(autoOpenExpandableId)
      const el = document.querySelector(`[data-expandable-id="${escaped}"]`)
      if (el) {
        clearInterval(interval)
        const y = el.getBoundingClientRect().top + window.scrollY - 60
        window.scrollTo({ top: y })
      }
      if (++attempts >= maxAttempts) clearInterval(interval)
    }, 100)

    return () => clearInterval(interval)
  }, [autoOpenExpandableId, activePage])

  const metadataItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = []

    const firstPublished = formatDateLabel(content.first_published)
    if (firstPublished) {
      items.push({ label: 'Først publisert', value: firstPublished })
    }

    const professionallyUpdated = formatDateLabel(content.last_reviewed_date)
    if (professionallyUpdated) {
      items.push({ label: 'Siste faglige endring', value: professionallyUpdated })
    }

    return items
  }, [content])

  const combinedFailedCount = failedEntries.length + (fetchedExpandableResult?.failedStubIds?.length ?? 0)

  return (
    <div className="flex flex-col gap-8">
      <ContentPageHeader typeLabel={typeLabel} title={content.title} />

      <div className="grid gap-8 lg:grid-cols-[minmax(230px,270px)_1fr]">
        <aside className="hidden space-y-6 border-slate-200 lg:block lg:border-r lg:pr-6">
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
              onSelectPage={handleSidebarSelectPage}
              onToggleExpand={handleToggleExpand}
              onShowOverview={handleSidebarShowOverview}
              isOverviewActive={!activePage}
            />
          )}
          {isChaptersLoading && loadedChapters.length > 0 && (
            <Paragraph data-size="sm" style={{ marginTop: 0, marginBottom: 0, color: '#64748b' }}>
              Laster flere kapitler i bakgrunnen...
            </Paragraph>
          )}

        </aside>

        <section ref={contentRef} className="min-w-0">
          {entries.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="mb-4 flex w-full items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-slate-50 lg:hidden"
                aria-haspopup="dialog"
                aria-expanded={isMobileSidebarOpen}
                aria-controls={mobileSidebarDialogId}
              >
                <span className="min-w-0">
                  <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    {activePage ? 'Kapittelnavigasjon' : 'Innholdsoversikt'}
                  </span>
                  <span className="block truncate text-sm font-semibold text-slate-800">
                    {activePage
                      ? `${activePage.numbering ? `${activePage.numbering} ` : ''}${activePage.title}`
                      : 'Åpne kapittelliste'}
                  </span>
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                  <ChevronRightIcon aria-hidden="true" className="h-4 w-4" />
                </span>
              </button>

              {isMobileSidebarOpen && (
                <div
                  className="fixed inset-0 z-50 overflow-hidden bg-slate-900/35 p-3 backdrop-blur-[1px] lg:hidden"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  style={{ touchAction: 'none' }}
                >
                  <div
                    id={mobileSidebarDialogId}
                    ref={mobileSidebarDialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={mobileSidebarDialogTitleId}
                    tabIndex={-1}
                    className="mx-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                    style={{ touchAction: 'pan-y' }}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <div className="min-w-0">
                        <p className="m-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                          Navigasjon
                        </p>
                        <p id={mobileSidebarDialogTitleId} className="m-0 truncate text-sm font-semibold text-slate-900">
                          Kapittelliste
                        </p>
                      </div>
                      <button
                        ref={mobileSidebarCloseButtonRef}
                        type="button"
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                      >
                        Lukk
                      </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                      <SidebarTree
                        rootIds={pageTree.rootIds}
                        pagesById={pageTree.pagesById}
                        expandedIds={effectiveExpandedIds}
                        activePageId={activePage?.id}
                        selectedAncestorIds={selectedAncestorIds}
                        onSelectPage={handleMobileSidebarSelectPage}
                        onToggleExpand={handleToggleExpand}
                        emphasizeExpandControl
                        onShowOverview={handleMobileSidebarShowOverview}
                        isOverviewActive={!activePage}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {entries.length === 0 && !isChaptersLoading && (
            <Paragraph className="lg:hidden" style={{ marginTop: 0, marginBottom: 0, color: '#64748b' }}>
              Ingen undersider registrert på denne siden.
            </Paragraph>
          )}

          {isChaptersLoading && loadedChapters.length > 0 && (
            <Paragraph data-size="sm" className="mt-3 lg:hidden" style={{ marginBottom: 0, color: '#64748b' }}>
              Laster flere kapitler i bakgrunnen...
            </Paragraph>
          )}

          {isChaptersLoading && !activePage && <ContentBodyLoadingSkeleton />}

          {isStubPage && isLazyFetching && <ContentBodyLoadingSkeleton />}

          {effectiveActivePage && !(isStubPage && isLazyFetching) && (() => {
            const hasChildren = effectiveActivePage.childrenIds.length > 0 || effectiveActivePage.expandableChildren.length > 0
            const trimmedFilter = overviewFilter.trim().length >= 3 ? overviewFilter.trim() : ''
            const getCachedContent = (nodeId: string): NestedContent | null =>
              queryClient.getQueryData<NestedContent>(['lazy-page-content', nodeId]) ?? null
            const filteredActivePage = hasChildren && trimmedFilter
              ? filterPage(effectiveActivePage, trimmedFilter, pageTree.pagesById, getCachedContent) ?? effectiveActivePage
              : effectiveActivePage
            const noResults = hasChildren && trimmedFilter && filterPage(effectiveActivePage, trimmedFilter, pageTree.pagesById, getCachedContent) === null

            return (
              <>
                {hasChildren && (
                  <div className="relative mb-4">
                    <IoSearch className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    <input
                      type="text"
                      value={overviewFilter}
                      onChange={(e) => setOverviewFilter(e.target.value)}
                      placeholder="Søk i innholdet (minst 3 tegn)..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    {overviewFilter && (
                      <button
                        type="button"
                        onClick={() => setOverviewFilter('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border-0 bg-slate-200 p-0 text-slate-500 cursor-pointer transition-colors hover:bg-slate-300 hover:text-slate-700"
                        aria-label="Tøm filter"
                      >
                        <IoClose className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
                {noResults ? (
                  <Paragraph style={{ marginTop: 0, color: '#64748b' }}>
                    Ingen treff for «{trimmedFilter}»
                  </Paragraph>
                ) : (
                  <PageContent
                    activePage={trimmedFilter ? filteredActivePage : effectiveActivePage}
                    pagesById={pageTree.pagesById}
                    onSelectPage={handleSelectPage}
                    previousPage={previousPage}
                    nextPage={nextPage}
                    isLoadingExpandable={isExpandableFetching || (isLazyPageFetching && needsExpandableContent)}
                    autoOpenExpandableId={autoOpenExpandableId}
                    filterQuery={trimmedFilter}
                  />
                )}
              </>
            )
          })()}

          {!activePage && !isChaptersLoading && orderedPageIds.length > 0 && (() => {
            const allOverviewPages = orderedPageIds
              .map((pageId) => pageTree.pagesById.get(pageId))
              .filter((page): page is PageNode => !!page && !page.isPlaceholder && page.depth <= 1)

            const trimmedFilter = overviewFilter.trim().length >= 3 ? overviewFilter.trim() : ''
            const getCachedContent = (nodeId: string): NestedContent | null =>
              queryClient.getQueryData<NestedContent>(['lazy-page-content', nodeId]) ?? null
            const filteredPages = trimmedFilter
              ? allOverviewPages
                  .map((page) => filterPage(page, trimmedFilter, pageTree.pagesById, getCachedContent))
                  .filter((page): page is PageNode => page !== null)
              : allOverviewPages

            return (
              <div>
                <div className="relative mb-4">
                  <IoSearch
                    className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={overviewFilter}
                    onChange={(e) => setOverviewFilter(e.target.value)}
                    placeholder="Søk i innholdet (minst 3 tegn)..."
                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  {overviewFilter && (
                    <button
                      type="button"
                      onClick={() => setOverviewFilter('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full border-0 bg-slate-200 p-0 text-slate-500 cursor-pointer transition-colors hover:bg-slate-300 hover:text-slate-700"
                      aria-label="Tøm filter"
                    >
                      <IoClose className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {filteredPages.length === 0 ? (
                  <Paragraph style={{ marginTop: 0, color: '#64748b' }}>
                    Ingen treff for «{trimmedFilter}»
                  </Paragraph>
                ) : (
                  filteredPages.map((page, index) => (
                    <div key={page.id} style={{
                      marginTop: index === 0 ? 0 : 40,
                      paddingTop: index > 0 ? 40 : undefined,
                      borderTop: index > 0 ? '1px solid #e2e8f0' : undefined,
                    }}>
                      <PageContent
                        activePage={page}
                        pagesById={pageTree.pagesById}
                        onSelectPage={handleSelectPage}
                        isOverview
                        filterQuery={trimmedFilter}
                      />
                    </div>
                  ))
                )}
              </div>
            )
          })()}

          {!activePage && !isChaptersLoading && pageTree.rootIds.length === 0 && content.body && (
            <RichContentHtml
              className="content-html text-base leading-7 text-slate-800"
              html={content.body}
            />
          )}

          {!isChaptersLoading && combinedFailedCount > 0 && (
            <Alert data-color="warning" className="mt-6">
              <Paragraph style={{ marginTop: 0 }}>
                {combinedFailedCount} undersider kunne ikke lastes fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}

        </section>
      </div>

      {!activePage && metadataItems.length > 0 && (
        <div className="mt-8 pt-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base text-slate-500">
            {metadataItems.map((item, index) => (
              <div key={item.label} className="flex items-center gap-x-6 gap-y-2">
                {index > 0 && (
                  <span className="hidden sm:inline text-slate-300" aria-hidden="true">|</span>
                )}
                <span>
                  <span className="font-medium text-slate-600">{item.label}:</span>{' '}
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

