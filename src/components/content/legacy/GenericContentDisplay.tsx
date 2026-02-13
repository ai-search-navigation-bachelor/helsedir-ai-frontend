import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { useNestedChaptersQuery } from '../../../hooks/queries/useNestedChaptersQuery'
import type { ContentDisplayProps } from '../../../types/pages'
import { ChapterAccordion } from './ChapterAccordion'
import { ContentPageHeader } from '../ContentPageHeader'
import { GenericChaptersLoadingSkeleton } from '../ContentSkeletons'
import { TableOfContents } from './TableOfContents'

export function GenericContentDisplay({ content }: ContentDisplayProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [expandedSubchapters, setExpandedSubchapters] = useState<Set<string>>(new Set())
  const [activeChapter, setActiveChapter] = useState<string | null>(null)

  const { chapters, isLoading: chaptersLoading } = useNestedChaptersQuery({
    contentId: content.id,
    links: content.links,
  })

  const toggleChapter = (idx: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) {
        next.delete(idx)
      } else {
        next.add(idx)
      }
      return next
    })
  }

  const toggleSubchapter = (key: string) => {
    setExpandedSubchapters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let mostVisible = null
        let maxRatio = 0

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio
            mostVisible = entry.target.id
          }
        })

        if (mostVisible) {
          setActiveChapter(mostVisible)
        }
      },
      { rootMargin: '0px 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    chapters.forEach((_, idx) => {
      const element = document.getElementById(`chapter-${idx}`)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [chapters])

  const displayType = content.content_type
    ? content.content_type.charAt(0).toUpperCase() + content.content_type.slice(1)
    : 'Innhold'

  return (
    <div>
      <div style={{ marginBottom: '48px' }}>
        <ContentPageHeader typeLabel={displayType} title={content.title} />
      </div>

      {chapters.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gap: '40px',
            alignItems: 'start',
          }}
        >
          <TableOfContents
            chapters={chapters}
            expandedChapters={expandedChapters}
            activeChapter={activeChapter}
            onChapterClick={toggleChapter}
            isLoading={chaptersLoading}
          />

          <div>
            {content.body && (
              <div
                style={{
                  fontSize: '16px',
                  lineHeight: '1.7',
                  color: '#333',
                  marginBottom: '48px',
                }}
                className="content-html"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
              />
            )}

            {chaptersLoading && <GenericChaptersLoadingSkeleton />}

            {!chaptersLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {chapters.map((chapter, chapterIdx) => (
                  <ChapterAccordion
                    key={chapterIdx}
                    chapter={chapter}
                    chapterIndex={chapterIdx}
                    isExpanded={expandedChapters.has(chapterIdx)}
                    onToggle={() => toggleChapter(chapterIdx)}
                    expandedSubchapters={expandedSubchapters}
                    onToggleSubchapter={toggleSubchapter}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {content.body && (
            <div
              style={{
                fontSize: '16px',
                lineHeight: '1.7',
                color: '#333',
              }}
              className="content-html"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          )}
        </div>
      )}
    </div>
  )
}
