import { useMemo } from 'react'
import { useThemePagesQuery } from './useThemePagesQuery'
import { shouldDisplayTemasideNode } from '../../lib/temaside/visibility'

/**
 * Returns a Map from temaside content ID to its canonical path.
 * Shared by SearchShell (suggestion navigation) and SearchResultsList (card links).
 */
export function useTemasidePathMap(): Map<string, string> {
  const { data: themePagesData } = useThemePagesQuery()

  return useMemo(() => {
    const map = new Map<string, string>()
    const pages = (themePagesData?.results ?? []).filter(shouldDisplayTemasideNode)

    pages.forEach((page) => {
      const id = page.id?.trim()
      const path = page.path?.trim()
      if (!id || !path) return
      map.set(id, path)
    })

    return map
  }, [themePagesData?.results])
}
