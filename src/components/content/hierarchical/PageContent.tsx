import type { MouseEvent } from 'react'
import { ChevronRightIcon } from '@navikt/aksel-icons'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { HiArrowRight } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import type { PageNode } from './types'
import { hasVisibleContent, getNodeTitle, formatDateLabel } from './treeUtils'
import { ExpandableSubcontent } from './ExpandableSubcontent'
import { ExpandableLoadingSkeleton } from '../ContentSkeletons'
import { getDocumentLinks, getRelatedLinks, isHelsedirektoratetPdfUrl } from '../detail/documentUtils'
import { RichContentHtml } from '../shared/RichContentHtml'

interface PageContentProps {
  activePage: PageNode
  pagesById: Map<string, PageNode>
  onSelectPage: (pageId: string, expandableId?: string, scrollTo?: boolean) => void
  previousPage?: PageNode
  nextPage?: PageNode
  isLoadingExpandable?: boolean
  isOverview?: boolean
  autoOpenExpandableId?: string | null
}

export function PageContent({
  activePage,
  pagesById,
  onSelectPage,
  previousPage,
  nextPage,
  isLoadingExpandable = false,
  isOverview = false,
  autoOpenExpandableId = null,
}: PageContentProps) {
  const navigate = useNavigate()
  const isPdfOnlyContent = Boolean(activePage.node.is_pdf_only)
  const hasIntro = hasVisibleContent(activePage.node.intro)
  const hasBody = !isPdfOnlyContent && hasVisibleContent(activePage.node.tekst || activePage.node.body)
  const documentLinks = getDocumentLinks(activePage.node)
  const relatedLinks = getRelatedLinks(activePage.node)
  const publicationUrl = (() => {
    const url = activePage.node.url?.trim()
    if (!url) return null
    return documentLinks.some((document) => document.href === url) ? null : url
  })()
  const hasMainContent = hasIntro || hasBody
  const hasOnlyHelsedirPdfDocuments =
    documentLinks.length > 0 &&
    documentLinks.every((document) => isHelsedirektoratetPdfUrl(document.href))
  const shouldShowPublicationLink =
    Boolean(publicationUrl) && !hasMainContent && (hasOnlyHelsedirPdfDocuments || documentLinks.length === 0)
  const visibleDocumentLinks = shouldShowPublicationLink
    ? documentLinks.filter((document) => !isHelsedirektoratetPdfUrl(document.href))
    : documentLinks
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
  const showChildNavigation = activePage.childrenIds.length > 0 && (isOverview || (!hasIntro && !hasBody))
  const headingLevel = isOverview ? Math.max(2, Math.min(2 + activePage.depth - 1, 5)) as 2 | 3 | 4 | 5 : 2
  const headingSize = activePage.depth <= 1 ? 'md' : 'sm'

  return (
    <article>
      <div className="mb-6">
        {isOverview ? (
          <button
            type="button"
            onClick={() => onSelectPage(activePage.id, undefined, true)}
            className="group -mx-2 -my-1 w-[calc(100%+1rem)] rounded-lg border-0 bg-transparent px-2 py-1 text-left cursor-pointer transition-colors hover:bg-slate-100"
          >
            <Heading level={headingLevel} data-size={headingSize} className="font-title transition-colors group-hover:text-brand" style={{ marginBottom: 0 }}>
              {activePage.numbering && (
                <span className="mr-2 transition-colors group-hover:text-brand">{activePage.numbering}</span>
              )}
              {activePage.title}
            </Heading>
          </button>
        ) : (
          <Heading level={headingLevel} data-size={headingSize} className="font-title" style={{ marginBottom: 0 }}>
            {activePage.numbering && (
              <span className="mr-2 text-slate-800">{activePage.numbering}</span>
            )}
            {activePage.title}
          </Heading>
        )}
      </div>

      {hasIntro && (
        <Paragraph style={{ marginTop: 0, color: '#334155' }}>
          {activePage.node.intro}
        </Paragraph>
      )}

      {hasBody && (
        <RichContentHtml
          className="content-html text-base leading-7 text-slate-800"
          html={activePage.node.tekst || activePage.node.body || ''}
        />
      )}

      {!hasIntro && !hasBody && hasRelatedLinks && (
        <section className="mt-6 space-y-4">
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

      {!hasIntro && !hasBody && fallbackLinks.length > 0 && (
        <section className="mt-6 space-y-4">
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

      {!hasIntro && !hasBody && isPrimaryPdfAction && primaryDocument && (
        <section className="mt-6 space-y-4">
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
                  className="text-sm text-brand hover:underline"
                >
                  Åpne side hos Helsedirektoratet
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      {showChildNavigation && (
        <section className={isOverview ? '' : 'mt-6'}>
          {!isOverview && (
            <Heading level={3} data-size="sm" className="font-title" style={{ marginBottom: 10 }}>
              {activePage.childrenIds.length === 1 ? 'Kapittel' : 'Kapitler'}
            </Heading>
          )}
          <ul className="m-0 list-none border-t border-slate-100 p-0">
            {activePage.childrenIds.map((childId) => {
              const child = pagesById.get(childId)
              if (!child) return null

              return (
                <li key={child.id} className="border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectPage(child.id, undefined, true)}
                    className="group flex w-full items-center gap-4 py-3.5 text-left border-0 bg-transparent cursor-pointer transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-[-2px]"
                  >
                    <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-brand">
                      {child.numbering}
                    </span>
                    <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand">
                      {child.title}
                    </span>
                    <HiArrowRight className="ml-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand" />
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {isLoadingExpandable ? (
        <ExpandableLoadingSkeleton items={activePage.expandableChildren.length || 3} />
      ) : activePage.expandableChildren.length > 0 ? (
        isOverview ? (
          <section className="mt-4 space-y-2">
            {activePage.expandableChildren.map((item, index) => (
              <button
                key={`${activePage.id}-overview-${item.id || index}`}
                type="button"
                onClick={() => onSelectPage(activePage.id, item.id || undefined)}
                className="group flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-left cursor-pointer transition-all hover:border-brand/30 hover:shadow-sm"
              >
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-brand" />
                <span className="min-w-0 whitespace-normal break-words text-[0.9375rem] font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand">
                  {getNodeTitle(item)}
                </span>
              </button>
            ))}
          </section>
        ) : (
          <section className="mt-6 space-y-3">
            {activePage.expandableChildren.map((item, index) => (
              <ExpandableSubcontent
                key={`${activePage.id}-rec-${item.id || index}`}
                item={item}
                itemKey={`${activePage.id}-rec-${item.id || index}`}
                defaultOpen={Boolean(autoOpenExpandableId && item.id === autoOpenExpandableId)}
              />
            ))}
          </section>
        )
      ) : null}

      {!isOverview && (() => {
        const fagligOppdatert = formatDateLabel(activePage.node.sistFagligOppdatert)
        if (!fagligOppdatert) return null
        return (
          <section className="mt-8">
            <Paragraph data-size="xs" className="m-0 text-xs text-slate-500">
              <span className="font-medium text-slate-600">Siste faglige endring:</span> {fagligOppdatert}
            </Paragraph>
          </section>
        )
      })()}

      {/* Page navigation */}
      {(previousPage || nextPage) && (
        <nav
          aria-label="Navigasjon mellom kapitler"
          className="mt-10"
          style={{ paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}
        >
          <div className="flex flex-wrap items-stretch gap-3">
            {previousPage ? (
              <button
                type="button"
                onClick={() => onSelectPage(previousPage.id, undefined, true)}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left cursor-pointer transition-all hover:border-brand/40 hover:shadow-sm"
                aria-label={`Gå til forrige kapittel ${previousPage.numbering}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:bg-brand/90">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-wide text-slate-400">Forrige</span>
                  <span className="block truncate text-sm font-medium text-slate-700 group-hover:text-brand">
                    {previousPage.numbering} {previousPage.title}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex-1" />
            )}

            {nextPage ? (
              <button
                type="button"
                onClick={() => onSelectPage(nextPage.id, undefined, true)}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-right cursor-pointer transition-all hover:border-brand/40 hover:shadow-sm"
                aria-label={`Gå til neste kapittel ${nextPage.numbering}`}
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-[0.6875rem] font-medium uppercase tracking-wide text-slate-400">Neste</span>
                  <span className="block truncate text-sm font-medium text-slate-700 group-hover:text-brand">
                    {nextPage.numbering} {nextPage.title}
                  </span>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors group-hover:bg-brand/90">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </span>
              </button>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </nav>
      )}
    </article>
  )
}
