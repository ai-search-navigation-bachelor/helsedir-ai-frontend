import { formatDateLabel } from '../../../lib/content/date'
import type { ContentDetail, ContentLink, NestedContent } from '../../../types'
import { hasVisibleContent } from '../shared/contentTextUtils'
import { getContentIdFromHref } from '../shared/linkUtils'

export interface VurderingSection {
  tradeoffs: string
  preferences: string
}

export interface AppendedDropdown {
  id: string
  title: string
  html: string
  vurdering?: VurderingSection
}

export interface ContentSection {
  id: string
  title: string
  html: string
  vurdering?: VurderingSection
  appendedDropdowns?: AppendedDropdown[]
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

  const appendedDropdowns: AppendedDropdown[] = []

  if (hasVisibleContent(practical)) {
    appendedDropdowns.push({
      id: 'section-praktisk',
      title: 'Praktisk informasjon',
      html: practical,
    })
  }

  const hasTradeoffs = hasVisibleContent(tradeoffs)
  const hasPreferences = hasVisibleContent(preferences)

  if (hasVisibleContent(rationale) || hasTradeoffs || hasPreferences) {
    appendedDropdowns.push({
      id: 'section-begrunnelse',
      title: 'Begrunnelse',
      html: rationale,
      ...(hasTradeoffs || hasPreferences
        ? { vurdering: { tradeoffs, preferences } }
        : {}),
    })
  }

  if (hasVisibleContent(mainBody)) {
    result.push({
      id: 'section-hovedanbefaling',
      title: primarySectionTitle,
      html: mainBody,
      ...(appendedDropdowns.length > 0 ? { appendedDropdowns } : {}),
    })
  } else {
    // Fallback: ingen hovedtekst – vis dropdowns som egne seksjoner
    appendedDropdowns.forEach((d) => {
      result.push({
        id: d.id,
        title: d.title,
        html: d.html,
        ...(d.vurdering ? { vurdering: d.vurdering } : {}),
      })
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
