import { ChevronDownIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import DOMPurify from 'dompurify'
import type { NestedContent } from '../../types'

interface ChapterAccordionProps {
  chapter: NestedContent
  chapterIndex: number
  isExpanded: boolean
  onToggle: () => void
  expandedSubchapters: Set<string>
  onToggleSubchapter: (key: string) => void
}

interface SubchapterItemProps {
  subchapter: NestedContent
  chapterIndex: number
  subIndex: number
  parentPath: string
  depth: number
  expandedSubchapters: Set<string>
  onToggleSubchapter: (key: string) => void
}

function SubchapterItem({ 
  subchapter, 
  chapterIndex, 
  subIndex, 
  parentPath,
  depth,
  expandedSubchapters, 
  onToggleSubchapter 
}: SubchapterItemProps) {
  const subKey = `${parentPath}-${subIndex}`
  const isExpanded = expandedSubchapters.has(subKey)
  const hasChildren = subchapter.children && subchapter.children.length > 0
  const title = subchapter.tittel || subchapter.title || 'Uten tittel'
  const body = subchapter.tekst || subchapter.body || ''
  
  // Calculate numbering (e.g., "3.1" or "3.1.1")
  const numberParts = parentPath.split('-').slice(0, -1)
  const numbering = numberParts.length > 0 
    ? `${numberParts.join('.')}.${subIndex + 1}`
    : `${chapterIndex + 1}.${subIndex + 1}`

  return (
    <div
      id={`subchapter-${subKey}`}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
        scrollMarginTop: '20px',
      }}
    >
      <button
        className="chapter-accordion__subtrigger"
        onClick={() => onToggleSubchapter(subKey)}
        style={{
          width: '100%',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isExpanded ? '#f0f9ff' : '#ffffff',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ 
            fontSize: depth === 1 ? '15px' : '14px', 
            fontWeight: '600',
            color: '#2563eb',
            minWidth: '40px',
          }}>
            {numbering}
          </span>
          <span className="chapter-accordion__subtitle" style={{ 
            fontSize: depth === 1 ? '15px' : '14px', 
            fontWeight: '500',
            color: '#334155',
            textAlign: 'left',
          }}>
            {title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon style={{ width: '20px', height: '20px', color: '#2563eb', flexShrink: 0 }} />
        ) : (
          <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748b', flexShrink: 0 }} />
        )}
      </button>

      {isExpanded && (
        <div style={{ 
          padding: '16px',
          backgroundColor: depth === 1 ? '#f9fafb' : '#fefefe',
          borderTop: '1px solid #cbd5e1',
        }}>
          {subchapter.intro && (
            <div style={{
              fontSize: '15px',
              lineHeight: '1.6',
              color: '#555',
              marginBottom: '16px',
              fontWeight: 500,
            }}>
              {subchapter.intro}
            </div>
          )}
          
          {body && (
            <div
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: '#333',
                marginBottom: hasChildren ? '16px' : '0',
              }}
              className="content-html"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(body) 
              }}
            />
          )}

          {hasChildren && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginTop: depth === 1 ? '24px' : '12px',
              paddingLeft: depth > 1 ? '16px' : '0',
            }}>
              {subchapter.children!.map((child, childIdx) => (
                <SubchapterItem
                  key={`${subKey}-${childIdx}`}
                  subchapter={child}
                  chapterIndex={chapterIndex}
                  subIndex={childIdx}
                  parentPath={subKey}
                  depth={depth + 1}
                  expandedSubchapters={expandedSubchapters}
                  onToggleSubchapter={onToggleSubchapter}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ChapterAccordion({ 
  chapter, 
  chapterIndex, 
  isExpanded, 
  onToggle,
  expandedSubchapters,
  onToggleSubchapter
}: ChapterAccordionProps) {
  const title = chapter.tittel || chapter.title || 'Uten tittel'
  const body = chapter.tekst || chapter.body || ''
  const hasSubchapters = chapter.children && chapter.children.length > 0

  return (
    <div 
      id={`chapter-${chapterIndex}`}
      style={{
        border: '2px solid #cbd5e1',
        borderRadius: '8px',
        overflow: 'hidden',
        scrollMarginTop: '20px',
      }}
    >
      <button
        className={`chapter-accordion__trigger ${isExpanded ? 'is-expanded' : ''}`}
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isExpanded ? '#f0f9ff' : '#ffffff',
          borderTop: 'none',
          borderRight: 'none',
          borderBottom: 'none',
          borderLeft: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f8fafc'
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '700',
            color: '#2563eb',
            minWidth: '30px',
          }}>
            {chapterIndex + 1}.
          </span>
          <span className="chapter-accordion__title" style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            color: '#1e293b',
            textAlign: 'left',
          }}>
            {title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDownIcon style={{ width: '24px', height: '24px', color: '#2563eb' }} />
        ) : (
          <ChevronRightIcon style={{ width: '24px', height: '24px', color: '#64748b' }} />
        )}
      </button>

      {isExpanded && (
        <div style={{ 
          padding: '24px',
          backgroundColor: '#fafafa',
          borderTop: '2px solid #cbd5e1',
        }}>
          {chapter.intro && (
            <div style={{
              fontSize: '16px',
              lineHeight: '1.7',
              color: '#555',
              marginBottom: '20px',
              fontWeight: 500,
            }}>
              {chapter.intro}
            </div>
          )}
          
          {body && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#333',
                marginBottom: hasSubchapters ? '0' : '0',
              }}
              className="content-html"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(body) 
              }}
            />
          )}

          {hasSubchapters && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '12px',
              marginTop: '24px',
            }}>
              {chapter.children!.map((subchapter, subIdx) => (
                <SubchapterItem
                  key={`${chapterIndex}-${subIdx}`}
                  subchapter={subchapter}
                  chapterIndex={chapterIndex}
                  subIndex={subIdx}
                  parentPath={`${chapterIndex}`}
                  depth={1}
                  expandedSubchapters={expandedSubchapters}
                  onToggleSubchapter={onToggleSubchapter}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
