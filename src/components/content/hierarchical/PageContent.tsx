import DOMPurify from 'dompurify'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { HiArrowRight } from 'react-icons/hi2'
import type { PageNode } from './types'
import { hasVisibleContent } from './treeUtils'
import { ExpandableSubcontent } from './ExpandableSubcontent'
import { ExpandableLoadingSkeleton } from '../ContentSkeletons'
import { getDocumentLinks, isHelsedirektoratetPdfUrl } from '../detail/documentUtils'

interface PageContentProps {
  activePage: PageNode
  pagesById: Map<string, PageNode>
  onSelectPage: (pageId: string) => void
  previousPage?: PageNode
  nextPage?: PageNode
  isLoadingExpandable?: boolean
}

export function PageContent({
  activePage,
  pagesById,
  onSelectPage,
  previousPage,
  nextPage,
  isLoadingExpandable = false,
}: PageContentProps) {
  const hasIntro = hasVisibleContent(activePage.node.intro)
  const hasBody = hasVisibleContent(activePage.node.tekst || activePage.node.body)
  const documentLinks = getDocumentLinks(activePage.node)
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
    Boolean(publicationUrl) && !hasMainContent && hasOnlyHelsedirPdfDocuments
  const visibleDocumentLinks = shouldShowPublicationLink
    ? documentLinks.filter((document) => !isHelsedirektoratetPdfUrl(document.href))
    : documentLinks
  const primaryDocument = visibleDocumentLinks[0]
  const showChildNavigation = !hasIntro && !hasBody && activePage.childrenIds.length > 0

  return (
    <article>
      <div className="mb-6">
        <p className="m-0 mb-2 text-xs uppercase tracking-wide text-slate-500">
          Side {activePage.numbering}
        </p>
        <Heading level={2} data-size="lg" className="font-title" style={{ marginBottom: 0 }}>
          {activePage.title}
        </Heading>
      </div>

      {hasIntro && (
        <Paragraph style={{ marginTop: 0, color: '#334155' }}>
          {activePage.node.intro}
        </Paragraph>
      )}

      {hasBody && (
        <div
          className="content-html text-base leading-7 text-slate-800"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(activePage.node.tekst || activePage.node.body || ''),
          }}
        />
      )}

      {!hasIntro && !hasBody && (primaryDocument || shouldShowPublicationLink) && (
        <section className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                  className="text-sm text-[#025169] hover:underline"
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
                  className="text-sm text-[#025169] hover:underline"
                >
                  Åpne side hos Helsedirektoratet
                </a>
              </li>
            )}
          </ul>
        </section>
      )}

      {showChildNavigation && (
        <section className="mt-6">
          <Heading level={3} data-size="sm" className="font-title" style={{ marginBottom: 10 }}>
            {activePage.childrenIds.length === 1 ? 'Kapittel' : 'Kapitler'}
          </Heading>
          <ul className="m-0 list-none border-t border-slate-100 p-0">
            {activePage.childrenIds.map((childId) => {
              const child = pagesById.get(childId)
              if (!child) return null

              return (
                <li key={child.id} className="border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectPage(child.id)}
                    className="group flex w-full items-center gap-4 py-3.5 text-left border-0 bg-transparent cursor-pointer transition-colors hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-[#025169] focus-visible:outline-offset-[-2px]"
                  >
                    <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-[#025169]">
                      {child.numbering}
                    </span>
                    <span className="min-w-0 break-words text-[0.9375rem] text-slate-700 transition-colors group-hover:text-[#025169]">
                      {child.title}
                    </span>
                    <HiArrowRight className="ml-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#025169]" />
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
        <section className="mt-4">
          <div className="border-t border-slate-100">
            {activePage.expandableChildren.map((item, index) => (
              <ExpandableSubcontent
                key={`${activePage.id}-rec-${item.id || index}`}
                item={item}
                itemKey={`${activePage.id}-rec-${item.id || index}`}
              />
            ))}
          </div>
        </section>
      ) : null}

      {(previousPage || nextPage) && (
        <nav aria-label="Navigasjon mellom kapitler" className="mt-8 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {previousPage ? (
              <button
                type="button"
                onClick={() => onSelectPage(previousPage.id)}
                className="inline-flex items-center gap-[0.375rem] px-[0.625rem] py-[0.375rem] rounded-lg border border-[var(--ds-color-logobla-1-base-default)] bg-[var(--ds-color-logobla-1-base-default)] text-[var(--ds-color-logobla-1-base-contrast-default)] text-[0.8125rem] font-semibold leading-[1.2] cursor-pointer transition-all hover:border-[var(--ds-color-logobla-1-base-hover)] hover:bg-[var(--ds-color-logobla-1-base-hover)] active:border-[var(--ds-color-logobla-1-base-active)] active:bg-[var(--ds-color-logobla-1-base-active)] focus-visible:outline-2 focus-visible:outline-[var(--ds-color-logobla-1-border-default)] focus-visible:outline-offset-2"
                aria-label={`Gå til forrige kapittel ${previousPage.numbering}`}
              >
                <span aria-hidden="true" className="text-[var(--ds-color-logobla-1-base-contrast-subtle)]">←</span>
                <span className="text-[var(--ds-color-logobla-1-base-contrast-default)]">Forrige</span>
                <span className="text-[var(--ds-color-logobla-1-base-contrast-subtle)] font-bold">{previousPage.numbering}</span>
              </button>
            ) : null}

            {nextPage ? (
              <button
                type="button"
                onClick={() => onSelectPage(nextPage.id)}
                className="ml-auto inline-flex items-center gap-[0.375rem] px-[0.625rem] py-[0.375rem] rounded-lg border border-[var(--ds-color-logobla-1-base-default)] bg-[var(--ds-color-logobla-1-base-default)] text-[var(--ds-color-logobla-1-base-contrast-default)] text-[0.8125rem] font-semibold leading-[1.2] cursor-pointer transition-all hover:border-[var(--ds-color-logobla-1-base-hover)] hover:bg-[var(--ds-color-logobla-1-base-hover)] active:border-[var(--ds-color-logobla-1-base-active)] active:bg-[var(--ds-color-logobla-1-base-active)] focus-visible:outline-2 focus-visible:outline-[var(--ds-color-logobla-1-border-default)] focus-visible:outline-offset-2"
                aria-label={`Gå til neste kapittel ${nextPage.numbering}`}
              >
                <span className="text-[var(--ds-color-logobla-1-base-contrast-default)]">Neste</span>
                <span className="text-[var(--ds-color-logobla-1-base-contrast-subtle)] font-bold">{nextPage.numbering}</span>
                <span aria-hidden="true" className="text-[var(--ds-color-logobla-1-base-contrast-subtle)]">→</span>
              </button>
            ) : null}
          </div>
        </nav>
      )}
    </article>
  )
}
