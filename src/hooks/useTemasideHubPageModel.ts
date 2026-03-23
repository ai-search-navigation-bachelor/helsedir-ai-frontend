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
import { isInactiveTemasideNode, shouldDisplayTemasideNode } from '../lib/temaside/visibility'
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

    const visibleThemePages = themePagesData.results.filter(shouldDisplayTemasideNode)
    const metaByPath: Record<string, {
      title?: string
      contentId?: string
      isInactive?: boolean
      hasBodyContent?: boolean
      hasLinkedContent?: boolean
      hasChildren?: boolean
      childCount?: number
      shouldDisplay?: boolean
    }> = {}
    const paths = visibleThemePages.map((result) => {
      const normalizedPath = normalizeTemasidePath(result.path)
      const isInactiveThemePage = result.info_type === 'temaside' && isInactiveTemasideNode(result)
      metaByPath[normalizedPath] = {
        title: result.title,
        contentId: result.id,
        isInactive: isInactiveThemePage,
        hasBodyContent: result.has_body_content,
        hasLinkedContent: result.has_linked_content,
        hasChildren: result.has_children,
        childCount: result.child_count,
        shouldDisplay: result.should_display,
      }
      return normalizedPath
    })

    if (category && !paths.includes(category.path)) {
      paths.push(category.path)
    }

    return buildThemeTree(paths, metaByPath)
  }, [category, themePagesData])

  const node = useMemo(() => (tree ? findNodeByPath(tree, temaPath) : null), [temaPath, tree])
  const nodeByPath = useMemo(() => buildNodeByPathLookup(tree), [tree])

  const customLayout = node ? CUSTOM_TEMASIDE_LAYOUTS[node.path] : undefined
  const shouldForceFlat = node ? FORCE_FLAT_CATEGORIES.includes(node.path) : false
  const contentId = node?.contentId ?? null
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

  const isHubPath = temaPath.split('/').filter(Boolean).length <= 1
  const breadcrumbItems = useMemo(
    () => sanitizeTemasideBreadcrumbItems(isHubPath ? generatedBreadcrumbItems : (trailByPath[temaPath] || generatedBreadcrumbItems)),
    [generatedBreadcrumbItems, isHubPath, temaPath, trailByPath],
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
    contentId,
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
