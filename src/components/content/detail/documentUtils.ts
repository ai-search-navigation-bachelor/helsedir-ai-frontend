import type {
  ContentLink,
  ContentDetail,
  NestedContent,
  NestedContentLink,
  RelatedContentLink,
} from '../../../types'
import { getApiContentInternalPath } from '../../../lib/contentLinking'

interface DocumentLink {
  href: string
  label: string
  isPdf: boolean
}

interface RelatedDisplayLink {
  href: string
  label: string
  isDocument: boolean
  isPdf: boolean
  fileType?: string
  openInNewTab: boolean
  internalPath?: string
}

interface AttachmentLike {
  href?: string
  url?: string
  fil?: string
  fileUri?: string
  tittel?: string
  title?: string
  fileName?: string
  type?: string
  contentType?: string
  file_type?: string | null
  fileType?: string | null
}

interface DocumentSource {
  data?: NestedContent['data']
  document_url?: string | null
  url?: string
  links?: ContentLink[] | NestedContentLink[]
  lenker?: NestedContentLink[]
  attachments?: AttachmentLike[] | null
  ehelsestandard_fields?: ContentDetail['ehelsestandard_fields']
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

function hasRelatedDocumentMetadata(link: RelatedContentLink) {
  return Boolean(link.is_document) || isLikelyPdfType(link.file_type || '')
}

function getSafeRelatedHref(rawHref: string) {
  const href = rawHref.trim()
  if (!href || href.startsWith('//')) return null

  if (href.startsWith('/')) {
    return href
  }

  try {
    const parsed = new URL(href)
    return /^https?:$/i.test(parsed.protocol) ? href : null
  } catch {
    return null
  }
}

function getInternalContentPath(href: string, isDocument: boolean) {
  if (isDocument) return undefined

  return getApiContentInternalPath(href)
}

function getFilenameFromHref(href?: string) {
  if (!href) return null

  try {
    const parsed = new URL(href, 'https://www.helsedirektoratet.no')
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop()
    if (!lastSegment) return null
    return decodeURIComponent(lastSegment)
  } catch {
    const [pathname] = href.split(/[?#]/)
    const lastSegment = pathname.split('/').filter(Boolean).pop()
    if (!lastSegment) return null
    try {
      return decodeURIComponent(lastSegment)
    } catch {
      return lastSegment
    }
  }
}

function resolveLabel(label: string | undefined, isPdf: boolean, href?: string) {
  if (label && label.trim().length > 0) {
    const trimmed = label.trim()
    try {
      return decodeURIComponent(trimmed)
    } catch {
      return trimmed
    }
  }
  if (isPdf) {
    const filename = getFilenameFromHref(href)
    if (filename) return filename
  }
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
    label: resolveLabel(label, pdfFromUrl || pdfFromMeta, trimmedHref),
    isPdf: pdfFromUrl || pdfFromMeta,
  } satisfies DocumentLink
}

export function getRelatedLinks(source?: { related_links?: RelatedContentLink[] | null } | null) {
  const result: RelatedDisplayLink[] = []
  const seen = new Set<string>()

  for (const link of source?.related_links ?? []) {
    const href = link.url ? getSafeRelatedHref(link.url) : null
    if (!href || seen.has(href)) continue

    seen.add(href)

    const isPdf = isLikelyPdfUrl(href) || isLikelyPdfType(link.file_type || '')
    const isDocument = hasRelatedDocumentMetadata(link) || isPdf
    const internalPath = getInternalContentPath(href, isDocument)

    result.push({
      href,
      label: link.title?.trim() || (isPdf ? (getFilenameFromHref(href) || 'Åpne PDF i ny fane') : 'Åpne lenke'),
      isDocument,
      isPdf,
      fileType: link.file_type?.trim() || undefined,
      openInNewTab: link.target?.trim() === '_blank' || isDocument,
      internalPath,
    })
  }

  return result
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
        attachment.href || attachment.url || attachment.fil || attachment.fileUri,
        attachment.tittel || attachment.title || attachment.fileName,
        'vedlegg',
        attachment.type || attachment.contentType || attachment.file_type || attachment.fileType || undefined,
      ),
    )
    .filter((item): item is DocumentLink => Boolean(item))
}

export function getDocumentLinks(source?: DocumentSource | null, fallbackLinks?: ContentLink[]) {
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
  extractFromAttachments(source?.ehelsestandard_fields?.attachments).forEach(pushUnique)
  extractFromLinks(fallbackLinks).forEach(pushUnique)

  return result
}
