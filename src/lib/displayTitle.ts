type DisplayTitleSource = {
  display_title?: string | null
  short_title?: string | null
  kortTittel?: string | null
  title?: string | null
  tittel?: string | null
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

export function getDisplayTitle(source?: DisplayTitleSource | null, fallback = '') {
  return (
    firstNonEmpty([
      source?.display_title,
      source?.short_title,
      source?.kortTittel,
      source?.tittel,
      source?.title,
    ]) ?? fallback
  )
}
