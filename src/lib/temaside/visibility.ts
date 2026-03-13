type ThemeVisibilityMeta = {
  should_display?: boolean
  has_body_content?: boolean
  has_linked_content?: boolean
  has_children?: boolean
  child_count?: number
}

export function shouldDisplayTemasideNode(node: ThemeVisibilityMeta) {
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
