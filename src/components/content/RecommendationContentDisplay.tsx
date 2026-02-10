import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DOMPurify from 'dompurify'
import { Alert, Heading, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { useNavigate } from 'react-router-dom'
import {
  fetchHelsedirContentByTypeAndId,
  getHelsedirEndpointByContentType,
} from '../../api'
import type { NestedContent } from '../../types'
import type { ContentDisplayProps } from '../../types/pages'

interface ContentSection {
  id: string
  title: string
  html: string
}

const TYPE_LABEL_BY_CONTENT_TYPE: Record<string, string> = {
  anbefaling: 'Anbefaling',
  rad: 'Råd',
  'pakkeforlop-anbefaling': 'Pakkeforløp-anbefaling',
}

const LINK_LABEL_BY_REL: Record<string, string> = {
  root: 'Rotpublikasjon',
}

function hasVisibleContent(value?: string) {
  if (!value) return false
  const plainText = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
  return plainText.length > 0
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

export function RecommendationContentDisplay({ content }: ContentDisplayProps) {
  const navigate = useNavigate()
  const normalizedType = content.content_type.trim().toLowerCase()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  const hasEndpoint = Boolean(getHelsedirEndpointByContentType(normalizedType))

  const {
    data: enrichedContent,
    isLoading: isEnrichedLoading,
    error: enrichedError,
  } = useQuery<NestedContent>({
    queryKey: ['recommendation-content', normalizedType, content.id],
    queryFn: async ({ signal }) =>
      fetchHelsedirContentByTypeAndId(normalizedType, content.id, signal) as Promise<NestedContent>,
    enabled: hasEndpoint,
    staleTime: 10 * 60 * 1000,
  })

  const sections = useMemo<ContentSection[]>(() => {
    const mainBody = hasVisibleContent(content.body)
      ? content.body
      : enrichedContent?.tekst || enrichedContent?.body || ''
    const practical = enrichedContent?.data?.praktisk || ''
    const rationale = enrichedContent?.data?.rasjonale || ''
    const tradeoffs = enrichedContent?.data?.nokkelInfo?.fordelerogulemper || ''
    const preferences = enrichedContent?.data?.nokkelInfo?.verdierogpreferanser || ''

    const result: ContentSection[] = []

    if (hasVisibleContent(mainBody)) {
      result.push({
        id: 'section-hovedanbefaling',
        title: 'Hovedanbefaling',
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
  }, [content.body, enrichedContent])

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
    if (!enrichedContent) return []

    const items: Array<{ label: string; value: string }> = []

    if (enrichedContent.data?.styrke) {
      items.push({ label: 'Anbefalingsstyrke', value: enrichedContent.data.styrke })
    }
    if (enrichedContent.status) {
      items.push({ label: 'Status', value: enrichedContent.status })
    }

    const firstPublished = formatDateLabel(enrichedContent.forstPublisert)
    if (firstPublished) {
      items.push({ label: 'Først publisert', value: firstPublished })
    }

    const updated = formatDateLabel(enrichedContent.sistOppdatert)
    if (updated) {
      items.push({ label: 'Sist oppdatert', value: updated })
    }

    const professionallyUpdated = formatDateLabel(enrichedContent.sistFagligOppdatert)
    if (professionallyUpdated) {
      items.push({ label: 'Sist faglig oppdatert', value: professionallyUpdated })
    }

    return items
  }, [enrichedContent])

  const supportingLinks = useMemo(
    () => content.links?.filter((link) => Boolean(link.href)) || [],
    [content.links],
  )
  const contextualNavigationLinks = useMemo(
    () =>
      supportingLinks
        .filter((link) => link.rel === 'root')
        .map((link) => ({
          ...link,
          contentId: getContentIdFromHref(link.href),
        }))
        .filter((link) => Boolean(link.contentId)),
    [supportingLinks],
  )

  const typeLabel = getTypeLabel(normalizedType)

  return (
    <div className="flex flex-col gap-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-sky-700">
            {typeLabel}
          </span>
        </div>
        <Heading level={1} data-size="xl" style={{ marginBottom: 0 }}>
          {content.title}
        </Heading>
      </header>

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
            <div className="flex justify-center py-2">
              <Spinner aria-label="Laster anbefalingsdetaljer..." />
            </div>
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
        </aside>

        <section className="min-w-0 space-y-8">
          {enrichedError && (
            <Alert data-color="warning">
              <Paragraph style={{ marginTop: 0, marginBottom: 0 }}>
                Kunne ikke hente utvidede anbefalingsdetaljer fra Helsedirektoratet API akkurat nå.
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

          {sections.length === 0 && (
            <Paragraph style={{ marginTop: 0, color: '#64748b' }}>
              Ingen innholdsseksjoner tilgjengelig for denne siden.
            </Paragraph>
          )}
        </section>
      </div>
    </div>
  )
}
