import { useState } from 'react'
import DOMPurify from 'dompurify'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { useQuery } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { NestedContent } from '../../../types'
import { buildContentUrl } from '../../../lib/contentUrl'
import { fetchChapter } from '../../../lib/content/chapterFetch'
import { formatDateLabel, getNodeTitle, getNodeType } from './treeUtils'

const MAX_SUBCONTENT_DEPTH = 8

interface ExpandableSubcontentProps {
  item: NestedContent
  itemKey: string
  depth?: number
  defaultOpen?: boolean
}

function isReferenceNode(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

function isPicoNode(node: NestedContent) {
  return getNodeType(node).includes('pico')
}

interface SubSectionProps {
  label: string
  html: string
}

function SubSection({ label, html }: SubSectionProps) {
  return (
    <details className="group/sub border-t border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-[#025169]">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-hover/sub:text-[#025169]" />
        {label}
      </summary>
      <div
        className="content-html pb-4 pl-6 text-sm leading-6 text-slate-700"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </details>
  )
}

interface BegrunnelseSubSectionProps {
  html: string
  tradeoffs: string
  preferences: string
}

function BegrunnelseSubSection({ html, tradeoffs, preferences }: BegrunnelseSubSectionProps) {
  const hasVurdering = Boolean(tradeoffs || preferences)
  return (
    <details className="group/sub border-t border-slate-200">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-[#025169]">
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-hover/sub:text-[#025169]" />
        Begrunnelse
      </summary>
      <div className="pb-2 pl-6">
        {html && (
          <div
            className="content-html pb-4 text-sm leading-6 text-slate-700"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
          />
        )}
        {hasVurdering && (
          <details className="group/vurdering border-t border-slate-200">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-[#025169]">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/vurdering:rotate-90 group-hover/vurdering:text-[#025169]" />
              Vurdering
            </summary>
            <div className="space-y-4 pb-4 pl-6">
              {tradeoffs && (
                <div>
                  <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 6 }}>
                    Fordeler og ulemper
                  </Heading>
                  <div
                    className="content-html text-sm leading-6 text-slate-700"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tradeoffs) }}
                  />
                </div>
              )}
              {preferences && (
                <div>
                  <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 6 }}>
                    Verdier og preferanser
                  </Heading>
                  <div
                    className="content-html text-sm leading-6 text-slate-700"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preferences) }}
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
}: ExpandableSubcontentProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const navigate = useNavigate()
  const location = useLocation()
  const { id: currentContentId } = useParams<{ id: string }>()

  const isStub = Boolean(item.id) && !item.body && !item.tekst && !item.intro && !item.data

  const { data: fetchedContent, isFetching } = useQuery({
    queryKey: ['expandable-content', item.id],
    queryFn: async ({ signal }) => {
      if (!item.id) return null
      return fetchChapter(item.id, signal)
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
  const updated = formatDateLabel(resolved.sistOppdatert || resolved.sistFagligOppdatert)
  const shortIntro = resolved.kortIntro || ''
  const practical = resolved.data?.praktisk || ''
  const rationale = resolved.data?.rasjonale || ''
  const tradeoffs = resolved.data?.nokkelInfo?.fordelerogulemper || ''
  const preferences = resolved.data?.nokkelInfo?.verdierogpreferanser || ''
  const hasStandalonePage = Boolean(item.id) && !isReferenceNode(item) && !isPicoNode(item)
  const children = resolved.children ?? []
  const nestedChildren = children.filter((child) => !isReferenceNode(child) && !isPicoNode(child))

  return (
    <details
      key={itemKey}
      className="group rounded-lg border border-slate-200 bg-white transition-colors open:border-[#025169]/30 open:shadow-sm"
      style={{ marginLeft: `${depth * 14}px` }}
      open={defaultOpen || undefined}
      data-expandable-id={item.id || undefined}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open:rounded-b-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90 group-open:text-[#025169]" />
            <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900 group-open:text-[#025169]">
              {title}
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
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap hover:border-[#025169] hover:text-[#025169]"
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
          <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#025169]">
            {strength}
          </p>
        )}
        {(status || updated) && (
          <p className="mb-3 mt-0 text-xs text-slate-400">
            {status && <span>{status}</span>}
            {status && updated && <span> · </span>}
            {updated && <span>Oppdatert {updated}</span>}
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
          <div
            className="content-html text-sm leading-6 text-slate-800"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
          />
        )}

        {practical && <SubSection label="Praktisk informasjon" html={practical} />}
        {(rationale || tradeoffs || preferences) && (
          <BegrunnelseSubSection html={rationale} tradeoffs={tradeoffs} preferences={preferences} />
        )}

        {depth < MAX_SUBCONTENT_DEPTH && nestedChildren.length > 0 && (
          <div className="mt-3 space-y-3">
            {nestedChildren.map((child, index) => (
              <ExpandableSubcontent
                key={`${itemKey}-child-${child.id || index}`}
                item={child}
                itemKey={`${itemKey}-child-${child.id || index}`}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  )
}
