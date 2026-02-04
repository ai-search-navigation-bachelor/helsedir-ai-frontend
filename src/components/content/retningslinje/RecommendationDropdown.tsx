import DOMPurify from 'dompurify'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Paragraph } from '@digdir/designsystemet-react'
import type { NestedContent } from '../../../types'
import { formatDateLabel, getNodeTitle } from './treeUtils'

interface RecommendationDropdownProps {
  item: NestedContent
  itemKey: string
  depth?: number
}

export function RecommendationDropdown({
  item,
  itemKey,
  depth = 0,
}: RecommendationDropdownProps) {
  const title = getNodeTitle(item)
  const intro = item.intro || ''
  const body = item.tekst || item.body || ''
  const children = item.children || []

  const strength = item.data?.styrke || ''
  const status = item.status || ''
  const updated = formatDateLabel(item.sistOppdatert || item.sistFagligOppdatert)
  const shortIntro = item.kortIntro || ''
  const practical = item.data?.praktisk || ''
  const rationale = item.data?.rasjonale || ''
  const tradeoffs = item.data?.nokkelInfo?.fordelerogulemper || ''
  const preferences = item.data?.nokkelInfo?.verdierogpreferanser || ''

  return (
    <details key={itemKey} className="mb-3 rounded-lg border border-slate-200 bg-white">
      <summary
        className="cursor-pointer list-none px-3 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <div className="flex items-start gap-2">
          <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1">
              {strength && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
                  {strength}
                </span>
              )}
            </div>
            <span className="block whitespace-normal break-words leading-6">{title}</span>
          </div>
        </div>
      </summary>

      <div className="px-3 pb-4 pt-1" style={{ paddingLeft: `${34 + depth * 12}px` }}>
        {(status || updated) && (
          <p className="mb-2 mt-0 text-xs text-slate-500">
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

        {practical && (
          <details className="mt-3 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
              Praktisk
            </summary>
            <div
              className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(practical) }}
            />
          </details>
        )}

        {rationale && (
          <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
              Rasjonale
            </summary>
            <div
              className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rationale) }}
            />
          </details>
        )}

        {tradeoffs && (
          <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
              Fordeler og ulemper
            </summary>
            <div
              className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tradeoffs) }}
            />
          </details>
        )}

        {preferences && (
          <details className="mt-2 rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
              Verdier og preferanser
            </summary>
            <div
              className="content-html px-3 pb-3 text-sm leading-6 text-slate-800"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(preferences) }}
            />
          </details>
        )}

        {children.length > 0 && (
          <div className="mt-2">
            {children.map((child, index) => (
              <RecommendationDropdown
                key={`${itemKey}-${child.id || index}`}
                item={child}
                itemKey={`${itemKey}-${child.id || index}`}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </details>
  )
}
