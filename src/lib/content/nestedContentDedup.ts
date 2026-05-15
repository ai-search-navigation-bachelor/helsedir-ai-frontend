/**
 * Deduplication utilities for NestedContent trees.
 *
 * The Helsedirektoratet API occasionally returns the same content node through
 * multiple links (e.g. a chapter referenced both as a direct child and via a
 * related-content link). These helpers identify duplicates by id/path/url and,
 * when duplicates exist, keep the node with the richest data (most fields filled).
 */
import type { NestedContent } from '../../types'
import { getDisplayTitle } from '../displayTitle'

function normalizeValue(value?: string | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function getFallbackKey(node: NestedContent) {
  const title = normalizeValue(getDisplayTitle(node))
  const type = normalizeValue(
    node.type ||
    node.tekniskeData?.subtype ||
    node.tekniskeData?.infoType,
  )

  return [title, type].filter(Boolean).join('|')
}

function getNestedContentKey(node: NestedContent) {
  return normalizeValue(node.id)
    || normalizeValue(node.path)
    || normalizeValue(node.url)
    || getFallbackKey(node)
}

function getNodeRichness(node: NestedContent) {
  let score = 0

  if (normalizeValue(node.body) || normalizeValue(node.tekst)) score += 4
  if (normalizeValue(node.intro) || normalizeValue(node.kortIntro)) score += 2
  if (node.data && Object.keys(node.data).length > 0) score += 2
  if ((node.children?.length ?? 0) > 0) score += 3
  if (normalizeValue(node.path)) score += 1
  if (normalizeValue(node.url)) score += 1

  return score
}

function pickString(primary?: string | null, secondary?: string | null) {
  if (normalizeValue(primary)) return primary ?? undefined
  if (normalizeValue(secondary)) return secondary ?? undefined
  return undefined
}

function pickDefined<T>(primary: T | undefined, secondary: T | undefined) {
  return primary !== undefined ? primary : secondary
}

function pickNonEmptyArray<T>(primary?: T[] | null, secondary?: T[] | null) {
  if (primary && primary.length > 0) return primary
  if (secondary && secondary.length > 0) return secondary
  return undefined
}

function mergeNodes(current: NestedContent, incoming: NestedContent) {
  const winner = getNodeRichness(incoming) > getNodeRichness(current) ? incoming : current
  const loser = winner === incoming ? current : incoming

  const mergedChildren = dedupeNestedContents([
    ...(winner.children ?? []),
    ...(loser.children ?? []),
  ])

  const mergedData = winner.data || loser.data
    ? {
        ...(loser.data ?? {}),
        ...(winner.data ?? {}),
        nokkelInfo: winner.data?.nokkelInfo || loser.data?.nokkelInfo
          ? {
              ...(loser.data?.nokkelInfo ?? {}),
              ...(winner.data?.nokkelInfo ?? {}),
            }
          : undefined,
      }
    : undefined

  const mergedTekniskeData = winner.tekniskeData || loser.tekniskeData
    ? {
        ...(loser.tekniskeData ?? {}),
        ...(winner.tekniskeData ?? {}),
      }
    : undefined

  return {
    ...loser,
    ...winner,
    id: pickString(winner.id, loser.id) || '',
    path: pickString(winner.path, loser.path),
    type: pickString(winner.type, loser.type),
    tittel: pickString(winner.tittel, loser.tittel),
    kortTittel: pickString(winner.kortTittel, loser.kortTittel),
    title: pickString(winner.title, loser.title),
    short_title: pickString(winner.short_title, loser.short_title),
    display_title: pickString(winner.display_title, loser.display_title),
    tekst: pickString(winner.tekst, loser.tekst),
    body: pickString(winner.body, loser.body),
    intro: pickString(winner.intro, loser.intro),
    kortIntro: pickString(winner.kortIntro, loser.kortIntro),
    has_text_content: pickDefined(winner.has_text_content, loser.has_text_content),
    document_url: pickString(winner.document_url, loser.document_url),
    is_pdf_only: pickDefined(winner.is_pdf_only, loser.is_pdf_only),
    related_links: pickNonEmptyArray(winner.related_links, loser.related_links),
    status: pickString(winner.status, loser.status),
    forstPublisert: pickString(winner.forstPublisert, loser.forstPublisert),
    sistOppdatert: pickString(winner.sistOppdatert, loser.sistOppdatert),
    sistFagligOppdatert: pickString(winner.sistFagligOppdatert, loser.sistFagligOppdatert),
    url: pickString(winner.url, loser.url),
    data: mergedData,
    attachments: pickNonEmptyArray(winner.attachments, loser.attachments),
    tekniskeData: mergedTekniskeData,
    lenker: pickNonEmptyArray(winner.lenker, loser.lenker),
    links: pickNonEmptyArray(winner.links, loser.links),
    children: mergedChildren.length > 0 ? mergedChildren : undefined,
  }
}

export function dedupeNestedContents(children?: NestedContent[] | null) {
  const deduped = new Map<string, NestedContent>()

  for (const child of children ?? []) {
    const dedupedChildren = dedupeNestedContents(child.children)
    const sanitizedChild: NestedContent = {
      ...child,
      ...(dedupedChildren.length > 0 ? { children: dedupedChildren } : {}),
    }
    const key = getNestedContentKey(sanitizedChild)

    if (!key) {
      const uniqueKey = `__index__${deduped.size}`
      deduped.set(uniqueKey, sanitizedChild)
      continue
    }

    const existing = deduped.get(key)
    deduped.set(key, existing ? mergeNodes(existing, sanitizedChild) : sanitizedChild)
  }

  return Array.from(deduped.values())
}
