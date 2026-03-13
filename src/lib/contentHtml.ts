import DOMPurify from 'dompurify'
import { getApiContentInternalPath } from './contentLinking'

function rewriteApiContentAnchors(html: string) {
  if (!html || typeof DOMParser === 'undefined') {
    return html
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  document.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href')
    const internalPath = getApiContentInternalPath(href)

    if (!internalPath) return

    anchor.setAttribute('href', internalPath)
    anchor.setAttribute('data-internal-path', internalPath)
    anchor.removeAttribute('target')
    anchor.removeAttribute('rel')
  })

  return document.body.innerHTML
}

export function sanitizeContentHtml(html?: string) {
  const sanitizedHtml = DOMPurify.sanitize(html ?? '')
  return rewriteApiContentAnchors(sanitizedHtml)
}
