import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import DOMPurify from 'dompurify'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { buildContentUrl } from '../../../lib/contentUrl'
import {
  getDetailContentTypeLabel,
  isRecommendationContentType,
  isTemasideContentType,
  normalizeContentType,
} from '../../../constants/content'
import { formatDateLabel } from '../../../lib/content/date'
import { useEnrichedContentQuery } from '../../../hooks/queries/useEnrichedContentQuery'
import type { ContentDisplayProps } from '../../../types/pages'
import { ContentPageHeader } from '../ContentPageHeader'
import { DetailAsideLoadingSkeleton } from '../ContentSkeletons'
import { asDocumentLink, getDocumentLinks, getRelatedLinks, isHelsedirektoratetPdfUrl } from './documentUtils'
import { ExpandableSubcontent } from '../hierarchical/ExpandableSubcontent'
import { hasVisibleContent } from '../shared/contentTextUtils'
import { getContentIdFromHref, getUniqueChildLinks } from '../shared/linkUtils'
import {
  buildContentSections,
  buildContextualNavigationLinks,
  LINK_LABEL_BY_REL,
  type ContentSection,
  type VurderingSection,
} from './detailContentModel'

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
            <div
              className="content-html text-base leading-7 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(vurdering.tradeoffs) }}
            />
          </div>
        )}
        {showPreferences && (
          <div>
            <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 8 }}>
              Verdier og preferanser
            </Heading>
            <div
              className="content-html text-base leading-7 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(vurdering.preferences) }}
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

function ReferenceDropdown({
  items,
  className = '',
}: {
  items: Array<{ id: string; tittel?: string }>
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
              className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
            >
              {item.tittel || 'Uten tittel'}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

export function DetailContentDisplay({
  content,
  typeLabelOverride,
  primarySectionTitle = 'Hovedanbefaling',
}: DetailContentDisplayProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const mobileSectionsNavRef = useRef<HTMLDetailsElement>(null)
  const normalizedType = normalizeContentType(content.content_type)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const backendDocumentUrl = content.document_url?.trim() || ''
  const isPdfOnlyContent = Boolean(content.is_pdf_only)
  const hasBodyContent = useMemo(
    () => !isPdfOnlyContent && hasVisibleContent(content.body),
    [content.body, isPdfOnlyContent],
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
  const shouldSkipHelsedirEnrichment = isTemasideContentType(normalizedType)
  const shouldSkipPdfOnlyEnrichment = isPdfOnlyContent && Boolean(backendDocumentUrl)
  const shouldAttemptEnrichment =
    !shouldSkipPdfOnlyEnrichment &&
    !shouldSkipHelsedirEnrichment &&
    (isRecommendationContentType(normalizedType)
      ? !hasSufficientBackendRecommendationData
      : !hasBodyContent)

  const {
    data: enrichedContent,
    isLoading: isEnrichedLoading,
    error: enrichedError,
  } = useEnrichedContentQuery({
    contentId: content.id,
    contentType: normalizedType,
    enabled: shouldAttemptEnrichment,
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

    return buildContentSections({
      mainBody,
      practical,
      rationale,
      tradeoffs,
      preferences,
      primarySectionTitle,
    })
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

  const supportingLinks = useMemo(
    () => content.links?.filter((link) => Boolean(link.href)) || [],
    [content.links],
  )
  const contextualNavigationLinks = useMemo(
    () => buildContextualNavigationLinks(content.id, supportingLinks),
    [content.id, supportingLinks],
  )
  const childContentItems = useMemo(
    () =>
      getUniqueChildLinks(content.links).map((link) => ({
        id: link.id || getContentIdFromHref(link.href) || link.href || '',
        path: link.path || undefined,
        tittel: link.title || '',
        type: link.type,
        children: link.children
          ?.filter((child) => Boolean(child.id || child.href))
          .map((child) => ({
            id: child.id || getContentIdFromHref(child.href) || child.href || '',
            path: child.path || undefined,
            tittel: child.title || '',
            type: child.type,
          })),
      })),
    [content.links],
  )
  const referenceItems = useMemo(
    () => childContentItems.filter((item) => isReferenceContentType(item.type)),
    [childContentItems],
  )
  const relatedChildItems = useMemo(
    () => childContentItems.filter((item) => !isReferenceContentType(item.type)),
    [childContentItems],
  )

  const typeLabel = typeLabelOverride || getDetailContentTypeLabel(normalizedType)
  const documentLinks = useMemo(
    () => {
      const links = getDocumentLinks(enrichedContent, content.links)
      if (!backendDocumentUrl) return links
      if (links.some((document) => document.href === backendDocumentUrl)) return links

      const backendDocumentLink = asDocumentLink(backendDocumentUrl, undefined, 'fil')
      if (!backendDocumentLink) return links

      return [backendDocumentLink, ...links]
    },
    [backendDocumentUrl, content.links, enrichedContent],
  )
  const relatedLinks = useMemo(() => getRelatedLinks(content), [content])
  const publicationUrl = useMemo(() => {
    const url = content.url?.trim() || enrichedContent?.url?.trim()
    if (!url) return null
    return documentLinks.some((document) => document.href === url) ? null : url
  }, [content.url, documentLinks, enrichedContent?.url])
  const hasMainSections = sections.length > 0
  const hasOnlyHelsedirPdfDocuments =
    documentLinks.length > 0 &&
    documentLinks.every((document) => isHelsedirektoratetPdfUrl(document.href))
  const shouldShowPublicationLink =
    Boolean(publicationUrl) &&
    !hasMainSections &&
    (hasOnlyHelsedirPdfDocuments || documentLinks.length === 0)
  const visibleDocumentLinks = useMemo(() => {
    if (!shouldShowPublicationLink) return documentLinks
    return documentLinks.filter((document) => !isHelsedirektoratetPdfUrl(document.href))
  }, [documentLinks, shouldShowPublicationLink])
  const publicationFallbackDocument =
    shouldShowPublicationLink && publicationUrl && visibleDocumentLinks.length === 0
      ? { href: publicationUrl, label: 'Åpne side hos Helsedirektoratet', isPdf: false }
      : null
  const primaryDocument = visibleDocumentLinks[0] || publicationFallbackDocument
  const isPrimaryPdfAction = Boolean(isPdfOnlyContent && primaryDocument?.isPdf)
  const primaryDocumentLabel =
    isPrimaryPdfAction ? 'Åpne PDF i ny fane' : primaryDocument?.label
  const emptyStateMessage = isPrimaryPdfAction
    ? 'Denne siden har ikke egen tekst. PDF-en åpnes i ny fane.'
    : 'Denne siden har ikke egen tekst. Se innholdet hos Helsedirektoratet.'
  const hasRelatedLinks = relatedLinks.length > 0
  const fallbackLinks = !hasRelatedLinks && !isPrimaryPdfAction && primaryDocument
    ? [{
        href: primaryDocument.href,
        label: primaryDocumentLabel || primaryDocument.label,
        isPdf: Boolean(primaryDocument.isPdf),
        isDocument: true,
        fileType: primaryDocument.isPdf ? 'PDF' : undefined,
        openInNewTab: true,
      }]
    : []

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

  const hasSidebarContent =
    sections.length > 1 ||
    contextualNavigationLinks.length > 0
  // Reserve sidebar space while enrichment is loading to prevent grid layout shift
  const showSidebarLayout = hasSidebarContent || isEnrichedLoading

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

          {isEnrichedLoading && (
            <DetailAsideLoadingSkeleton />
          )}

          {contextualNavigationLinks.length > 0 && (
            <section className="border-t border-slate-100 pl-7 pt-4">
              <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Gå til publikasjon
              </p>
              <ul className="m-0 list-none space-y-1.5 p-0">
                {contextualNavigationLinks.map((link) => {
                  const label =
                    link.title ||
                    LINK_LABEL_BY_REL[link.rel] ||
                    `${link.rel.charAt(0).toUpperCase()}${link.rel.slice(1)}`
                  return (
                    <li key={`contextual-${link.rel}-${link.href}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const normalizedContentType = link.type?.trim()
                          navigate(buildContentUrl({ id: link.contentId, path: link.path ?? undefined }), {
                            state: {
                              ...(location.state as Record<string, unknown> | null),
                              sourceContentId: content.id,
                              sourceContentTitle: content.title,
                              ...(normalizedContentType
                                ? { contentType: normalizedContentType }
                                : {}),
                            },
                          })
                        }}
                        className="w-full py-0.5 px-0 text-left text-xs text-slate-500 border-0 bg-transparent cursor-pointer transition-colors hover:text-[#025169] hover:underline"
                      >
                        {label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {sections.length > 0 && (visibleDocumentLinks.length > 0 || shouldShowPublicationLink) && (
            <section className="border-t border-slate-100 pl-7 pt-4">
              <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Dokument
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
                {shouldShowPublicationLink && publicationUrl && (
                  <li key={`document-page-${publicationUrl}`}>
                    <a
                      href={publicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-500 hover:text-[#025169] hover:underline"
                    >
                      Åpne side hos Helsedirektoratet
                    </a>
                  </li>
                )}
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

          {enrichedError && !isPdfOnlyContent && (
            <Alert data-color="warning">
              <Paragraph style={{ marginTop: 0, marginBottom: 0 }}>
                Kunne ikke hente utvidede innholdsdetaljer fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}

          {sections.map((section, index) => (
            <article key={section.id} id={section.id} className="scroll-mt-20">
              {sections.length > 1 && (
                <Heading level={2} data-size="md" className="font-title" style={{ marginTop: 0, marginBottom: 12 }}>
                  {section.title}
                </Heading>
              )}
              <div
                className="content-html text-base leading-7 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.html) }}
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
                        <div
                          className="content-html text-base leading-7 text-slate-800"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(dropdown.html) }}
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

          {relatedChildItems.length > 0 && (
            <section className="space-y-3">
              <Heading level={2} data-size="md" className="font-title" style={{ marginTop: 0, marginBottom: 12 }}>
                Relatert innhold
              </Heading>
              {relatedChildItems.map((item, index) => (
                <ExpandableSubcontent
                  key={`detail-child-${item.id || index}`}
                  item={item}
                  itemKey={`detail-child-${item.id || index}`}
                />
              ))}
            </section>
          )}

          {sections.length === 0 && referenceItems.length > 0 && <ReferenceDropdown items={referenceItems} />}

          {sections.length === 0 && hasRelatedLinks && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Paragraph style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}>
                Denne siden har ikke egen tekst. Se relaterte rapporter og dokumenter fra Helsedirektoratet.
              </Paragraph>
              <ul className="m-0 list-none space-y-3 p-0">
                {relatedLinks.map((link) => (
                  <li key={link.href}>
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
              </ul>
            </section>
          )}

          {sections.length === 0 && fallbackLinks.length > 0 && (
            <section className="space-y-4">
              <Paragraph style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}>
                {emptyStateMessage}
              </Paragraph>
              <ul className="m-0 list-none space-y-3 p-0">
                {fallbackLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.openInNewTab ? '_blank' : undefined}
                      rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
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
              </ul>
            </section>
          )}

          {sections.length === 0 && isPrimaryPdfAction && primaryDocument && (
            <section className="space-y-4">
              <Paragraph style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}>
                {emptyStateMessage}
              </Paragraph>
              <ul className="m-0 list-none space-y-2 p-0">
                {primaryDocument && (
                  <li>
                    <a
                      href={primaryDocument.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white no-underline transition-colors hover:bg-brand/90"
                    >
                      {primaryDocumentLabel}
                    </a>
                  </li>
                )}
                {shouldShowPublicationLink && publicationUrl && visibleDocumentLinks.length > 0 && (
                  <li>
                    <a
                      href={publicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Åpne side hos Helsedirektoratet
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}

          {sections.length === 0 && childContentItems.length === 0 && !primaryDocument && !shouldShowPublicationLink && (
            <Paragraph style={{ marginTop: 0, color: '#64748b' }}>
              Ingen innholdsseksjoner tilgjengelig for denne siden.
            </Paragraph>
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
