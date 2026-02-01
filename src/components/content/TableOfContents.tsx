import { Heading, Spinner } from '@digdir/designsystemet-react'
import type { TableOfContentsProps } from '../../types/components'
import type { NestedContent } from '../../types'

export function TableOfContents({
  chapters,
  expandedChapters,
  activeChapter,
  onChapterClick,
  isLoading = false,
}: TableOfContentsProps) {
  if (isLoading) {
    return (
      <nav
        style={{
          position: 'sticky',
          top: '20px',
          padding: '16px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Spinner aria-label="Laster kapitler..." />
        </div>
      </nav>
    )
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: '20px',
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    >
      <Heading level={3} data-size="xs" style={{ marginBottom: '12px' }}>
        Kapitler
      </Heading>
      
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {chapters.map((chapter, idx) => {
          const isExpanded = expandedChapters.has(idx)
          const isActive = activeChapter === `chapter-${idx}`
          
          return (
            <li key={idx} style={{ marginBottom: '8px' }}>
              <button
                onClick={() => {
                  const element = document.getElementById(`chapter-${idx}`)
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  onChapterClick(idx)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  textAlign: 'left',
                  color: isActive ? '#0051be' : '#333',
                  backgroundColor: isActive ? '#d4e7f7' : 'transparent',
                  borderRadius: '4px',
                  borderTop: 'none',
                  borderRight: 'none',
                  borderBottom: 'none',
                  borderLeft: isActive ? '3px solid #0051be' : '3px solid transparent',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 0 3px rgba(0, 81, 190, 0.1)' : 'none',
                  cursor: 'pointer',
                }}
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
                          onClick={() => {
                            const element = document.getElementById(`subchapter-${subKey}`)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '6px 8px',
                            textAlign: 'left',
                            color: isSubActive ? '#0051be' : '#64748b',
                            backgroundColor: 'transparent',
                            borderTop: 'none',
                            borderRight: 'none',
                            borderBottom: 'none',
                            borderLeft: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: isSubActive ? 600 : 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
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
