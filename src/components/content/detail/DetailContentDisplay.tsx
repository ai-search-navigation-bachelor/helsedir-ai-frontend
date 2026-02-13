import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { Alert, Heading, Paragraph } from '@digdir/designsystemet-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchHelsedirContentById,
  fetchHelsedirContentByTypeAndId,
  getHelsedirEndpointByContentType,
} from '../../../api'
import type { NestedContent } from '../../../types'
import type { ContentDisplayProps } from '../../../types/pages'
import { ContentPageHeader } from '../ContentPageHeader'
import { DetailAsideLoadingSkeleton } from '../ContentSkeletons'
import { getDocumentLinks, isHelsedirektoratetPdfUrl } from './documentUtils'
import { hasVisibleContent } from '../shared/contentTextUtils'

interface ContentSection {
  id: string
  title: string
  html: string
}

const RECOMMENDATION_TYPES = new Set(['anbefaling', 'rad', 'pakkeforlop-anbefaling'])
const TEMASIDE_TYPES = new Set(['temaside', 'tema-side'])

const TYPE_LABEL_BY_CONTENT_TYPE: Record<string, string> = {
  anbefaling: 'Anbefaling',
  rad: 'Råd',
  'pakkeforlop-anbefaling': 'Pakkeforløp-anbefaling',
}

const LINK_LABEL_BY_REL: Record<string, string> = {
  root: 'Rotpublikasjon',
}

function formatDateLabel(value?: string) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('nb-NO')
}

function getTypeLabel(contentType: string) {
  return TYPE_LABEL_BY_CONTENT_TYPE[contentType] || 'Innhold'
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === 'AbortError'
}

function getStatusCodeFromError(error: unknown) {
  if (!(error instanceof Error)) return null

  const match = error.message.match(/\b(\d{3})\b/)
  if (!match) return null

  const statusCode = Number(match[1])
  return Number.isNaN(statusCode) ? null : statusCode
}

function shouldFallbackToTypedEndpoint(error: unknown) {
  if (isAbortError(error)) return false
  const statusCode = getStatusCodeFromError(error)
  return statusCode === 400 || statusCode === 404 || statusCode === 405
}

function getContentIdFromHref(href?: string) {
  if (!href) return null

  try {
    const parsed = new URL(href)
    const segments = parsed.pathname.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  } catch {
    const normalized = href.split('?')[0].replace(/\/+$/, '')
    const segments = normalized.split('/').filter(Boolean)
    return segments[segments.length - 1] || null
  }
}

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
  const normalizedType = content.content_type.trim().toLowerCase()
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
  const shouldSkipHelsedirEnrichment = TEMASIDE_TYPES.has(normalizedType)
  const shouldAttemptEnrichment =
    !shouldSkipHelsedirEnrichment &&
    (RECOMMENDATION_TYPES.has(normalizedType)
      ? !hasSufficientBackendRecommendationData
      : !hasBodyContent)

  const {
    data: enrichedContent,
    isLoading: isEnrichedLoading,
    error: enrichedError,
  } = useQuery<NestedContent>({
    queryKey: ['enriched-content', normalizedType, content.id],
    queryFn: async ({ signal }) => {
      try {
        return await fetchHelsedirContentById(content.id, signal) as NestedContent
      } catch (error) {
        const typedEndpoint = getHelsedirEndpointByContentType(normalizedType)
        if (!typedEndpoint || !shouldFallbackToTypedEndpoint(error)) {
          throw error
        }
        return await fetchHelsedirContentByTypeAndId(
          normalizedType,
          content.id,
          signal,
        ) as NestedContent
      }
    },
    enabled: Boolean(content.id) && shouldAttemptEnrichment,
    staleTime: 10 * 60 * 1000,
  })

  const sections = useMemo<ContentSection[]>(() => {
    const mainBody = hasBodyContent ? content.body : enrichedContent?.tekst || enrichedContent?.body || ''
    const practical = backendPractical || enrichedContent?.data?.praktisk || ''
    const rationale = backendRationale || enrichedContent?.data?.rasjonale || ''
    const tradeoffs = backendTradeoffs || enrichedContent?.data?.nokkelInfo?.fordelerogulemper || ''
    const preferences = backendPreferences || enrichedContent?.data?.nokkelInfo?.verdierogpreferanser || ''

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

  const metadataItems = useMemo(() => {
    const items: Array<{ label: string; value: string }> = []
    const strength = content.anbefaling_fields?.styrke || enrichedContent?.data?.styrke
    const status = content.status || enrichedContent?.status
    const firstPublished = formatDateLabel(content.forstPublisert || enrichedContent?.forstPublisert)
    const updated = formatDateLabel(content.sistOppdatert || enrichedContent?.sistOppdatert)
    const professionallyUpdated = formatDateLabel(
      content.sistFagligOppdatert || enrichedContent?.sistFagligOppdatert,
    )

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
  }, [
    content.anbefaling_fields?.styrke,
    content.forstPublisert,
    content.sistFagligOppdatert,
    content.sistOppdatert,
    content.status,
    enrichedContent,
  ])

  const supportingLinks = useMemo(
    () => content.links?.filter((link) => Boolean(link.href)) || [],
    [content.links],
  )
  const contextualNavigationLinks = useMemo(
    () => {
      const seenContentIds = new Set<string>()

      return supportingLinks
        .filter((link) => link.rel === 'root')
        .map((link) => ({
          ...link,
          contentId: getContentIdFromHref(link.href),
        }))
        .filter((link) => Boolean(link.contentId) && link.contentId !== content.id)
        .filter((link) => {
          if (!link.contentId || seenContentIds.has(link.contentId)) return false
          seenContentIds.add(link.contentId)
          return true
        })
    },
    [content.id, supportingLinks],
  )

  const typeLabel = typeLabelOverride || getTypeLabel(normalizedType)
  const documentLinks = useMemo(
    () => getDocumentLinks(enrichedContent, content.links),
    [content.links, enrichedContent],
  )
  const publicationUrl = useMemo(() => {
    const url = enrichedContent?.url?.trim() || content.url?.trim()
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
                        onClick={() => navigate(`/content/${link.contentId}`)}
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

