import { stripTemasidePrefix } from './path'

/**
 * Build a frontend URL for a content item.
 *
 * Uses the `path` field from the backend when available (e.g. "/retningslinjer/adhd"),
 * stripping the "/temaside" prefix for temaside content so the URL matches the
 * existing temaside routing. Falls back to `/content/:id` when no path is present.
 */
export function buildContentUrl(result: { path?: string; id: string }): string {
  if (result.path) {
    return stripTemasidePrefix(result.path)
  }
  return `/content/${result.id}`
}
