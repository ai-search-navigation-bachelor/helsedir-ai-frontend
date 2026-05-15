/** Returns true if the given string contains visible text after stripping HTML tags and whitespace. */
export function hasVisibleContent(value?: string) {
  if (!value) return false
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .trim()
    .length > 0
}
