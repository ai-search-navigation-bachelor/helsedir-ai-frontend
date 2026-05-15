/**
 * Visibility rules for temaside (theme page) nodes.
 *
 * The API may return nodes that should not be shown to users (e.g. pages
 * marked with the "no_content" tag or pages with no body, children, or
 * linked content). Nodes tagged "no_content" are an exception — they are
 * shown but displayed as inactive (greyed out) links so users can see the
 * structure even when content is not yet available.
 */
type ThemeVisibilityMeta = {
  should_display?: boolean
  has_body_content?: boolean
  has_linked_content?: boolean
  has_children?: boolean
  child_count?: number
  tags?: string[]
}

export function isInactiveTemasideNode(node: ThemeVisibilityMeta) {
  return Boolean(node.tags?.includes('no_content'))
}

export function shouldDisplayTemasideNode(node: ThemeVisibilityMeta) {
  if (isInactiveTemasideNode(node)) {
    return true
  }

  if (typeof node.should_display === 'boolean') {
    return node.should_display
  }

  const hasMetadata =
    typeof node.has_body_content === 'boolean' ||
    typeof node.has_linked_content === 'boolean' ||
    typeof node.has_children === 'boolean' ||
    typeof node.child_count === 'number'

  if (!hasMetadata) {
    return true
  }

  return Boolean(
    node.has_body_content ||
    node.has_linked_content ||
    node.has_children ||
    (node.child_count ?? 0) > 0,
  )
}
