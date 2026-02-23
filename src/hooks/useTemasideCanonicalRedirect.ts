import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { isTemasideContentType, normalizeContentType } from '../constants/content'
import { getTemasideCategoryPathFromContentLinks } from '../lib/content/breadcrumbUtils'
import { useThemePagesQuery } from './queries/useThemePagesQuery'
import type { ContentDetail } from '../types'

/**
 * If the given content is a temaside and has a canonical path in the
 * theme-pages tree, redirects to that path (replacing history entry).
 */
export function useTemasideCanonicalRedirect(content: ContentDetail | undefined) {
  const navigate = useNavigate()
  const location = useLocation()

  const isTemasideContent = isTemasideContentType(normalizeContentType(content?.content_type))
  const categoryPath = getTemasideCategoryPathFromContentLinks(content?.links)
  const categorySlug = categoryPath?.slice(1) || undefined

  const { data: themePagesData } = useThemePagesQuery(categorySlug, {
    enabled: Boolean(isTemasideContent && content?.id),
  })

  const canonicalPath =
    isTemasideContent && content?.id && themePagesData
      ? (themePagesData.results.find((r) => r.id === content.id)?.path ?? null)
      : null

  useEffect(() => {
    if (!canonicalPath) return
    navigate(canonicalPath, { replace: true, state: location.state })
  }, [canonicalPath, location.state, navigate])
}
