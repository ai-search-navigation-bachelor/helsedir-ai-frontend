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
