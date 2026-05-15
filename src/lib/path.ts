/**
 * Path normalisation utilities shared across the temaside and content routing logic.
 * Ensures trailing slashes are stripped and `/temaside/` prefixes are removed where
 * needed to produce consistent, comparable path strings.
 */
export function normalizePath(path: string) {
  return (path || '/').replace(/\/+$/, '') || '/'
}

export function stripTemasidePrefix(path: string) {
  const normalizedPath = normalizePath(path)

  if (normalizedPath === '/temaside') {
    return '/'
  }

  return normalizedPath.replace(/^\/temaside(?=\/)/, '') || '/'
}
