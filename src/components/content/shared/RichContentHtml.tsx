import { type MouseEvent, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanitizeContentHtml } from '../../../lib/contentHtml'

interface RichContentHtmlProps {
  html?: string
  className?: string
}

export function RichContentHtml({ html, className }: RichContentHtmlProps) {
  const navigate = useNavigate()
  const sanitizedHtml = useMemo(() => sanitizeContentHtml(html), [html])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof Element)) return

    const anchor = target.closest<HTMLAnchorElement>('a[data-internal-path]')
    if (!anchor || !event.currentTarget.contains(anchor)) return

    const internalPath = anchor.dataset.internalPath
    if (!internalPath) return

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey ||
      event.defaultPrevented ||
      anchor.hasAttribute('download') ||
      anchor.target === '_blank'
    ) {
      return
    }

    event.preventDefault()
    navigate(internalPath)
  }

  return (
    <div
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}
