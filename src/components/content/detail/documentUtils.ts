import type { ContentLink, NestedContent, NestedContentLink } from '../../../types'

interface DocumentLink {
  href: string
  label: string
  isPdf: boolean
}

interface AttachmentLike {
  href?: string
  url?: string
  fil?: string
  tittel?: string
  title?: string
  type?: string
  contentType?: string
}

function isLikelyPdfUrl(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url)
}

export function isHelsedirektoratetPdfUrl(url: string) {
  const isPdf = isLikelyPdfUrl(url)
  if (!isPdf) return false

  try {
    const parsed = new URL(url)
    return /(^|\.)helsedirektoratet\.no$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

function isLikelyDocumentRelation(rel: string) {
  return /pdf|vedlegg|fil|dokument/i.test(rel)
}

function isLikelyPdfType(type: string) {
  return /pdf/i.test(type)
}

function resolveLabel(label: string | undefined, isPdf: boolean) {
  if (label && label.trim().length > 0) return label.trim()
  return isPdf ? 'Åpne PDF i ny fane' : 'Åpne dokument i ny fane'
}

export function asDocumentLink(
  href: string | undefined,
  label?: string,
  rel?: string,
  type?: string,
) {
  if (!href) return null
  const trimmedHref = href.trim()
  if (!trimmedHref) return null

  const pdfFromUrl = isLikelyPdfUrl(trimmedHref)
  const pdfFromMeta = isLikelyPdfType(type || '')
  const hasDocumentRel = isLikelyDocumentRelation(rel || '')
  const isDocument = pdfFromUrl || pdfFromMeta || hasDocumentRel

  if (!isDocument) return null

  return {
    href: trimmedHref,
    label: resolveLabel(label, pdfFromUrl || pdfFromMeta),
    isPdf: pdfFromUrl || pdfFromMeta,
  } satisfies DocumentLink
}

function getLinkTitle(link: ContentLink | NestedContentLink): string | undefined {
  return 'title' in link ? link.title : link.tittel
}

function extractFromLinks(links: Array<ContentLink | NestedContentLink> | undefined) {
  return (links ?? [])
    .map((link) => asDocumentLink(link.href ?? undefined, getLinkTitle(link), link.rel, link.type))
    .filter((item): item is DocumentLink => Boolean(item))
}

function extractFromAttachments(attachments: AttachmentLike[] | null | undefined) {
  return (attachments ?? [])
    .map((attachment) =>
      asDocumentLink(
        attachment.href || attachment.url || attachment.fil,
        attachment.tittel || attachment.title,
        'vedlegg',
        attachment.type || attachment.contentType,
      ),
    )
    .filter((item): item is DocumentLink => Boolean(item))
}

export function getDocumentLinks(source?: NestedContent | null, fallbackLinks?: ContentLink[]) {
  if (!source && (!fallbackLinks || fallbackLinks.length === 0)) return []

  const result: DocumentLink[] = []
  const seen = new Set<string>()

  const pushUnique = (item: DocumentLink) => {
    if (seen.has(item.href)) return
    seen.add(item.href)
    result.push(item)
  }

  const dataFile = asDocumentLink(source?.data?.fil as string | undefined, undefined, 'fil')
  if (dataFile) pushUnique(dataFile)

  const backendDocumentUrl = asDocumentLink(source?.document_url || undefined, undefined, 'fil')
  if (backendDocumentUrl) pushUnique(backendDocumentUrl)

  const directUrl = asDocumentLink(source?.url, undefined, 'url')
  if (directUrl) pushUnique(directUrl)

  extractFromLinks(source?.links).forEach(pushUnique)
  extractFromLinks(source?.lenker).forEach(pushUnique)
  extractFromAttachments(source?.attachments).forEach(pushUnique)
  extractFromLinks(fallbackLinks).forEach(pushUnique)

  return result
}
