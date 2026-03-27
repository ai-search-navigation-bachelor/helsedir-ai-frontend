import { useEffect } from 'react'
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
import { useContentDisclosureStore } from '../../../stores/contentDisclosureStore'

const MAX_SUBCONTENT_DEPTH = 8

function isHttpIdentifier(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value))
}

interface ExpandableSubcontentProps {
  item: NestedContent
  itemKey: string
  depth?: number
  defaultOpen?: boolean
}

interface PersistedDetailsProps {
  pageStateKey: string
  disclosureId: string
}

function getSectionIdFromLocationState(state: unknown) {
  if (!state || typeof state !== 'object') return null
  const sectionId = (state as { sectionId?: unknown }).sectionId
  if (typeof sectionId !== 'string') return null
  const trimmed = sectionId.trim()
  return trimmed.length > 0 ? trimmed : null
}

function PersistedDetails({
  pageStateKey,
  disclosureId,
  summary,
  children,
  className,
  summaryClassName,
  contentClassName,
}: React.PropsWithChildren<PersistedDetailsProps & {
  summary: string
  className: string
  summaryClassName: string
  contentClassName?: string
}>) {
  const isOpen = useContentDisclosureStore(
    (state) => (state.openDisclosureIdsByPage[pageStateKey] ?? []).includes(disclosureId),
  )
  const setDisclosureOpen = useContentDisclosureStore((state) => state.setDisclosureOpen)

  return (
    <details
      className={className}
      open={isOpen || undefined}
      onToggle={(event) => {
        if (event.target !== event.currentTarget) return
        setDisclosureOpen(pageStateKey, disclosureId, event.currentTarget.open)
      }}
    >
      <summary className={summaryClassName}>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open/sub:rotate-90 group-open/vurdering:rotate-90 group-hover/sub:text-brand group-hover/vurdering:text-brand" />
        {summary}
      </summary>
      {contentClassName ? <div className={contentClassName}>{children}</div> : children}
    </details>
  )
}

function isReferenceNode(node: NestedContent) {
  return getNodeType(node).includes('referanse')
}

function isPicoNode(node: NestedContent) {
  return getNodeType(node).includes('pico')
}

function ReferenceDropdown({
  items,
  pageStateKey,
  disclosureId,
}: { items: NestedContent[] } & PersistedDetailsProps) {
  if (items.length === 0) return null

  return (
    <PersistedDetails
      pageStateKey={pageStateKey}
      disclosureId={disclosureId}
      summary="Referanser"
      className="group/sub border-t border-slate-200"
      summaryClassName="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand"
      contentClassName="pb-4 pl-6"
    >
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
    </PersistedDetails>
  )
}

interface SubSectionProps {
  label: string
  html: string
  pageStateKey: string
  disclosureId: string
}

function SubSection({ label, html, pageStateKey, disclosureId }: SubSectionProps) {
  return (
    <PersistedDetails
      pageStateKey={pageStateKey}
      disclosureId={disclosureId}
      summary={label}
      className="group/sub border-t border-slate-200"
      summaryClassName="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand"
    >
      <RichContentHtml
        className="content-html pb-4 pl-6 text-[0.9375rem] font-medium leading-7 text-slate-700"
        html={html}
      />
    </PersistedDetails>
  )
}

interface BegrunnelseSubSectionProps {
  html: string
  tradeoffs: string
  preferences: string
  pageStateKey: string
  disclosureId: string
}

function BegrunnelseSubSection({
  html,
  tradeoffs,
  preferences,
  pageStateKey,
  disclosureId,
}: BegrunnelseSubSectionProps) {
  const hasVurdering = Boolean(tradeoffs || preferences)
  return (
    <PersistedDetails
      pageStateKey={pageStateKey}
      disclosureId={disclosureId}
      summary="Begrunnelse"
      className="group/sub border-t border-slate-200"
      summaryClassName="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand"
      contentClassName="pb-2 pl-6"
    >
        {html && (
          <RichContentHtml
            className="content-html pb-4 text-[0.9375rem] font-medium leading-7 text-slate-700"
            html={html}
          />
        )}
        {hasVurdering && (
          <PersistedDetails
            pageStateKey={pageStateKey}
            disclosureId={`${disclosureId}-vurdering`}
            summary="Vurdering"
            className="group/vurdering border-t border-slate-200"
            summaryClassName="flex cursor-pointer list-none items-center gap-2 py-3 text-sm font-semibold text-slate-700 hover:text-brand"
            contentClassName="space-y-4 pb-4 pl-6"
          >
              {tradeoffs && (
                <div>
                  <Heading level={3} data-size="xs" className="font-title" style={{ marginTop: 0, marginBottom: 6 }}>
                    Fordeler og ulemper
                  </Heading>
                  <RichContentHtml
                    className="content-html text-[0.9375rem] font-medium leading-7 text-slate-700"
                    html={tradeoffs}
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
                    html={preferences}
                  />
                </div>
              )}
          </PersistedDetails>
        )}
    </PersistedDetails>
  )
}

export function ExpandableSubcontent({
  item,
  itemKey,
  depth = 0,
  defaultOpen = false,
}: ExpandableSubcontentProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: currentContentId } = useParams<{ id: string }>()
  const locationSectionId = getSectionIdFromLocationState(location.state)
  const pageStateKey = `hierarchical:${location.key}:${location.pathname}:${locationSectionId ?? 'overview'}`
  const disclosureId = `expandable:${item.id || itemKey}`
  const isOpen = useContentDisclosureStore(
    (state) => (state.openDisclosureIdsByPage[pageStateKey] ?? []).includes(disclosureId),
  )
  const setDisclosureOpen = useContentDisclosureStore((state) => state.setDisclosureOpen)

  useEffect(() => {
    if (!defaultOpen) return
    setDisclosureOpen(pageStateKey, disclosureId, true)
  }, [defaultOpen, disclosureId, pageStateKey, setDisclosureOpen])

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
        setDisclosureOpen(pageStateKey, disclosureId, e.currentTarget.open)
      }}
    >
      <summary className="cursor-pointer list-none rounded-lg px-4 py-3.5 transition-colors hover:bg-slate-50 group-open:rounded-b-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-150 group-open:rotate-90 group-open:text-brand" />
            <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900 group-open:text-brand">
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
            html={body}
          />
        )}

        {practical && (
          <SubSection
            label="Praktisk informasjon"
            html={practical}
            pageStateKey={pageStateKey}
            disclosureId={`${disclosureId}-praktisk`}
          />
        )}
        {(rationale || tradeoffs || preferences) && (
          <BegrunnelseSubSection
            html={rationale}
            tradeoffs={tradeoffs}
            preferences={preferences}
            pageStateKey={pageStateKey}
            disclosureId={`${disclosureId}-begrunnelse`}
          />
        )}
        <ReferenceDropdown
          items={referenceChildren}
          pageStateKey={pageStateKey}
          disclosureId={`${disclosureId}-referanser`}
        />

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

        {fagligOppdatert && (
          <p className="mt-4 mb-0 text-xs text-slate-400">
            Siste faglige endring: {fagligOppdatert}
          </p>
        )}
      </div>
    </details>
  )
}
