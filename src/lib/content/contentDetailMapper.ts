import type { ContentDetail, ContentLink, NestedContent } from '../../types'

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

export function mapHelsedirContentToDetail(source: NestedContent): ContentDetail {
  const contentType =
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    'innhold'
  const normalizedDocumentUrl = source.document_url?.trim()

  return {
    id: source.id,
    title: source.tittel || source.title || source.id,
    body: source.tekst || source.body || '',
    content_type: contentType,
    has_text_content: source.has_text_content,
    document_url:
      normalizedDocumentUrl ||
      (typeof source.data?.fil === 'string' ? source.data.fil : null),
    is_pdf_only: source.is_pdf_only,
    first_published: source.forstPublisert,
    last_reviewed_date: source.sistFagligOppdatert || source.sistOppdatert,
    links: toContentLinks(source),
  }
}

export function getNormalizedHelsedirType(source: NestedContent) {
  return (
    source.type?.trim().toLowerCase() ||
    source.tekniskeData?.infoType?.trim().toLowerCase() ||
    ''
  )
}
