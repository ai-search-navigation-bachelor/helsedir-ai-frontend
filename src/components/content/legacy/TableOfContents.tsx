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
    <nav className="sticky top-4 p-4 bg-[#f9f9f9] rounded border border-[#e0e0e0]">
      <Heading level={3} data-size="xs" className="mb-3">
        Kapitler
      </Heading>

      <ul className="list-none p-0 m-0">
        {chapters.map((chapter, idx) => {
          const isExpanded = expandedChapters.has(idx)
          const isActive = activeChapter === `chapter-${idx}`

          return (
            <li key={idx} className="mb-2">
              <button
                type="button"
                onClick={() => {
                  const element = document.getElementById(`chapter-${idx}`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  onChapterClick(idx)
                }}
                className={`block w-full px-3 py-2 text-left no-underline bg-transparent border-0 border-l-[3px] rounded text-sm font-normal cursor-pointer transition-all hover:text-[#0f172a] hover:underline ${
                  isActive
                    ? 'text-[#0051be] bg-[#d4e7f7] border-l-[#0051be] font-semibold shadow-[0_0_0_3px_rgba(0,81,190,0.1)]'
                    : 'text-[#333] border-l-transparent'
                }`}
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
                          className={`block w-full px-2 py-[0.375rem] text-left bg-transparent border-0 rounded text-[0.8125rem] font-normal cursor-pointer no-underline transition-all hover:text-[#0f172a] hover:underline ${
                            isSubActive ? 'text-[#0051be] font-semibold' : 'text-[#64748b]'
                          }`}
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
