/**
 * Maps raw {@link NestedContent} objects from the Helsedirektoratet external API
 * to the normalised {@link ContentDetail} shape used internally by the app.
 *
 * The external API uses Norwegian field names (tittel, tekst, lenker) and a
 * looser link structure than the backend. This mapper bridges the gap so the
 * rest of the codebase can work with a single content type regardless of source.
 */
import type { ContentDetail, ContentLink, NestedContent, RelatedContentLink } from '../../types'
import { normalizeContentType } from '../../constants/content'

export function toContentLinks(source: NestedContent): ContentLink[] {
  const rawLinks = [...(source.links ?? []), ...(source.lenker ?? [])]
  const seen = new Set<string>()
  const result: ContentLink[] = []

  for (const link of rawLinks) {
    const href = link.href?.trim()
    if (!href || seen.has(href)) continue
    seen.add(href)
    result.push({
      rel: link.rel || 'related',
      type: link.type || 'link',
      title: link.title || link.tittel || 'Lenke',
      href,
      strukturId: undefined,
    })
  }

  return result
}

function toRelatedLinks(source: NestedContent): RelatedContentLink[] | null {
  if (source.related_links && source.related_links.length > 0) {
    return source.related_links
  }

  const rawLinks = [...(source.links ?? []), ...(source.lenker ?? [])]
  const seen = new Set<string>()
  const result: RelatedContentLink[] = []

  for (const link of rawLinks) {
    const href = link.href?.trim()
    if (!href || seen.has(href)) continue
    if (['root', 'publikasjon', 'temaside', 'forelder', 'barn'].includes(link.rel || '')) continue

    seen.add(href)
    const title = link.title || link.tittel || 'Lenke'
    const isDocument = /pdf|vedlegg|fil|dokument/i.test(link.rel || '') || /\.pdf(?:$|[?#])/i.test(href)

    result.push({
      title,
      url: href,
      is_document: isDocument,
      file_type: /\.pdf(?:$|[?#])/i.test(href) ? 'PDF' : (link.type || null),
      url_type: null,
      target: null,
    })
  }

  return result.length > 0 ? result : null
}

export function mapHelsedirContentToDetail(source: NestedContent): ContentDetail {
  const contentType = normalizeContentType(
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    'innhold',
  )
  const normalizedDocumentUrl = source.document_url?.trim()

  return {
    id: source.id,
    title: source.tittel || source.title || source.id,
    body: source.tekst || source.body || '',
    content_type: contentType,
    path: source.path,
    has_text_content: source.has_text_content,
    document_url:
      normalizedDocumentUrl ||
      (typeof source.data?.fil === 'string' ? source.data.fil : null),
    is_pdf_only: source.is_pdf_only,
    related_links: toRelatedLinks(source),
    status: source.status,
    first_published: source.forstPublisert,
    last_reviewed_date: source.sistFagligOppdatert || source.sistOppdatert,
    url: source.url,
    links: toContentLinks(source),
  }
}

export function getNormalizedHelsedirType(source: NestedContent) {
  return normalizeContentType(
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    '',
  )
}
