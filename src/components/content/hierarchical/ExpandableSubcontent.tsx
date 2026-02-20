import DOMPurify from 'dompurify'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import type { NestedContent } from '../../../types'
import { buildContentUrl } from '../../../lib/contentUrl'
import { formatDateLabel, getNodeTitle } from './treeUtils'

const MAX_SUBCONTENT_DEPTH = 8

interface ExpandableSubcontentProps {
  item: NestedContent
  itemKey: string
  depth?: number
}

function getNodeType(node: NestedContent) {
  return (
    node.type ||
    node.tekniskeData?.subtype ||
    node.tekniskeData?.infoType ||
    ''
  ).trim().toLowerCase()
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
        className="content-html pb-4 text-sm leading-6 text-slate-700"
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
      <div className="pb-2">
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
            <div className="space-y-4 pb-4">
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
}: ExpandableSubcontentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: currentContentId } = useParams<{ id: string }>()
  const title = getNodeTitle(item)
  const intro = item.intro || ''
  const body = item.tekst || item.body || ''

  const strength = item.data?.styrke || ''
  const status = item.status || ''
  const updated = formatDateLabel(item.sistOppdatert || item.sistFagligOppdatert)
  const shortIntro = item.kortIntro || ''
  const practical = item.data?.praktisk || ''
  const rationale = item.data?.rasjonale || ''
  const tradeoffs = item.data?.nokkelInfo?.fordelerogulemper || ''
  const preferences = item.data?.nokkelInfo?.verdierogpreferanser || ''
  const hasStandalonePage = Boolean(item.id) && !isReferenceNode(item) && !isPicoNode(item)
  const children = item.children ?? []
  const picoChildren = children.filter((child) => isPicoNode(child))
  const referenceChildren = children.filter((child) => isReferenceNode(child))
  const nestedChildren = children.filter((child) => !isReferenceNode(child) && !isPicoNode(child))

  return (
    <details
      key={itemKey}
      className="group border-b border-slate-100"
      style={{ paddingLeft: `${depth * 14}px` }}
    >
      <summary className="cursor-pointer list-none py-4 hover:bg-[#f8fafc]">
        <div className="flex items-start justify-between gap-4 px-1">
          <div className="flex min-w-0 items-start gap-3">
            <ChevronRightIcon className="mt-[0.3rem] h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90" />
            <div className="min-w-0">
              <span className="block whitespace-normal break-words text-[0.9375rem] font-medium leading-snug text-slate-800">
                {title}
              </span>
            </div>
          </div>

          {hasStandalonePage && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                if (!item.id) return
                const normalizedContentType = item.type?.trim()
                navigate(buildContentUrl({ id: item.id }), {
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

      <div className="pb-5 pl-8 pr-1 pt-1">
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

        {referenceChildren.length > 0 && (
          <details className="group/sub border-t border-slate-200">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-[#025169]">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90" />
              Referanser
            </summary>
            <ul className="m-0 list-disc space-y-2 pb-4 pl-5">
              {referenceChildren.map((reference, index) => (
                <li key={`${itemKey}-reference-${reference.id || index}`} className="text-sm leading-6 text-slate-700">
                  {getNodeTitle(reference)}
                </li>
              ))}
            </ul>
          </details>
        )}

        {picoChildren.length > 0 && (
          <details className="group/sub border-t border-slate-200">
            <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-[#025169]">
              <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90" />
              PICO-er
            </summary>
            <ul className="m-0 list-disc space-y-2 pb-4 pl-5">
              {picoChildren.map((pico, index) => (
                <li key={`${itemKey}-pico-${pico.id || index}`} className="text-sm leading-6 text-slate-700">
                  {getNodeTitle(pico)}
                </li>
              ))}
            </ul>
          </details>
        )}

        {depth < MAX_SUBCONTENT_DEPTH && nestedChildren.length > 0 && (
          <div className="mt-3 space-y-2">
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
