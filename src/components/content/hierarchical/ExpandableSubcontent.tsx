import { useEffect, useState } from 'react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { NestedContent } from '../../../types'
import { buildContentUrl } from '../../../lib/contentUrl'
import { fetchChapter } from '../../../lib/content/chapterFetch'
import { dedupeNestedContents } from '../../../lib/content/nestedContentDedup'
import { RichContentHtml } from '../shared/RichContentHtml'
import { formatDateLabel, getNodeTitle, getNodeType } from './treeUtils'
import { HighlightText } from './FilterHighlight'

const MAX_SUBCONTENT_DEPTH = 8

function isHttpIdentifier(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value))
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function textContainsQuery(text: string, query: string) {
  return stripHtml(text).toLowerCase().includes(query.toLowerCase())
}

function highlightHtml(html: string, query: string): string {
  if (!query) return html
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return html.replace(/(>)([^<]*)/g, (_, gt, text) =>
    gt + text.replace(regex, '<mark class="rounded-sm bg-amber-100 px-0.5">$1</mark>'),
  )
}

interface ExpandableSubcontentProps {
  item: NestedContent
  itemKey: string
  depth?: number
  defaultOpen?: boolean
  filterQuery?: string
}

function isReferenceNode(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

function isPicoNode(node: NestedContent) {
  return getNodeType(node).includes('pico')
}

function ReferenceDropdown({ items }: { items: NestedContent[] }) {
  if (items.length === 0) return null

  return (
    <details className="group/sub border-t border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-hover/sub:text-brand" />
        Referanser
      </summary>
      <div className="pb-4 pl-6">
        <ul className="m-0 list-none space-y-2 p-0">
          {items.map((child, index) => (
            <li
              key={`reference-${child.id || index}`}
              className="rounded-md px-3 py-2 text-[0.9375rem] leading-6 text-slate-700"
            >
              {getNodeTitle(child)}
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

interface SubSectionProps {
  label: string
  html: string
  forceOpen?: boolean
  filterQuery?: string
}

function SubSection({ label, html, forceOpen, filterQuery }: SubSectionProps) {
  const [isOpen, setIsOpen] = useState(forceOpen ?? false)

  useEffect(() => {
    if (forceOpen) setIsOpen(true)
    if (!filterQuery) setIsOpen(false)
  }, [forceOpen, filterQuery])

  return (
    <details
      className="group/sub border-t border-slate-200"
      open={isOpen || undefined}
      onToggle={(e) => { if (e.target === e.currentTarget) setIsOpen(e.currentTarget.open) }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-hover/sub:text-brand" />
        {label}
      </summary>
      <RichContentHtml
        className="content-html pb-4 pl-6 text-[0.9375rem] font-medium leading-7 text-slate-700"
        html={filterQuery ? highlightHtml(html, filterQuery) : html}
      />
    </details>
  )
}

interface BegrunnelseSubSectionProps {
  html: string
  tradeoffs: string
  preferences: string
  forceOpen?: boolean
  filterQuery?: string
}

function BegrunnelseSubSection({ html, tradeoffs, preferences, forceOpen, filterQuery }: BegrunnelseSubSectionProps) {
  const hasVurdering = Boolean(tradeoffs || preferences)
  const vurderingMatches = Boolean(filterQuery && (
    (tradeoffs && textContainsQuery(tradeoffs, filterQuery)) ||
    (preferences && textContainsQuery(preferences, filterQuery))
  ))
  const [isOpen, setIsOpen] = useState(forceOpen ?? false)
  const [isVurderingOpen, setIsVurderingOpen] = useState(vurderingMatches)

  useEffect(() => {
    if (forceOpen) setIsOpen(true)
    if (!filterQuery) setIsOpen(false)
  }, [forceOpen, filterQuery])

  useEffect(() => {
    if (vurderingMatches) setIsVurderingOpen(true)
    if (!filterQuery) setIsVurderingOpen(false)
  }, [vurderingMatches, filterQuery])

  return (
    <details
      className="group/sub border-t border-slate-200"
      open={isOpen || undefined}
      onToggle={(e) => { if (e.target === e.currentTarget) setIsOpen(e.currentTarget.open) }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-hover/sub:text-brand" />
        Begrunnelse
      </summary>
      <div className="pb-2 pl-6">
        {html && (
          <RichContentHtml
            className="content-html pb-4 text-[0.9375rem] font-medium leading-7 text-slate-700"
            html={filterQuery ? highlightHtml(html, filterQuery) : html}
          />
        )}
        {hasVurdering && (
          <details
            className="group/vurdering border-t border-slate-200"
            open={isVurderingOpen || undefined}
            onToggle={(e) => { if (e.target === e.currentTarget) setIsVurderingOpen((e.currentTarget as HTMLDetailsElement).open) }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/vurdering:rotate-90 group-hover/vurdering:text-brand" />
              Vurdering
            </summary>
            <div className="space-y-4 pb-4 pl-6">
              {tradeoffs && (
                <div>
                  <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 6 }}>
                    Fordeler og ulemper
                  </Heading>
                  <RichContentHtml
                    className="content-html text-[0.9375rem] font-medium leading-7 text-slate-700"
                    html={filterQuery ? highlightHtml(tradeoffs, filterQuery) : tradeoffs}
                  />
                </div>
              )}
              {preferences && (
                <div>
                  <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 6 }}>
                    Verdier og preferanser
                  </Heading>
                  <RichContentHtml
                    className="content-html text-[0.9375rem] font-medium leading-7 text-slate-700"
                    html={filterQuery ? highlightHtml(preferences, filterQuery) : preferences}
                  />
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </details>
  )
}

export function ExpandableSubcontent({
  item,
  itemKey,
  depth = 0,
  defaultOpen = false,
  filterQuery = '',
}: ExpandableSubcontentProps) {
  const matchesFilter = Boolean(filterQuery) && (
    getNodeTitle(item).toLowerCase().includes(filterQuery.toLowerCase()) ||
    [item.intro, item.tekst, item.body, item.data?.praktisk, item.data?.rasjonale,
     item.data?.nokkelInfo?.fordelerogulemper, item.data?.nokkelInfo?.verdierogpreferanser]
      .some((t) => t && textContainsQuery(t, filterQuery))
  )
  const [isOpen, setIsOpen] = useState(defaultOpen || matchesFilter)

  useEffect(() => {
    if (matchesFilter) setIsOpen(true)
    if (!filterQuery) setIsOpen(defaultOpen)
  }, [filterQuery, matchesFilter, defaultOpen])
  const navigate = useNavigate()
  const location = useLocation()
  const { id: currentContentId } = useParams<{ id: string }>()

  const isStub = Boolean(item.id) && !item.body && !item.tekst && !item.intro && !item.data

  const { data: fetchedContent, isFetching } = useQuery({
    queryKey: ['expandable-content', item.id],
    queryFn: async ({ signal }) => {
      if (!item.id) return null
      return fetchChapter(item.id, signal, item.sistFagligOppdatert)
    },
    enabled: isOpen && isStub,
    staleTime: 5 * 60 * 1000,
  })

  const resolved = fetchedContent ?? item
  const title = getNodeTitle(item)
  const intro = resolved.intro || ''
  const body = resolved.tekst || resolved.body || ''

  const strength = resolved.data?.styrke || ''
  const status = resolved.status || ''
  const fagligOppdatert = formatDateLabel(resolved.sistFagligOppdatert)
  const shortIntro = resolved.kortIntro || ''
  const practical = resolved.data?.praktisk || ''
  const rationale = resolved.data?.rasjonale || ''
  const tradeoffs = resolved.data?.nokkelInfo?.fordelerogulemper || ''
  const preferences = resolved.data?.nokkelInfo?.verdierogpreferanser || ''
  const hasStandalonePage =
    (Boolean(item.path) || (Boolean(item.id) && !isHttpIdentifier(item.id))) &&
    !isReferenceNode(item) &&
    !isPicoNode(item)
  const children = dedupeNestedContents(resolved.children)
  const referenceChildren = children.filter((child) => isReferenceNode(child))
  const nestedChildren = children.filter((child) => !isReferenceNode(child) && !isPicoNode(child))

  return (
    <details
      key={itemKey}
      className="expandable-subcontent group rounded-lg border border-slate-200 bg-white transition-colors open:border-brand/30 open:shadow-sm"
      style={{ marginLeft: `${depth * 14}px` }}
      open={isOpen || undefined}
      data-expandable-id={item.id || undefined}
      onToggle={(e) => {
        if (e.target !== e.currentTarget) return
        setIsOpen(e.currentTarget.open)
      }}
    >
      <summary className="cursor-pointer list-none rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open:rounded-b-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90 group-open:text-brand" />
            <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900 group-open:text-brand">
              <HighlightText text={title} query={filterQuery} />
            </span>
          </div>

          {hasStandalonePage && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!item.id) return
                const normalizedContentType = item.type?.trim()
                navigate(buildContentUrl({ id: item.id, path: item.path }), {
                  state: {
                    ...(location.state as Record<string, unknown> | null),
                    sourceContentId: currentContentId,
                    ...(normalizedContentType ? { contentType: normalizedContentType } : {}),
                  },
                })
              }}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap hover:border-brand hover:text-brand"
            >
              Åpne side
            </button>
          )}
        </div>
      </summary>

      <div className="border-t border-slate-200 px-4 pb-5 pt-3" style={{ paddingLeft: '2.75rem' }}>
        {isFetching && !body && !intro && (
          <p className="m-0 py-2 text-sm italic text-slate-400">Laster innhold...</p>
        )}
        {strength && (
          <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-widest text-brand">
            {strength}
          </p>
        )}
        {status && (
          <p className="mb-3 mt-0 text-xs text-slate-400">
            {status}
          </p>
        )}

        {shortIntro && (
          <Paragraph style={{ marginTop: 0, marginBottom: 8, color: '#334155' }}>
            {shortIntro}
          </Paragraph>
        )}

        {intro && (
          <Paragraph style={{ marginTop: 0, marginBottom: 8, color: '#475569' }}>
            {intro}
          </Paragraph>
        )}

        {body && (
          <RichContentHtml
            className="content-html text-[0.9375rem] font-medium leading-7 text-slate-700"
            html={filterQuery ? highlightHtml(body, filterQuery) : body}
          />
        )}

        {practical && (
          <SubSection
            label="Praktisk informasjon"
            html={practical}
            forceOpen={Boolean(filterQuery && textContainsQuery(practical, filterQuery))}
            filterQuery={filterQuery}
          />
        )}
        {(rationale || tradeoffs || preferences) && (
          <BegrunnelseSubSection
            html={rationale}
            tradeoffs={tradeoffs}
            preferences={preferences}
            forceOpen={Boolean(filterQuery && (
              (rationale && textContainsQuery(rationale, filterQuery)) ||
              (tradeoffs && textContainsQuery(tradeoffs, filterQuery)) ||
              (preferences && textContainsQuery(preferences, filterQuery))
            ))}
            filterQuery={filterQuery}
          />
        )}
        <ReferenceDropdown items={referenceChildren} />

        {depth < MAX_SUBCONTENT_DEPTH && nestedChildren.length > 0 && (
          <div className="mt-3 space-y-3">
            {nestedChildren.map((child, index) => (
              <ExpandableSubcontent
                key={`${itemKey}-child-${child.id || index}`}
                item={child}
                itemKey={`${itemKey}-child-${child.id || index}`}
                depth={depth + 1}
                filterQuery={filterQuery}
              />
            ))}
          </div>
        )}

        {fagligOppdatert && (
          <p className="mt-4 mb-0 text-xs text-slate-400">
            Siste faglige endring: {fagligOppdatert}
          </p>
        )}
      </div>
    </details>
  )
}
