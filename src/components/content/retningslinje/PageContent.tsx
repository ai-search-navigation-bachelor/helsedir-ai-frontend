import DOMPurify from 'dompurify'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import type { PageNode } from './types'
import { hasVisibleContent } from './treeUtils'
import { RecommendationDropdown } from './RecommendationDropdown'

interface PageContentProps {
  activePage: PageNode
  pagesById: Map<string, PageNode>
  onSelectPage: (pageId: string) => void
}

export function PageContent({
  activePage,
  pagesById,
  onSelectPage,
}: PageContentProps) {
  const hasIntro = hasVisibleContent(activePage.node.intro)
  const hasBody = hasVisibleContent(activePage.node.tekst || activePage.node.body)
  const showChildNavigation = !hasIntro && !hasBody && activePage.childrenIds.length > 0

  return (
    <article>
      <div className="mb-6">
        <p className="m-0 mb-2 text-xs uppercase tracking-wide text-slate-500">
          Side {activePage.numbering}
        </p>
        <Heading level={2} data-size="lg" style={{ marginBottom: 0 }}>
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

      {showChildNavigation && (
        <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <Heading level={3} data-size="sm" style={{ marginBottom: 8 }}>
            {activePage.childrenIds.length === 1 ? 'Kapittel' : 'Kapitler'}
          </Heading>
          <ul className="m-0 list-none space-y-2 p-0">
            {activePage.childrenIds.map((childId) => {
              const child = pagesById.get(childId)
              if (!child) return null

              return (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPage(child.id)}
                    className="flex w-full items-start gap-2 rounded-md border border-transparent bg-white px-3 py-2 text-left text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    <span className="min-w-0">
                      <span className="mr-2 text-sm text-slate-400">{child.numbering}</span>
                      <span className="break-words">{child.title}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {activePage.recommendationChildren.length > 0 && (
        <section className="mt-8">
          <Heading level={3} data-size="sm" style={{ marginBottom: 12 }}>
            {activePage.recommendationChildren.length === 1 ? 'Anbefaling' : 'Anbefalinger'}
          </Heading>
          <div>
            {activePage.recommendationChildren.map((item, index) => (
              <RecommendationDropdown
                key={`${activePage.id}-rec-${item.id || index}`}
                item={item}
                itemKey={`${activePage.id}-rec-${item.id || index}`}
              />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}
