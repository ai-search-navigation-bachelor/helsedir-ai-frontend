import type { ContentLink, ContentRelationItem } from '../../../types'
import { hasVisibleContent } from '../shared/contentTextUtils'
import { getContentIdFromHref } from '../shared/linkUtils'
import { buildContentUrl } from '../../../lib/contentUrl'

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

export interface ContextualNavigationLink extends ContentLink {
  contentId: string
}

function toContextualNavigationLink(link: ContentLink | ContentRelationItem) {
  if ('rel' in link) {
    return {
      ...link,
      contentId: getContentIdFromHref(link.href),
    }
  }

  return {
    rel: 'root',
    type: link.content_type || link.info_type || '',
    title: link.title,
    href: link.path
      ? buildContentUrl({ path: link.path, id: link.id })
      : `/content/${link.id}`,
    id: link.id,
    path: link.path || null,
    contentId: link.id,
  }
}

export const LINK_LABEL_BY_REL: Record<string, string> = {
  root: 'Rotpublikasjon',
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


export function buildContextualNavigationLinks(
  contentId: string,
  supportingLinks: Array<ContentLink | ContentRelationItem>,
): ContextualNavigationLink[] {
  const seenContentIds = new Set<string>()

  return supportingLinks
    .filter((link) => ('rel' in link ? link.rel === 'root' : true))
    .map(toContextualNavigationLink)
    .filter((link): link is ContentLink & { contentId: string } => Boolean(link.contentId))
    .filter((link) => link.contentId !== contentId)
    .filter((link) => {
      if (seenContentIds.has(link.contentId)) return false
      seenContentIds.add(link.contentId)
      return true
    })
}
