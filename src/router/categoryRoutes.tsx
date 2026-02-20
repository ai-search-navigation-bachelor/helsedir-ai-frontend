import { Navigate, useParams } from 'react-router-dom'
import { ContentDetail, TemasideHubPage } from '../pages'
import type { TemasideCategorySlug } from '../constants/temasider'

function isLikelyContentId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/^\d{4}-\d{4}-[a-z0-9-]{8,}$/i.test(trimmed)) return true
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(trimmed)) return true
  return false
}

/**
 * Handles /:categorySlug/:id — renders ContentDetail if the id looks like a
 * content ID, otherwise renders the TemasideHubPage for that sub-path.
 */
export function CategoryContentOrHubRoute({ categorySlug }: { categorySlug: TemasideCategorySlug }) {
  const params = useParams()
  const id = (params.id || '').trim()

  if (isLikelyContentId(id)) {
    return <ContentDetail />
  }

  return <TemasideHubPage categorySlugOverride={categorySlug} />
}

/**
 * Redirects legacy /:categorySlug/content/:id URLs to /:categorySlug/:id.
 */
export function LegacyCategoryContentRedirect({ categorySlug }: { categorySlug: TemasideCategorySlug }) {
  const params = useParams()
  const id = (params.id || '').trim()

  if (!id) {
    return <Navigate to={`/${categorySlug}`} replace />
  }

  return <Navigate to={`/${categorySlug}/${id}`} replace />
}
