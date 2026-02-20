import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchChapterWithSubchapters } from '../../api'
import { getContent } from '../../api/content'
import type { ContentDetail, ContentLink, NestedContent } from '../../types'
import { getUniqueChildLinks } from '../../components/content/shared/linkUtils'
import type { ChapterEntry } from '../../components/content/hierarchical/types'

interface UseHierarchicalChaptersOptions {
  contentId: string
  links?: ContentLink[]
}

function isCancellationError(error: unknown) {
  if (!(error instanceof Error)) return false
  const name = error.name.toLowerCase()
  const message = error.message.toLowerCase()
  return (
    name === 'aborterror' ||
    name === 'cancellederror' ||
    name === 'cancelederror' ||
    message.includes('aborted') ||
    message.includes('canceled') ||
    message.includes('cancelled')
  )
}

function contentLinkToStub(link: ContentLink): NestedContent {
  return {
    id: link.id || link.href || '',
    tittel: link.tittel,
    type: link.type,
    children: link.children
      ?.filter((c) => Boolean(c.id || c.href))
      .map(contentLinkToStub),
  }
}

function contentDetailToNestedContent(detail: ContentDetail, children?: NestedContent[]): NestedContent {
  return {
    id: detail.id,
    tittel: detail.title,
    title: detail.title,
    type: detail.content_type,
    body: detail.body,
    status: detail.status,
    forstPublisert: detail.forstPublisert,
    sistOppdatert: detail.sistOppdatert,
    sistFagligOppdatert: detail.sistFagligOppdatert,
    url: detail.url,
    data: detail.anbefaling_fields
      ? {
          styrke: detail.anbefaling_fields.styrke,
          praktisk: detail.anbefaling_fields.praktisk,
          rasjonale: detail.anbefaling_fields.rasjonale,
          nokkelInfo: {
            fordelerogulemper: detail.anbefaling_fields.fordeler_ulemper,
            verdierogpreferanser: detail.anbefaling_fields.verdier_preferanser,
          },
        }
      : undefined,
    children,
  }
}

async function fetchBackendChapterWithChildren(
  id: string,
  signal?: AbortSignal,
  depth: number = 0,
  maxDepth: number = 10,
): Promise<NestedContent> {
  const detail = await getContent(id, undefined, { signal })
  const base = contentDetailToNestedContent(detail)

  if (depth >= maxDepth) return base

  const childLinks = (detail.links ?? []).filter(
    (l) => l.rel === 'barn' && Boolean(l.id || l.href),
  )
  if (childLinks.length === 0) return base

  const childResults = await Promise.all(
    childLinks.map(async (link) => {
      try {
        if (link.id) {
          return await fetchBackendChapterWithChildren(link.id, signal, depth + 1, maxDepth)
        }
        if (link.href) {
          return await fetchChapterWithSubchapters(link.href, signal, depth + 1, maxDepth)
        }
        return null
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error(`Failed to fetch child content at depth ${depth}:`, err)
        }
        return null
      }
    }),
  )

  const children = childResults.filter((c): c is NestedContent => c !== null)
  return { ...base, children }
}

export function useHierarchicalChapters({
  contentId,
  links,
}: UseHierarchicalChaptersOptions) {
  const childrenLinks = useMemo(() => getUniqueChildLinks<ContentLink>(links), [links])
  const chapterQueries = useQueries({
    queries: childrenLinks.map((link) => ({
      queryKey: ['hierarchical-chapter', contentId, link.id || link.href, link.type || ''],
      queryFn: async ({ signal }: { signal: AbortSignal }) => {
        if (link.id) {
          const chapter = await fetchBackendChapterWithChildren(link.id, signal)
          return { ...chapter, type: chapter.type || link.type }
        }
        if (link.href) {
          const chapter = await fetchChapterWithSubchapters(link.href, signal)
          return { ...chapter, type: chapter.type || link.type }
        }
        throw new Error('Mangler id og href i barnelenke')
      },
      enabled: Boolean(link.id || link.href),
      staleTime: 10 * 60 * 1000,
      retry: 1,
    })),
  })

  const entries: ChapterEntry[] = childrenLinks.map((link, index) => {
    const query = chapterQueries[index]
    if (!query) return { index, link }
    if (!link.id && !link.href) return { index, link, fetchError: 'Mangler id og href i barnelenke' }
    if (query.data) return { index, link, chapter: query.data }
    if (
      !query.isPending &&
      query.error &&
      !isCancellationError(query.error)
    ) {
      return {
        index,
        link,
        fetchError:
          query.error instanceof Error ? query.error.message : 'Ukjent feil',
      }
    }
    // Use embedded children as stub while backend/Helsedir fetch is loading
    if (link.children && link.children.length > 0) {
      return { index, link, chapter: contentLinkToStub(link) }
    }
    return { index, link }
  })

  const isChaptersLoading = chapterQueries.some((query) => query.isPending || query.isFetching)
  const loadedChapters = entries.filter(
    (entry): entry is ChapterEntry & { chapter: NonNullable<ChapterEntry['chapter']> } => Boolean(entry.chapter)
  )
  const failedEntries = entries.filter((entry) => !entry.chapter && Boolean(entry.fetchError))

  return {
    childrenLinks,
    entries,
    loadedChapters,
    failedEntries,
    isChaptersLoading,
  }
}
