/**
 * Build a frontend URL for a content item.
 *
 * Uses the canonical `path` field from the backend when available
 * (e.g. "/retningslinjer/adhd" or "/tilskudd-og-finansiering/finansiering").
 * Falls back to `/content/:id` when no path is present.
 */
export function buildContentUrl(result: { path?: string | null; id: string }): string {
  if (result.path) {
    return result.path
  }
  return `/content/${result.id}`
}
