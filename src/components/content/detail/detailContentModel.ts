import type { ContentLink } from '../../../types'
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

export interface ContextualNavigationLink extends ContentLink {
  contentId: string
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
