import { formatDateLabel } from '../../../lib/content/date'
import type { ContentDetail, ContentLink, NestedContent } from '../../../types'
import { hasVisibleContent } from '../shared/contentTextUtils'
import { getContentIdFromHref } from '../shared/linkUtils'

export interface ContentSection {
  id: string
  title: string
  html: string
}

export interface MetadataItem {
  label: string
  value: string
}

export interface ContextualNavigationLink extends ContentLink {
  contentId: string
}

export const LINK_LABEL_BY_REL: Record<string, string> = {
  root: 'Rotpublikasjon',
}

function normalizeMetaField(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

// `null` and `undefined` are intentionally treated as "no value".
function chooseMetaField(primary?: string | null, secondary?: string | null): string | undefined {
  return normalizeMetaField(primary) ?? normalizeMetaField(secondary)
}

interface BuildSectionsOptions {
  mainBody: string
  practical: string
  rationale: string
  tradeoffs: string
  preferences: string
  primarySectionTitle: string
}

export function buildContentSections({
  mainBody,
  practical,
  rationale,
  tradeoffs,
  preferences,
  primarySectionTitle,
}: BuildSectionsOptions): ContentSection[] {
  const result: ContentSection[] = []

  if (hasVisibleContent(mainBody)) {
    result.push({
      id: 'section-hovedanbefaling',
      title: primarySectionTitle,
      html: mainBody,
    })
  }

  if (hasVisibleContent(practical)) {
    result.push({
      id: 'section-praktisk',
      title: 'Praktisk',
      html: practical,
    })
  }

  if (hasVisibleContent(rationale)) {
    result.push({
      id: 'section-rasjonale',
      title: 'Rasjonale',
      html: rationale,
    })
  }

  if (hasVisibleContent(tradeoffs)) {
    result.push({
      id: 'section-fordeler-ulemper',
      title: 'Fordeler og ulemper',
      html: tradeoffs,
    })
  }

  if (hasVisibleContent(preferences)) {
    result.push({
      id: 'section-verdier-preferanser',
      title: 'Verdier og preferanser',
      html: preferences,
    })
  }

  return result
}

export function buildMetadataItems(
  content: ContentDetail,
  enrichedContent?: NestedContent,
): MetadataItem[] {
  const items: MetadataItem[] = []
  const strength = chooseMetaField(content.anbefaling_fields?.styrke, enrichedContent?.data?.styrke)
  const status = chooseMetaField(content.status, enrichedContent?.status)
  const firstPublishedRaw = chooseMetaField(content.forstPublisert, enrichedContent?.forstPublisert)
  const updatedRaw = chooseMetaField(content.sistOppdatert, enrichedContent?.sistOppdatert)
  const professionallyUpdatedRaw = chooseMetaField(
    content.sistFagligOppdatert,
    enrichedContent?.sistFagligOppdatert,
  )
  const firstPublished = firstPublishedRaw ? formatDateLabel(firstPublishedRaw) : undefined
  const updated = updatedRaw ? formatDateLabel(updatedRaw) : undefined
  const professionallyUpdated = professionallyUpdatedRaw
    ? formatDateLabel(professionallyUpdatedRaw)
    : undefined

  if (strength) {
    items.push({ label: 'Anbefalingsstyrke', value: strength })
  }
  if (status) {
    items.push({ label: 'Status', value: status })
  }
  if (firstPublished) {
    items.push({ label: 'Først publisert', value: firstPublished })
  }
  if (updated) {
    items.push({ label: 'Sist oppdatert', value: updated })
  }
  if (professionallyUpdated) {
    items.push({ label: 'Sist faglig oppdatert', value: professionallyUpdated })
  }

  return items
}

export function buildContextualNavigationLinks(
  contentId: string,
  supportingLinks: ContentLink[],
): ContextualNavigationLink[] {
  const seenContentIds = new Set<string>()

  return supportingLinks
    .filter((link) => link.rel === 'root')
    .map((link) => ({
      ...link,
      contentId: getContentIdFromHref(link.href),
    }))
    .filter((link): link is ContentLink & { contentId: string } => Boolean(link.contentId))
    .filter((link) => link.contentId !== contentId)
    .filter((link) => {
      if (seenContentIds.has(link.contentId)) return false
      seenContentIds.add(link.contentId)
      return true
    })
}
