import { useEffect, useMemo, useState } from 'react'
import DOMPurify from 'dompurify'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  getDetailContentTypeLabel,
  isRecommendationContentType,
  isTemasideContentType,
  normalizeContentType,
} from '../../../constants/content'
import { useEnrichedContentQuery } from '../../../hooks/queries/useEnrichedContentQuery'
import type { ContentDisplayProps } from '../../../types/pages'
import { ContentPageHeader } from '../ContentPageHeader'
import { DetailAsideLoadingSkeleton } from '../ContentSkeletons'
import { getDocumentLinks, isHelsedirektoratetPdfUrl } from './documentUtils'
import { hasVisibleContent } from '../shared/contentTextUtils'
import {
  buildContentSections,
  buildContextualNavigationLinks,
  buildMetadataItems,
  LINK_LABEL_BY_REL,
  type ContentSection,
} from './detailContentModel'

interface DetailContentDisplayProps extends ContentDisplayProps {
  typeLabelOverride?: string
  primarySectionTitle?: string
}

export function DetailContentDisplay({
  content,
  typeLabelOverride,
  primarySectionTitle = 'Hovedanbefaling',
}: DetailContentDisplayProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const normalizedType = normalizeContentType(content.content_type)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const hasBodyContent = useMemo(() => hasVisibleContent(content.body), [content.body])
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
  const shouldAttemptEnrichment =
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
    const mainBody = hasBodyContent ? content.body : enrichedContent?.tekst || enrichedContent?.body || ''
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
    primarySectionTitle,
  ])

  const highlightedSectionId =
    activeSectionId && sections.some((section) => section.id === activeSectionId)
      ? activeSectionId
      : sections[0]?.id || null

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

  const metadataItems = useMemo(
    () => buildMetadataItems(content, enrichedContent),
    [content, enrichedContent],
  )

  const supportingLinks = useMemo(
    () => content.links?.filter((link) => Boolean(link.href)) || [],
    [content.links],
  )
  const contextualNavigationLinks = useMemo(
    () => buildContextualNavigationLinks(content.id, supportingLinks),
    [content.id, supportingLinks],
  )

  const typeLabel = typeLabelOverride || getDetailContentTypeLabel(normalizedType)
  const documentLinks = useMemo(
    () => getDocumentLinks(enrichedContent, content.links),
    [content.links, enrichedContent],
  )
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
    Boolean(publicationUrl) && !hasMainSections && hasOnlyHelsedirPdfDocuments
  const visibleDocumentLinks = useMemo(() => {
    if (!shouldShowPublicationLink) return documentLinks
    return documentLinks.filter((document) => !isHelsedirektoratetPdfUrl(document.href))
  }, [documentLinks, shouldShowPublicationLink])
  const primaryDocument = visibleDocumentLinks[0]

  return (
    <div className="flex flex-col gap-8">
      <ContentPageHeader typeLabel={typeLabel} title={content.title} />

      <div className="grid gap-8 lg:grid-cols-[minmax(290px,360px)_1fr]">
        <aside className="space-y-6 border-slate-200 lg:border-r lg:pr-6">
          {sections.length > 0 && (
            <nav aria-label="Innholdsnavigasjon">
              <ul className="m-0 list-none border-t border-slate-200 p-0">
                {sections.map((section) => {
                  const isActive = highlightedSectionId === section.id
                  return (
                    <li key={section.id} className="border-b border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          const target = document.getElementById(section.id)
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                          setActiveSectionId(section.id)
                        }}
                        className={`recommendation-nav__button w-full px-0 py-3 text-left text-[1rem] leading-7 ${
                          isActive
                            ? 'recommendation-nav__button--active font-semibold text-blue-800'
                            : 'text-slate-600'
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
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Heading level={3} data-size="2xs" style={{ marginBottom: 8 }}>
                Gå til publikasjon
              </Heading>
              <ul className="m-0 list-none space-y-1 p-0">
                {contextualNavigationLinks.map((link) => {
                  const label =
                    link.tittel ||
                    LINK_LABEL_BY_REL[link.rel] ||
                    `${link.rel.charAt(0).toUpperCase()}${link.rel.slice(1)}`
                  return (
                    <li key={`contextual-${link.rel}-${link.href}`}>
                      <button
                        type="button"
                        onClick={() => {
                          const normalizedContentType = link.type?.trim()
                          navigate(`/content/${link.contentId}`, {
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
                        className="recommendation-nav__button w-full py-1 text-left text-sm text-slate-700"
                      >
                        {label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {metadataItems.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Heading level={3} data-size="2xs" style={{ marginBottom: 8 }}>
                Nøkkelinformasjon
              </Heading>
              <ul className="m-0 list-none space-y-2 p-0">
                {metadataItems.map((item) => (
                  <li key={item.label}>
                    <Paragraph
                      data-size="sm"
                      style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}
                    >
                      <span className="font-semibold">{item.label}:</span> {item.value}
                    </Paragraph>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {sections.length > 0 && (visibleDocumentLinks.length > 0 || shouldShowPublicationLink) && (
            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Heading level={3} data-size="2xs" style={{ marginBottom: 8 }}>
                Dokument
              </Heading>
              <ul className="m-0 list-none space-y-2 p-0">
                {visibleDocumentLinks.map((document) => (
                  <li key={`document-${document.href}`}>
                    <a
                      href={document.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
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
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Åpne side hos Helsedirektoratet
                    </a>
                  </li>
                )}
              </ul>
            </section>
          )}
        </aside>

        <section className="min-w-0 space-y-8">
          {enrichedError && (
            <Alert data-color="warning">
              <Paragraph style={{ marginTop: 0, marginBottom: 0 }}>
                Kunne ikke hente utvidede innholdsdetaljer fra Helsedirektoratet API akkurat nå.
              </Paragraph>
            </Alert>
          )}

          {sections.map((section) => (
            <article key={section.id} id={section.id} className="scroll-mt-20">
              <Heading level={2} data-size="md" style={{ marginTop: 0, marginBottom: 12 }}>
                {section.title}
              </Heading>
              <div
                className="content-html text-base leading-7 text-slate-800"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.html) }}
              />
            </article>
          ))}

          {sections.length === 0 && (primaryDocument || shouldShowPublicationLink) && (
            <section className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Paragraph style={{ marginTop: 0, marginBottom: 0, color: '#334155' }}>
                Denne siden har ikke egen tekst. Dokumentet åpnes i ny fane.
              </Paragraph>
              <ul className="m-0 list-none space-y-2 p-0">
                {primaryDocument && (
                  <li>
                    <a
                      href={primaryDocument.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      {primaryDocument.label}
                    </a>
                  </li>
                )}
                {shouldShowPublicationLink && publicationUrl && (
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

          {sections.length === 0 && !primaryDocument && !shouldShowPublicationLink && (
            <Paragraph style={{ marginTop: 0, color: '#64748b' }}>
              Ingen innholdsseksjoner tilgjengelig for denne siden.
            </Paragraph>
          )}
        </section>
      </div>
    </div>
  )
}


