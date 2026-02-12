import { Heading } from '@digdir/designsystemet-react'
import type { TableOfContentsProps } from '../../../types/components'
import type { NestedContent } from '../../../types'
import { TableOfContentsLoadingSkeleton } from '../ContentSkeletons'

export function TableOfContents({
  chapters,
  expandedChapters,
  activeChapter,
  onChapterClick,
  isLoading = false,
}: TableOfContentsProps) {
  if (isLoading) {
    return <TableOfContentsLoadingSkeleton />
  }

  return (
    <nav className="toc">
      <Heading level={3} data-size="xs" className="toc__title">
        Kapitler
      </Heading>

      <ul className="toc__list">
        {chapters.map((chapter, idx) => {
          const isExpanded = expandedChapters.has(idx)
          const isActive = activeChapter === `chapter-${idx}`

          return (
            <li key={idx} className="toc__item">
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById(`chapter-${idx}`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  onChapterClick(idx)
                }}
                className={`toc__link ${isActive ? 'is-active' : ''}`}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: '700', color: '#64748b', minWidth: '20px' }}>
                    {idx + 1}.
                  </span>
                  <span>{chapter.tittel || chapter.title || 'Uten tittel'}</span>
                </div>
              </button>

              {isExpanded && chapter.children && chapter.children.length > 0 && (
                <ul style={{ listStyle: 'none', padding: '0 0 0 32px', margin: '4px 0 0 0' }}>
                  {chapter.children.map((sub: NestedContent, subIdx: number) => {
                    const subKey = `${idx}-${subIdx}`
                    const isSubActive = activeChapter === `subchapter-${subKey}`

                    return (
                      <li key={subKey} style={{ marginBottom: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const element = document.getElementById(`subchapter-${subKey}`)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          className={`toc__sublink ${isSubActive ? 'is-active' : ''}`}
                        >
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ fontWeight: '600', minWidth: '30px' }}>
                              {idx + 1}.{subIdx + 1}
                            </span>
                            <span>{sub.tittel || sub.title || 'Uten tittel'}</span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
