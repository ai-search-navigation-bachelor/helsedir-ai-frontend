import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CUSTOM_TEMASIDE_LAYOUTS,
  FORCE_FLAT_CATEGORIES,
} from '../components/content/temaside/customLayouts'
import { getTemasideCategoryBySlug, type TemasideCategorySlug } from '../constants/temasider'
import { useThemePagesQuery } from './queries/useThemePagesQuery'
import { buildThemeTree, findNodeByPath } from '../lib/temaside/temasiderTree'
import {
  buildHubSections,
  buildNodeByPathLookup,
  buildTemasideBreadcrumbItems,
  buildTemasidePath,
  compactDetailBreadcrumbItems,
  countHubLinks,
  filterHubSectionsByQuery,
  normalizeTemasidePath,
  sanitizeTemasideBreadcrumbItems,
} from '../lib/temaside/hubUtils'
import { useTemasideBreadcrumbStore } from '../stores'

export function useTemasideHubPageModel(
  categorySlugOverride?: TemasideCategorySlug,
  subPathOverride?: string,
) {
  const params = useParams()
  const categorySlug = (categorySlugOverride || params.category || '').trim().toLowerCase()
  const subPath = subPathOverride ?? params['*'] ?? ''
  const temaPath = useMemo(
    () => buildTemasidePath(categorySlug, subPath),
    [categorySlug, subPath],
  )
  const [query, setQuery] = useState('')

  const category = getTemasideCategoryBySlug(categorySlug)
  const categoryIcon = category?.iconSrc
  const trailByPath = useTemasideBreadcrumbStore((state) => state.trailByPath)
  const setTrail = useTemasideBreadcrumbStore((state) => state.setTrail)

  const { data: themePagesData, isLoading, isError, error } = useThemePagesQuery(categorySlug, {
    enabled: Boolean(category),
  })

  const tree = useMemo(() => {
    if (!themePagesData) {
      return null
    }

    const titleByPath: Record<string, string> = {}
    const paths = themePagesData.results.map((result) => {
      const normalizedPath = normalizeTemasidePath(result.path)
      titleByPath[normalizedPath] = result.title
      return normalizedPath
    })

    if (category && !paths.includes(category.path)) {
      paths.push(category.path)
    }

    return buildThemeTree(paths, titleByPath)
  }, [category, themePagesData])

  const node = useMemo(() => (tree ? findNodeByPath(tree, temaPath) : null), [temaPath, tree])
  const nodeByPath = useMemo(() => buildNodeByPathLookup(tree), [tree])

  const customLayout = node ? CUSTOM_TEMASIDE_LAYOUTS[node.path] : undefined
  const shouldForceFlat = node ? FORCE_FLAT_CATEGORIES.includes(node.path) : false
  const isFlatStructure = Boolean(
    node && (shouldForceFlat || node.children.every((child) => child.children.length === 0)),
  )
  const isHub = Boolean(node && node.children.length > 0)

  const sections = useMemo(
    () =>
      node
        ? buildHubSections(
            node,
            customLayout,
            isFlatStructure,
            shouldForceFlat,
            (path) => nodeByPath.get(path),
          )
        : [],
    [customLayout, isFlatStructure, node, nodeByPath, shouldForceFlat],
  )

  const visibleSections = useMemo(() => filterHubSectionsByQuery(sections, query), [query, sections])
  const totalLinks = countHubLinks(sections)
  const visibleLinks = countHubLinks(visibleSections)

  const generatedBreadcrumbItems = useMemo(
    () => buildTemasideBreadcrumbItems(temaPath, nodeByPath, category?.title),
    [category?.title, nodeByPath, temaPath],
  )

  const breadcrumbItems = useMemo(
    () => sanitizeTemasideBreadcrumbItems(trailByPath[temaPath] || generatedBreadcrumbItems),
    [generatedBreadcrumbItems, temaPath, trailByPath],
  )

  const buildTrailForLinkedPath = useCallback(
    (path: string) =>
      compactDetailBreadcrumbItems(buildTemasideBreadcrumbItems(path, nodeByPath, category?.title)),
    [category?.title, nodeByPath],
  )

  const onOpenLinkedPath = useCallback(
    (path: string) => {
      setTrail(path, buildTrailForLinkedPath(path))
    },
    [buildTrailForLinkedPath, setTrail],
  )

  useEffect(() => {
    if (generatedBreadcrumbItems.length > 1) {
      setTrail(temaPath, generatedBreadcrumbItems)
    }
  }, [generatedBreadcrumbItems, setTrail, temaPath])

  return {
    breadcrumbItems,
    category,
    categoryIcon,
    customLayout,
    error,
    isError,
    isFlatStructure,
    isHub,
    isLoading,
    node,
    onOpenLinkedPath,
    query,
    setQuery,
    temaPath,
    totalLinks,
    visibleLinks,
    visibleSections,
  }
}
