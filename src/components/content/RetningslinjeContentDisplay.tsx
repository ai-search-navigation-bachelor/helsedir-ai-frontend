import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import { Alert, Heading, Link, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { fetchChapterWithSubchapters } from '../../api'
import type { ContentLink, NestedContent } from '../../types'
import type { ContentDisplayProps } from '../../types/pages'

interface ChapterEntry {
  index: number
  link: ContentLink
  chapter?: NestedContent
  fetchError?: string
}

interface PageNode {
  id: string
  title: string
  numbering: string
  depth: number
  parentId: string | null
  childrenIds: string[]
  recommendationChildren: NestedContent[]
  node: NestedContent
}

interface TreeResult {
  rootIds: string[]
  pagesById: Map<string, PageNode>
}

function getNodeTitle(node: NestedContent, fallback = 'Uten tittel') {
  return node.tittel || node.title || fallback
}

function getNodeType(node: NestedContent) {
  if (!node.type) return ''
  return node.type.trim().toLowerCase()
}

function formatDateLabel(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('nb-NO')
}

function toNodeId(chapterIndex: number, path: number[]) {
  return path.length === 0
    ? `chapter-${chapterIndex}`
    : `chapter-${chapterIndex}-node-${path.join('-')}`
}

function toNumbering(chapterIndex: number, path: number[]) {
  if (path.length === 0) return `${chapterIndex + 1}`
  return [chapterIndex + 1, ...path.map((part) => part + 1)].join('.')
}

function buildPageTree(entries: Array<ChapterEntry & { chapter: NestedContent }>): TreeResult {
  const pagesById = new Map<string, PageNode>()
  const rootIds: string[] = []

  const addNode = (
    chapterIndex: number,
    node: NestedContent,
    path: number[],
    parentId: string | null,
    fallbackTitle?: string,
  ) => {
    const id = toNodeId(chapterIndex, path)
    const page: PageNode = {
      id,
      title: getNodeTitle(node, fallbackTitle),
      numbering: toNumbering(chapterIndex, path),
      depth: path.length + 1,
      parentId,
      childrenIds: [],
      recommendationChildren: [],
      node,
    }
    pagesById.set(id, page)

    if (parentId) {
      const parent = pagesById.get(parentId)
      if (parent) parent.childrenIds.push(id)
    } else {
      rootIds.push(id)
    }

    node.children?.forEach((child, childIndex) => {
      const childType = getNodeType(child)

      if (childType.includes('anbefaling') || (childType && childType !== 'kapittel')) {
        page.recommendationChildren.push(child)
        return
      }

      addNode(chapterIndex, child, [...path, childIndex], id)
    })
  }

  entries.forEach((entry) => {
    addNode(entry.index, entry.chapter, [], null, entry.link.tittel || 'Uten tittel')
  })

  return { rootIds, pagesById }
}

export function RetningslinjeContentDisplay({ content }: ContentDisplayProps) {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const childrenLinks = useMemo(
    () => content.links?.filter((link) => link.rel === 'barn' && Boolean(link.href)) ?? [],
    [content.links]
  )

  const supportingLinks = useMemo(
    () => content.links?.filter((link) => link.rel !== 'barn' && Boolean(link.href)) ?? [],
    [content.links]
  )

  const childrenKey = useMemo(
    () => childrenLinks.map((link) => link.href).join(','),
    [childrenLinks]
  )

  const { data: chapterEntries, isLoading: chaptersLoading } = useQuery<ChapterEntry[]>({
    queryKey: ['retningslinje-chapters', content.id, childrenKey],
    queryFn: async ({ signal }) => {
      const entries = await Promise.all(
        childrenLinks.map(async (link, index): Promise<ChapterEntry> => {
          if (!link.href) return { index, link, fetchError: 'Mangler href i barnelenke' }

          try {
            const chapter = await fetchChapterWithSubchapters(link.href, signal)
            return { index, link, chapter: { ...chapter, type: chapter.type || link.type } }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') throw error
            return {
              index,
              link,
              fetchError: error instanceof Error ? error.message : 'Ukjent feil',
            }
          }
        })
      )
      return entries
    },
    enabled: childrenLinks.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  const entries: ChapterEntry[] = chapterEntries ?? childrenLinks.map((link, index) => ({ index, link }))
  const loadedChapters = entries.filter((entry): entry is ChapterEntry & { chapter: NestedContent } => Boolean(entry.chapter))
  const failedEntries = entries.filter((entry) => !entry.chapter && Boolean(entry.fetchError))

  const pageTree = useMemo(() => buildPageTree(loadedChapters), [loadedChapters])
  const selectedPage = pageTree.pagesById.get(selectedPageId || '')
  const activePage = selectedPage ?? pageTree.pagesById.get(pageTree.rootIds[0] || '')

  const selectedAncestorIds = (() => {
    if (!activePage) return new Set<string>()

    const ids = new Set<string>()
    let current = activePage
    while (current.parentId) {
      ids.add(current.parentId)
      current = pageTree.pagesById.get(current.parentId) ?? current
      if (!current.parentId) break
    }

    return ids
  })()

  const getAncestorIds = (pageId: string) => {
    const ids = new Set<string>()
    let current = pageTree.pagesById.get(pageId)
    while (current?.parentId) {
      ids.add(current.parentId)
      current = pageTree.pagesById.get(current.parentId)
    }
    return ids
  }

  const handleSelectPage = (pageId: string) => {
    setSelectedPageId(pageId)

    const page = pageTree.pagesById.get(pageId)
    setExpandedIds(() => {
      const next = getAncestorIds(pageId)
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
        const keep = getAncestorIds(pageId)
        return keep
      }

      const next = getAncestorIds(pageId)
      next.add(pageId)
      return next
    })
  }

  const renderRecommendationDropdown = (
    item: NestedContent,
    key: string,
    depth = 0,
  ): React.ReactNode => {
    const type = getNodeType(item)
    const isRecommendation = type.includes('anbefaling')
    const title = getNodeTitle(item)
    const intro = item.intro || ''
    const body = item.tekst || item.body || ''
    const children = item.children || []

    const strength = item.data?.styrke || ''
    const status = item.status || ''
    const updated = formatDateLabel(item.sistOppdatert || item.sistFagligOppdatert)
    const shortIntro = item.kortIntro || ''
    const practical = item.data?.praktisk || ''
    const rationale = item.data?.rasjonale || ''
    const tradeoffs = item.data?.nokkelInfo?.fordelerogulemper || ''
    const preferences = item.data?.nokkelInfo?.verdierogpreferanser || ''

    return (
      <details key={key} className="mb-3 rounded-lg border border-slate-200 bg-white">
        <summary
          className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          style={{ paddingLeft: `${12 + depth * 12}px` }}
        >
          <div className="flex items-start gap-2">
            <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-1">

                {strength && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                    {strength}
                  </span>
                )}
              </div>
              <span className="block whitespace-normal break-words leading-6">{title}</span>
            </div>
          </div>
        </summary>

        <div className="px-3 pb-4 pt-1" style={{ paddingLeft: `${34 + depth * 12}px` }}>
          {(status || updated) && (
            <p className="mb-2 mt-0 text-xs text-slate-500">
              {status && <span>{status}</span>}
              {status && updated && <span> · </span>}
              {updated && <span>Oppdatert {updated}</span>}
            </p>
          )}

          {shortIntro && (
            <Paragraph style={{ marginTop: 0, marginBottom: 8, color: '#334155' }}>
              {shortIntro}
            </Paragraph>
          )}

          {intro && (
            <Paragraph style={{ marginTop: 0, marginBottom: 8, color: '#475569' }}>
              {intro}
            </Paragraph>
          )}

          {body && (
            <div
              className="content-html text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
            />
          )}

          {practical && (
            <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
                Praktisk
              </summary>
              <div
                className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(practical) }}
              />
            </details>
          )}

          {rationale && (
            <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
                Rasjonale
              </summary>
              <div
                className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rationale) }}
              />
            </details>
          )}

          {tradeoffs && (
            <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
                Fordeler og ulemper
              </summary>
              <div
                className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tradeoffs) }}
              />
            </details>
          )}

          {preferences && (
            <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
              <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
                Verdier og preferanser
              </summary>
              <div
                className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preferences) }}
              />
            </details>
          )}

          {children.length > 0 && (
            <div className="mt-2">
              {children.map((child, index) =>
                renderRecommendationDropdown(
                  child,
                  `${key}-${child.id || index}`,
                  depth + 1,
                )
              )}
            </div>
          )}
        </div>
      </details>
    )
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
            <nav aria-label="Retningslinje sider">
              <ul className="m-0 list-none border-t border-slate-200 p-0">
                {pageTree.rootIds.map((rootId) => {
                  const renderNode = (nodeId: string): React.ReactNode => {
                    const page = pageTree.pagesById.get(nodeId)
                    if (!page) return null

                    const hasChildren = page.childrenIds.length > 0
                    const isExpanded = expandedIds.has(page.id)
                    const isSelected = activePage?.id === page.id
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
                              onClick={() => toggleExpanded(page.id)}
                              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-700 hover:bg-slate-100"
                              aria-label={isExpanded ? 'Lukk kategori' : 'Aapne kategori'}
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
                            onClick={() => handleSelectPage(page.id)}
                            className={`min-w-0 flex-1 py-0.5 text-left text-[1.05rem] leading-7 whitespace-normal break-words ${isSelected ? '' : 'hover:text-slate-800'} hover:underline ${textColor} ${fontWeight}`}
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

                  return renderNode(rootId)
                })}
              </ul>
            </nav>
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
          {chaptersLoading && (
            <div className="flex justify-center py-12">
              <Spinner aria-label="Laster kapitler..." />
            </div>
          )}

          {!chaptersLoading && activePage && (
            <article>
              <div className="mb-6">
                <p className="m-0 mb-2 text-xs uppercase tracking-wide text-slate-500">
                  Side {activePage.numbering}
                </p>
                <Heading level={2} data-size="lg" style={{ marginBottom: 0 }}>
                  {activePage.title}
                </Heading>
              </div>

              {activePage.node.intro && (
                <Paragraph style={{ marginTop: 0, color: '#334155' }}>
                  {activePage.node.intro}
                </Paragraph>
              )}

              {(activePage.node.tekst || activePage.node.body) && (
                <div
                  className="content-html text-base leading-7 text-slate-800"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(activePage.node.tekst || activePage.node.body || ''),
                  }}
                />
              )}

              {activePage.recommendationChildren.length > 0 && (
                <section className="mt-8">
                  <Heading level={3} data-size="sm" style={{ marginBottom: 12 }}>
                    {activePage.recommendationChildren.length === 1 ? 'Anbefaling' : 'Anbefalinger'}
                  </Heading>
                  <div>
                    {activePage.recommendationChildren.map((item, index) =>
                      renderRecommendationDropdown(item, `${activePage.id}-rec-${item.id || index}`),
                    )}
                  </div>
                </section>
              )}
            </article>
          )}

          {!chaptersLoading && !activePage && content.body && (
            <div
              className="content-html text-base leading-7 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          )}

          {!chaptersLoading && failedEntries.length > 0 && (
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
