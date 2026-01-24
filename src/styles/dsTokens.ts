export type DsColorName =
  | 'logobla-1'
  | 'logobla-2'
  | 'hvit'
  | 'bla-1'
  | 'bla-2'
  | 'bla-3'
  | 'gronn-1'
  | 'gronn-2'
  | 'gronn-3'
  | 'gul-1'
  | 'gul-2'
  | 'gul-3'
  | 'lilla-1'
  | 'lilla-2'
  | 'lilla-3'
  | 'svart'
  | 'neutral'

export type DsColorRole =
  | 'background-default'
  | 'background-tinted'
  | 'surface-default'
  | 'surface-tinted'
  | 'surface-hover'
  | 'surface-active'
  | 'border-subtle'
  | 'border-default'
  | 'border-strong'
  | 'text-subtle'
  | 'text-default'
  | 'base-default'
  | 'base-hover'
  | 'base-active'
  | 'base-contrast-subtle'
  | 'base-contrast-default'

/**
 * Minimal helper to avoid typing `var(--ds-...)` everywhere.
 *
 * Usage:
 *  style={{ backgroundColor: ds.color('logobla-1', 'base-default') }}
 */
export const ds = {
  var(name: string) {
    return `var(--ds-${name})`
  },
  color(color: DsColorName, role: DsColorRole) {
    return `var(--ds-color-${color}-${role})`
  },
} as const

/**
 * Optional shortcuts with autocomplete.
 * Prefer semantic names (what it is used for) over raw token names.
 */
export const colors = {
  headerBg: ds.color('logobla-2', 'base-default'),
  headerFg: ds.color('logobla-2', 'base-contrast-default'),

  surface: ds.color('neutral', 'surface-default'),
  surfaceTinted: ds.color('neutral', 'surface-tinted'),
  text: ds.color('neutral', 'text-default'),
  textSubtle: ds.color('neutral', 'text-subtle'),

  border: ds.color('neutral', 'border-default'),
  borderSubtle: ds.color('neutral', 'border-subtle'),

  link: ds.color('bla-1', 'text-default'),
  linkHover: ds.color('bla-1', 'base-hover'),
} as const
