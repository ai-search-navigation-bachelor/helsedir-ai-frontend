/**
 * HTML sanitisation and link rewriting for content from the Helsedirektoratet API.
 *
 * Raw HTML from the API may contain api.helsedirektoratet.no hrefs that should
 * resolve to internal React Router routes. This module sanitises the HTML with
 * DOMPurify and rewrites those anchors before they are rendered.
 */
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
