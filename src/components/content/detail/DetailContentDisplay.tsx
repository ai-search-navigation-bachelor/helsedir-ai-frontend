import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import { useNavigate } from 'react-router-dom'
import {
  getDetailContentTypeLabel,
  isEhelsestandardContentType,
  isRecommendationContentType,
  isStatisticsContentType,
  isTemasideContentType,
  normalizeContentType,
} from '../../../constants/content'
import { formatDateLabel } from '../../../lib/content/date'
import { getDisplayTitle } from '../../../lib/displayTitle'
import { useEnrichedContentQuery } from '../../../hooks/queries/useEnrichedContentQuery'
import { useContentStatisticsQuery } from '../../../hooks/queries/useContentStatisticsQuery'
import type { ContentChildGroup, ContentLink, ContentRelationItem, NestedContent } from '../../../types'
import type { ContentDisplayProps } from '../../../types/pages'
import { ContentPageHeader } from '../ContentPageHeader'
import { asDocumentLink, getDocumentLinks, getRelatedLinks } from './documentUtils'
import { hasVisibleContent } from '../shared/contentTextUtils'
import { getContentIdFromHref, getUniqueChildLinks } from '../shared/linkUtils'
import { RichContentHtml } from '../shared/RichContentHtml'
import { normalizeLinkForComparison, toAbsoluteHelsedirUrl } from '../../../lib/helsedirUrl'
import {
  buildContentSections,
  type ContentSection,
  type VurderingSection,
} from './detailContentModel'
import { ContentStatisticsSection } from './ContentStatisticsSection'

function VurderingDetails({ vurdering }: { vurdering?: VurderingSection }) {
  if (!vurdering) return null
  const showTradeoffs = hasVisibleContent(vurdering.tradeoffs)
  const showPreferences = hasVisibleContent(vurdering.preferences)
  if (!showTradeoffs && !showPreferences) return null

  return (
    <details className="group/vurdering mt-4 rounded-lg border border-slate-200 bg-white transition-colors open:border-[#025169]/30 open:shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open/vurdering:rounded-b-none">
        <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/vurdering:rotate-90 group-open/vurdering:text-[#025169]" />
        <span className="text-[0.9375rem] font-medium text-slate-800 group-open/vurdering:text-[#025169]">
          Vurdering
        </span>
      </summary>
      <div className="space-y-6 border-t border-slate-200 pr-4 pl-[2.75rem] pb-5 pt-3">
        {showTradeoffs && (
          <div>
            <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 8 }}>
              Fordeler og ulemper
            </Heading>
            <RichContentHtml
              className="content-html text-base leading-7 text-slate-800"
              html={vurdering.tradeoffs}
            />
          </div>
        )}
        {showPreferences && (
          <div>
            <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 8 }}>
              Verdier og preferanser
            </Heading>
            <RichContentHtml
              className="content-html text-base leading-7 text-slate-800"
              html={vurdering.preferences}
            />
          </div>
        )}
      </div>
    </details>
  )
}

interface DetailContentDisplayProps extends ContentDisplayProps {
  typeLabelOverride?: string
  primarySectionTitle?: string
}

function isReferenceContentType(contentType?: string) {
  return normalizeContentType(contentType).includes('referanse')
}

function isNestedDetailChild(source: ContentRelationItem | NestedContent) {
  return (
    'type' in source ||
    'tittel' in source ||
    'tekst' in source ||
    'body' in source ||
    'data' in source
  )
}

function ReferenceDropdown({
  items,
  className = '',
}: {
  items: NestedContent[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <details className={`group/dropdown rounded-lg border border-slate-200 bg-white transition-colors open:border-[#025169]/30 open:shadow-sm ${className}`.trim()}>
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open/dropdown:rounded-b-none">
        <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/dropdown:rotate-90 group-open/dropdown:text-[#025169]" />
        <span className="text-[0.9375rem] font-medium text-slate-800 group-open/dropdown:text-[#025169]">
          Referanser
        </span>
      </summary>
      <div className="border-t border-slate-200 px-4 pb-5 pt-3">
        <ul className="m-0 list-none space-y-2 p-0">
          {items.map((item, index) => (
            <li
              key={`reference-${item.id || index}`}
              className="rounded-md px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {item.tittel || 'Uten tittel'}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

type DetailChildSource = ContentRelationItem | ContentLink | NestedContent

function toDetailChildItem(
  source: DetailChildSource,
  fallbackType?: string,
): NestedContent | null {
  if ('rel' in source) {
    const id = source.id || getContentIdFromHref(source.href) || ''
    if (!id) return null

    const title = getDisplayTitle(source, source.title || '')

    return {
      id,
      path: source.path || undefined,
      tittel: title,
      title,
      type: source.type || fallbackType,
      children: source.children
        ?.map((child) => toDetailChildItem(child))
        .filter((child): child is NestedContent => Boolean(child)),
    }
  }

  if (source.is_pdf_only && source.document_url) {
    return null
  }

  if (!source.id) return null

  const normalizedChildren = source.children
    ?.map((child) => toDetailChildItem(child))
    .filter((child): child is NestedContent => Boolean(child))
  const title = getDisplayTitle(
    source,
    source.title || ('tittel' in source ? source.tittel : undefined) || '',
  )
  const type =
    ('content_type' in source ? source.content_type : undefined) ||
    ('info_type' in source ? source.info_type : undefined) ||
    ('type' in source ? source.type : undefined) ||
    fallbackType

  return {
    ...(isNestedDetailChild(source) ? source : {}),
    id: source.id,
    path: source.path || undefined,
    tittel: title,
    title,
    short_title: 'short_title' in source ? source.short_title : undefined,
    display_title: 'display_title' in source ? source.display_title : undefined,
    type,
    children: normalizedChildren,
    has_text_content: source.has_text_content,
    document_url: source.document_url,
    is_pdf_only: source.is_pdf_only,
  }
}

function dedupeDetailChildItems(items: Array<NestedContent | null>) {
  const seen = new Set<string>()

  return items.filter((item): item is NestedContent => {
    if (!item) return false
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function getChildItemsFromGroups(
  groups: ContentChildGroup[] | null | undefined,
  predicate: (group: ContentChildGroup) => boolean,
) {
  return dedupeDetailChildItems(
    (groups ?? [])
      .filter(predicate)
      .flatMap((group) => group.items.map((item) => toDetailChildItem(item, group.info_type))),
  )
}

export function DetailContentDisplay({
  content,
  typeLabelOverride,
  primarySectionTitle = 'Hovedanbefaling',
}: DetailContentDisplayProps) {
  const navigate = useNavigate()
  const mobileSectionsNavRef = useRef<HTMLDetailsElement>(null)
  const normalizedType = normalizeContentType(content.content_type)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const backendDocumentUrl = content.document_url?.trim() || ''
  const isPdfOnlyContent = Boolean(content.is_pdf_only)
  const hasBodyContent = useMemo(
    () => {
      if (isPdfOnlyContent) return false
      if (typeof content.has_text_content === 'boolean') {
        return content.has_text_content && hasVisibleContent(content.body)
      }
      return hasVisibleContent(content.body)
    },
    [content.body, content.has_text_content, isPdfOnlyContent],
  )
  const backendPractical = content.anbefaling_fields?.praktisk || ''
  const backendRationale = content.anbefaling_fields?.rasjonale || ''
  const backendTradeoffs = content.anbefaling_fields?.fordeler_ulemper || ''
  const backendPreferences = content.anbefaling_fields?.verdier_preferanser || ''
  const hasBackendRecommendationSupplementaryContent =
    hasVisibleContent(backendPractical) ||
    hasVisibleContent(backendRationale) ||
    hasVisibleContent(backendTradeoffs) ||
    hasVisibleContent(backendPreferences)
  const hasBackendRecommendationStrength = Boolean(content.anbefaling_fields?.styrke?.trim())
  const hasSufficientBackendRecommendationData =
    hasBodyContent || hasBackendRecommendationSupplementaryContent || hasBackendRecommendationStrength
  const shouldSkipHelsedirEnrichment =
    isTemasideContentType(normalizedType) || isEhelsestandardContentType(normalizedType)
  const shouldSkipPdfOnlyEnrichment = isPdfOnlyContent && Boolean(backendDocumentUrl)
  const shouldQueryStatistics = isStatisticsContentType(normalizedType)
  const shouldAttemptEnrichment =
    !shouldSkipPdfOnlyEnrichment &&
    !shouldSkipHelsedirEnrichment &&
    (isRecommendationContentType(normalizedType)
      ? !hasSufficientBackendRecommendationData
      : !hasBodyContent)

  const {
    data: enrichedContent,
    error: enrichedError,
  } = useEnrichedContentQuery({
    contentId: content.id,
    contentType: normalizedType,
    enabled: shouldAttemptEnrichment,
  })
  const {
    data: statistics,
    error: statisticsError,
    isLoading: isStatisticsLoading,
  } = useContentStatisticsQuery({
    contentId: content.id,
    enabled: shouldQueryStatistics,
  })

  const sections = useMemo<ContentSection[]>(() => {
    const mainBody = hasBodyContent
      ? content.body
      : isPdfOnlyContent
        ? ''
        : enrichedContent?.tekst || enrichedContent?.body || ''
    const practical = hasVisibleContent(backendPractical)
      ? backendPractical
      : enrichedContent?.data?.praktisk || ''
    const rationale = hasVisibleContent(backendRationale)
      ? backendRationale
      : enrichedContent?.data?.rasjonale || ''
    const tradeoffs = hasVisibleContent(backendTradeoffs)
      ? backendTradeoffs
      : enrichedContent?.data?.nokkelInfo?.fordelerogulemper || ''
    const preferences = hasVisibleContent(backendPreferences)
      ? backendPreferences
      : enrichedContent?.data?.nokkelInfo?.verdierogpreferanser || ''

    const result = buildContentSections({
      mainBody,
      practical,
      rationale,
      tradeoffs,
      preferences,
      primarySectionTitle,
    })

    return result
  }, [
    backendPractical,
    backendPreferences,
    backendRationale,
    backendTradeoffs,
    content.body,
    enrichedContent,
    hasBodyContent,
    isPdfOnlyContent,
    primarySectionTitle,
  ])

  const highlightedSectionId =
    activeSectionId && sections.some((section) => section.id === activeSectionId)
      ? activeSectionId
      : sections[0]?.id || null

  const handleSectionNavigation = (sectionId: string, closeMobileNav = false) => {
    const target = document.getElementById(sectionId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setActiveSectionId(sectionId)
    if (closeMobileNav) {
      mobileSectionsNavRef.current?.removeAttribute('open')
    }
  }

  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const mostVisible = visible[0]
        if (mostVisible?.target?.id) {
          setActiveSectionId(mostVisible.target.id)
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    )

    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [sections])

  const childContentItems = useMemo(
    () => {
      const fallbackLinkItems = dedupeDetailChildItems(
        getUniqueChildLinks(content.links).map((link) => toDetailChildItem(link)),
      )

      const normalizedReferenceItems = dedupeDetailChildItems(
        (content.references ?? []).map((item) => toDetailChildItem(item, item.content_type || item.info_type)),
      )
      const normalizedRelatedItems = dedupeDetailChildItems(
        [...(content.chapters ?? []), ...(content.related_content ?? [])].map((item) =>
          toDetailChildItem(
            item,
            ('content_type' in item ? item.content_type : undefined) ||
              ('info_type' in item ? item.info_type : undefined) ||
              ('type' in item ? item.type : undefined),
          ),
        ),
      )

      const groupedItems = getChildItemsFromGroups(content.child_groups, () => true)
      const combinedItems = dedupeDetailChildItems([
        ...normalizedReferenceItems,
        ...normalizedRelatedItems,
        ...groupedItems,
      ])

      if (combinedItems.length > 0) {
        return combinedItems
      }

      return fallbackLinkItems
    },
    [content.child_groups, content.chapters, content.links, content.references, content.related_content],
  )
  const referenceItems = useMemo(
    () => {
      const normalizedReferenceItems = dedupeDetailChildItems(
        (content.references ?? []).map((item) => toDetailChildItem(item, item.content_type || item.info_type)),
      )
      if (normalizedReferenceItems.length > 0) return normalizedReferenceItems

      const groupedReferenceItems = getChildItemsFromGroups(
        content.child_groups,
        (group) => isReferenceContentType(group.info_type),
      )
      if (groupedReferenceItems.length > 0) return groupedReferenceItems

      return childContentItems.filter((item) => isReferenceContentType(item.type))
    },
    [childContentItems, content.child_groups, content.references],
  )

  const typeLabel = typeLabelOverride || getDetailContentTypeLabel(normalizedType)
  const documentLinks = useMemo(
    () => {
      const links = [...getDocumentLinks(content, content.links), ...getDocumentLinks(enrichedContent)]
      const deduplicatedLinks = links.filter(
        (document, index) => links.findIndex((candidate) => candidate.href === document.href) === index,
      )
      if (!backendDocumentUrl) return deduplicatedLinks
      if (deduplicatedLinks.some((document) => document.href === backendDocumentUrl)) return deduplicatedLinks

      const backendDocumentLink = asDocumentLink(backendDocumentUrl, undefined, 'fil')
      if (!backendDocumentLink) return deduplicatedLinks

      return [backendDocumentLink, ...deduplicatedLinks]
    },
    [backendDocumentUrl, content, enrichedContent],
  )
  const relatedLinks = useMemo(() => getRelatedLinks(content), [content])
  const visibleDocumentLinks = documentLinks
  const visibleRelatedLinks = relatedLinks
  const hasIntrinsicFallbackContent =
    visibleDocumentLinks.length > 0 ||
    visibleRelatedLinks.length > 0 ||
    referenceItems.length > 0
  const publicationUrl = useMemo(() => {
    const url = toAbsoluteHelsedirUrl(content.url) || toAbsoluteHelsedirUrl(enrichedContent?.url)
    if (!url) return null
    return documentLinks.some((document) => normalizeLinkForComparison(document.href) === url) ? null : url
  }, [content.url, documentLinks, enrichedContent?.url])
  const shouldShowPublicationFallback =
    Boolean(publicationUrl) &&
    sections.length === 0 &&
    referenceItems.length === 0 &&
    visibleRelatedLinks.length === 0 &&
    documentLinks.length === 0
  const hasAnyActionLinks =
    visibleDocumentLinks.length > 0 ||
    visibleRelatedLinks.length > 0 ||
    shouldShowPublicationFallback
  const shouldRenderStatisticsSection =
    Boolean(statistics?.has_statistics) || statistics?.statistics_status === 'unavailable'
  const showStatisticsSection =
    shouldQueryStatistics &&
    (
      isStatisticsLoading ||
      Boolean(statisticsError) ||
      shouldRenderStatisticsSection
    )
  const resourceSectionTitle =
    visibleDocumentLinks.length > 0 && visibleRelatedLinks.length === 0 ? 'Dokumenter' : 'Lenker'

  const handleRelatedLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    internalPath?: string,
  ) => {
    if (!internalPath) return
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      event.defaultPrevented
    ) {
      return
    }

    event.preventDefault()
    navigate(internalPath)
  }

  const hasSidebarContent = sections.length > 1
  const showSidebarLayout = hasSidebarContent

  return (
    <div className="flex flex-col gap-8">
      <ContentPageHeader typeLabel={typeLabel} title={content.title} />

      <div className={showSidebarLayout ? 'grid gap-8 lg:grid-cols-[minmax(230px,270px)_1fr]' : ''}>
        {showSidebarLayout && (
        <aside className="space-y-6 border-slate-200 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:border-r lg:pr-6">
          {sections.length > 1 && (
            <nav aria-label="Innholdsnavigasjon" className="hidden lg:block">
              <ul className="m-0 list-none border-t border-slate-200 p-0">
                {sections.map((section) => {
                  const isActive = highlightedSectionId === section.id
                  return (
                    <li key={section.id} className="border-b border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleSectionNavigation(section.id)}
                        className={`w-full px-0 py-3 text-left text-sm leading-6 border-0 bg-transparent cursor-pointer transition-colors hover:text-[#025169] hover:underline ${
                          isActive
                            ? 'font-semibold text-[#025169] underline [text-underline-offset:0.15rem]'
                            : 'text-slate-500'
                        }`}
                      >
                        {section.title}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}

          {sections.length > 0 && visibleDocumentLinks.length > 0 && (
            <section className="border-t border-slate-100 pl-7 pt-4">
              <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {resourceSectionTitle}
              </p>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {visibleDocumentLinks.map((document) => (
                  <li key={`document-${document.href}`}>
                    <a
                      href={document.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-[#025169] hover:underline"
                    >
                      {document.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
        )}

        <section className="min-w-0 space-y-8">
          {sections.length > 1 && (
            <details
              ref={mobileSectionsNavRef}
              className="group/sections rounded-lg border border-slate-200 bg-white lg:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 group-open/sections:rounded-b-none">
                <span>Innhold på siden</span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sections:rotate-90 group-open/sections:text-[#025169]"
                />
              </summary>
              <div className="border-t border-slate-200 p-2">
                <ul className="m-0 list-none space-y-1 p-0">
                  {sections.map((section) => {
                    const isActive = highlightedSectionId === section.id
                    return (
                      <li key={`mobile-section-${section.id}`}>
                        <button
                          type="button"
                          onClick={() => handleSectionNavigation(section.id, true)}
                          className={`w-full rounded-md border px-3 py-2.5 text-left text-sm leading-5 transition-colors ${
                            isActive
                              ? 'border-[#025169]/25 bg-[#e8f4f8] text-[#025169]'
                              : 'border-transparent bg-transparent text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {section.title}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </details>
          )}

          {enrichedError && !isPdfOnlyContent && !hasIntrinsicFallbackContent && (
            <Alert data-color="warning">
              <Paragraph style={{ marginTop: 0, marginBottom: 0 }}>
                Kunne ikke hente utvidede innholdsdetaljer fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}

          {showStatisticsSection && (
            <ContentStatisticsSection
              statistics={statistics}
              isLoading={isStatisticsLoading}
              error={statisticsError instanceof Error ? statisticsError : null}
            />
          )}

          {sections.map((section, index) => (
            <article key={section.id} id={section.id} className="scroll-mt-20">
              {sections.length > 1 && (
                <Heading level={2} data-size="md" className="font-title" style={{ marginTop: 0, marginBottom: 12 }}>
                  {section.title}
                </Heading>
              )}
              <RichContentHtml
                className="content-html text-base leading-7 text-slate-800"
                html={section.html}
              />
              <VurderingDetails vurdering={section.vurdering} />
              {section.appendedDropdowns && section.appendedDropdowns.length > 0 && (
                <div className="mt-6 space-y-3">
                  {section.appendedDropdowns.map((dropdown) => (
                    <details key={dropdown.id} className="group/dropdown rounded-lg border border-slate-200 bg-white transition-colors open:border-[#025169]/30 open:shadow-sm">
                      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open/dropdown:rounded-b-none">
                        <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/dropdown:rotate-90 group-open/dropdown:text-[#025169]" />
                        <span className="text-[0.9375rem] font-medium text-slate-800 group-open/dropdown:text-[#025169]">
                          {dropdown.title}
                        </span>
                      </summary>
                      <div className="border-t border-slate-200 pr-4 pl-[2.75rem] pb-5 pt-3">
                        <RichContentHtml
                          className="content-html text-base leading-7 text-slate-800"
                          html={dropdown.html}
                        />
                        <VurderingDetails vurdering={dropdown.vurdering} />
                      </div>
                    </details>
                  ))}
                  {index === 0 && <ReferenceDropdown items={referenceItems} />}
                </div>
              )}
              {index === 0 && (!section.appendedDropdowns || section.appendedDropdowns.length === 0) && (
                <div className="mt-6">
                  <ReferenceDropdown items={referenceItems} />
                </div>
              )}
            </article>
          ))}

          {!showSidebarLayout && sections.length > 0 && (visibleDocumentLinks.length > 0 || visibleRelatedLinks.length > 0) && (
            <section className="space-y-4">
              <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 0 }}>
                {resourceSectionTitle}
              </Heading>
              <ul className="m-0 list-none space-y-3 p-0">
                {visibleDocumentLinks.map((document) => (
                  <li key={`inline-document-${document.href}`}>
                    <a
                      href={document.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">{document.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {document.isPdf ? 'PDF' : 'Dokument'}
                      </span>
                    </a>
                  </li>
                ))}
                {visibleRelatedLinks.map((link) => (
                  <li key={`inline-related-${link.href}`}>
                    <a
                      href={link.internalPath || link.href}
                      target={link.internalPath ? undefined : (link.openInNewTab ? '_blank' : undefined)}
                      rel={link.internalPath ? undefined : (link.openInNewTab ? 'noopener noreferrer' : undefined)}
                      onClick={(event) => handleRelatedLinkClick(event, link.internalPath)}
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">{link.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {link.isPdf
                          ? 'PDF'
                          : link.isDocument
                            ? (link.fileType || 'Dokument')
                            : 'Rapport eller side'}
                      </span>
                    </a>
                  </li>
                ))}
                {shouldShowPublicationFallback && publicationUrl && (
                  <li key={`inline-document-page-${publicationUrl}`}>
                    <a
                      href={publicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">Åpne hos Helsedirektoratet</span>
                      <span className="mt-1 block text-xs text-slate-500">Ekstern side</span>
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {sections.length === 0 && referenceItems.length > 0 && <ReferenceDropdown items={referenceItems} />}

          {sections.length === 0 && (visibleDocumentLinks.length > 0 || visibleRelatedLinks.length > 0 || shouldShowPublicationFallback) && (
            <section className="space-y-4">
              <Heading level={2} data-size="sm" className="font-title" style={{ marginTop: 0, marginBottom: 0 }}>
                {resourceSectionTitle}
              </Heading>
              <ul className="m-0 list-none space-y-3 p-0">
                {visibleDocumentLinks.map((document) => (
                  <li key={`fallback-document-${document.href}`}>
                    <a
                      href={document.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">{document.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {document.isPdf ? 'PDF' : 'Dokument'}
                      </span>
                    </a>
                  </li>
                ))}
                {visibleRelatedLinks.map((link) => (
                  <li key={`fallback-related-${link.href}`}>
                    <a
                      href={link.internalPath || link.href}
                      target={link.internalPath ? undefined : (link.openInNewTab ? '_blank' : undefined)}
                      rel={link.internalPath ? undefined : (link.openInNewTab ? 'noopener noreferrer' : undefined)}
                      onClick={(event) => handleRelatedLinkClick(event, link.internalPath)}
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">{link.label}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {link.isPdf
                          ? 'PDF'
                          : link.isDocument
                            ? (link.fileType || 'Dokument')
                            : 'Rapport eller side'}
                      </span>
                    </a>
                  </li>
                ))}
                {shouldShowPublicationFallback && publicationUrl && (
                  <li key={`fallback-document-page-${publicationUrl}`}>
                    <a
                      href={publicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border border-slate-200 px-4 py-3 text-sm no-underline transition-colors hover:border-brand/30 hover:bg-slate-50"
                    >
                      <span className="block font-semibold text-slate-900">Åpne hos Helsedirektoratet</span>
                      <span className="mt-1 block text-xs text-slate-500">Ekstern side</span>
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {sections.length === 0 && referenceItems.length === 0 && !hasAnyActionLinks && !showStatisticsSection && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Paragraph style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}>
                Denne siden har ikke egen tekst eller tilgjengelige lenker.
              </Paragraph>
            </section>
          )}

          {(() => {
            const fagligOppdatert = formatDateLabel(content.last_reviewed_date || enrichedContent?.sistFagligOppdatert)
            if (!fagligOppdatert) return null
            return (
              <section className="mt-8">
                <Paragraph data-size="xs" className="m-0 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Siste faglige endring:</span> {fagligOppdatert}
                </Paragraph>
              </section>
            )
          })()}
        </section>
      </div>
    </div>
  )
}
