export function hasVisibleContent(value?: string) {
  if (!value) return false
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .length > 0
}
