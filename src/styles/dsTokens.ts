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
 * Structured to match the Tailwind color configuration in index.css
 */
export const colors = {
  // logobla-2 - Primary brand color (most used)
  logobla2: {
    bgDefault: ds.color('logobla-2', 'background-default'),
    bgTinted: ds.color('logobla-2', 'background-tinted'),
    surfaceDefault: ds.color('logobla-2', 'surface-default'),
    surfaceTinted: ds.color('logobla-2', 'surface-tinted'),
    surfaceHover: ds.color('logobla-2', 'surface-hover'),
    surfaceActive: ds.color('logobla-2', 'surface-active'),
    borderSubtle: ds.color('logobla-2', 'border-subtle'),
    borderDefault: ds.color('logobla-2', 'border-default'),
    textSubtle: ds.color('logobla-2', 'text-subtle'),
    textDefault: ds.color('logobla-2', 'text-default'),
    baseDefault: ds.color('logobla-2', 'base-default'),
    baseHover: ds.color('logobla-2', 'base-hover'),
    baseActive: ds.color('logobla-2', 'base-active'),
    contrast: ds.color('logobla-2', 'base-contrast-default'),
  },

  // logobla-1 - Secondary brand color
  logobla1: {
    bgDefault: ds.color('logobla-1', 'background-default'),
    bgTinted: ds.color('logobla-1', 'background-tinted'),
    surfaceDefault: ds.color('logobla-1', 'surface-default'),
    surfaceTinted: ds.color('logobla-1', 'surface-tinted'),
    surfaceHover: ds.color('logobla-1', 'surface-hover'),
    surfaceActive: ds.color('logobla-1', 'surface-active'),
    borderSubtle: ds.color('logobla-1', 'border-subtle'),
    borderDefault: ds.color('logobla-1', 'border-default'),
    textSubtle: ds.color('logobla-1', 'text-subtle'),
    textDefault: ds.color('logobla-1', 'text-default'),
    baseDefault: ds.color('logobla-1', 'base-default'),
    baseHover: ds.color('logobla-1', 'base-hover'),
    baseActive: ds.color('logobla-1', 'base-active'),
    contrast: ds.color('logobla-1', 'base-contrast-default'),
  },

  // bla-1 - Support color
  bla1: {
    bgDefault: ds.color('bla-1', 'background-default'),
    bgTinted: ds.color('bla-1', 'background-tinted'),
    surfaceTinted: ds.color('bla-1', 'surface-tinted'),
    borderSubtle: ds.color('bla-1', 'border-subtle'),
    borderDefault: ds.color('bla-1', 'border-default'),
    textSubtle: ds.color('bla-1', 'text-subtle'),
    textDefault: ds.color('bla-1', 'text-default'),
    baseDefault: ds.color('bla-1', 'base-default'),
  },

  // bla-2 - Support color
  bla2: {
    bgDefault: ds.color('bla-2', 'background-default'),
    bgTinted: ds.color('bla-2', 'background-tinted'),
    surfaceTinted: ds.color('bla-2', 'surface-tinted'),
    borderSubtle: ds.color('bla-2', 'border-subtle'),
    borderDefault: ds.color('bla-2', 'border-default'),
    textSubtle: ds.color('bla-2', 'text-subtle'),
    textDefault: ds.color('bla-2', 'text-default'),
  },

  // bla-3 - Support color
  bla3: {
    bgDefault: ds.color('bla-3', 'background-default'),
    bgTinted: ds.color('bla-3', 'background-tinted'),
    surfaceTinted: ds.color('bla-3', 'surface-tinted'),
    borderSubtle: ds.color('bla-3', 'border-subtle'),
    textDefault: ds.color('bla-3', 'text-default'),
  },

  // hvit - White/Light colors
  hvit: {
    bgDefault: ds.color('hvit', 'background-default'),
    surfaceDefault: ds.color('hvit', 'surface-default'),
    surfaceHover: ds.color('hvit', 'surface-hover'),
    borderSubtle: ds.color('hvit', 'border-subtle'),
    borderDefault: ds.color('hvit', 'border-default'),
  },

  // neutral - Neutral grays
  neutral: {
    bgDefault: ds.color('neutral', 'background-default'),
    surfaceDefault: ds.color('neutral', 'surface-default'),
    borderSubtle: ds.color('neutral', 'border-subtle'),
    borderDefault: ds.color('neutral', 'border-default'),
    textSubtle: ds.color('neutral', 'text-subtle'),
    textDefault: ds.color('neutral', 'text-default'),
    baseDefault: ds.color('neutral', 'base-default'),
  },

  // svart - Black/Dark colors
  svart: {
    baseDefault: ds.color('svart', 'base-default'),
    textDefault: ds.color('svart', 'text-default'),
  },
  
  headerBg: '#e6f2f6',
  // Legacy aliases for backwards compatibility (deprecated)
  /** @deprecated Use logobla1.contrast instead */
  headerFg: ds.color('logobla-1', 'base-contrast-default'),
  /** @deprecated Use hvit.surfaceDefault instead */
  surface: ds.color('hvit', 'surface-default'),
  /** @deprecated Use logobla2.surfaceTinted instead */
  surfaceTinted: ds.color('logobla-2', 'surface-tinted'),
  /** @deprecated Use logobla2.surfaceHover instead */
  surfaceHover: ds.color('logobla-2', 'surface-hover'),
  /** @deprecated Use logobla2.surfaceActive instead */
  surfaceActive: ds.color('logobla-2', 'surface-active'),
  /** @deprecated Use logobla2.bgTinted instead */
  backgroundTinted: ds.color('logobla-2', 'background-tinted'),
  /** @deprecated Use logobla2.bgDefault instead */
  backgroundLight: ds.color('logobla-2', 'background-default'),
  /** @deprecated Use neutral.textDefault instead */
  text: ds.color('neutral', 'text-default'),
  /** @deprecated Use neutral.textSubtle instead */
  textSubtle: ds.color('neutral', 'text-subtle'),
  /** @deprecated Use logobla2.textSubtle instead */
  textMuted: ds.color('logobla-2', 'text-subtle'),
  /** @deprecated Use logobla2.borderSubtle instead */
  border: ds.color('logobla-2', 'border-subtle'),
  /** @deprecated Use logobla2.borderSubtle instead */
  borderSubtle: ds.color('logobla-2', 'border-subtle'),
  /** @deprecated Use logobla2.borderDefault instead */
  borderLight: ds.color('logobla-2', 'border-default'),
  /** @deprecated Use logobla2.borderDefault instead */
  borderHover: ds.color('logobla-2', 'border-default'),
  /** @deprecated Use logobla1.baseDefault instead */
  link: ds.color('logobla-1', 'base-default'),
  /** @deprecated Use logobla1.baseHover instead */
  linkHover: ds.color('logobla-1', 'base-hover'),
  /** @deprecated Use logobla1.baseActive instead */
  linkActive: ds.color('logobla-1', 'base-active'),
  /** @deprecated Use logobla1.borderDefault instead */
  focusBorder: ds.color('logobla-1', 'border-default'),
  /** @deprecated Use logobla1.surfaceTinted instead */
  focusShadow: ds.color('logobla-1', 'surface-tinted'),
  /** @deprecated Use logobla2.textSubtle instead */
  iconDefault: ds.color('logobla-2', 'text-subtle'),
} as const
