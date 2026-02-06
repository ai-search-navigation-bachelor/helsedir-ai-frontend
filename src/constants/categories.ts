/**
 * Category constants for search functionality
 */

export const TEMASIDE_CATEGORY = 'temaside'
export const RETNINGSLINJE_CATEGORY = 'retningslinje'
export const ANBEFALINGER_CATEGORY = 'anbefaling'
export const REGELVERK_CATEGORY = 'regelverk-lov-eller-forskrift'
export const RAD_CATEGORY = 'veileder-lov-forskrift'

/**
 * The 5 categories we want to display in order
 */
export const CATEGORY_ORDER = [
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
  ANBEFALINGER_CATEGORY,
  REGELVERK_CATEGORY,
  RAD_CATEGORY,
]

/**
 * Available tema filters
 */
export const TEMA_OPTIONS = [
  { value: 'diagnose-og-behandling', label: 'Diagnose og behandling' },
  { value: 'psykisk-helse-rus-avhengighet', label: 'Psykisk helse, rus og avhengighet' },
  { value: 'forebygging-og-levevaner', label: 'Forebygging og levevaner' },
  { value: 'svangerskap-fodsel-barsel', label: 'Svangerskap, fødsel og barsel' },
  { value: 'organisering-og-tjenestetilbud', label: 'Organisering og tjenestetilbud' },
  { value: 'digitalisering-og-e-helse', label: 'Digitalisering og e-helse' },
  { value: 'lov-og-forskrift', label: 'Lov og forskrift' },
  { value: 'helseberedskap', label: 'Helseberedskap' },
  { value: 'autorisasjon-og-spesialistutdanning', label: 'Autorisasjon og spesialistutdanning' },
  { value: 'tilskudd-og-finansiering', label: 'Tilskudd og finansiering' },
] as const
