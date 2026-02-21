/**
 * Content category groups for path-based routing.
 *
 * Each group maps a URL path prefix (e.g. "retningslinjer") to the set of
 * backend info_type values whose content lives under that prefix, plus a
 * human-readable label and the corresponding SEARCH_MAIN_CATEGORIES id used
 * for the search page tab.
 *
 * Path prefixes must match the first segment of the `path` column in the
 * backend database (originally from helsedirektoratet.no URLs).
 *
 * NOTE: Temaside paths (forebygging-diagnose-og-behandling, digitalisering-og-e-helse,
 * etc.) are routed separately via TEMASIDE_CATEGORIES and are NOT included here.
 */

import type { SearchMainCategoryId } from './categories'

export interface ContentCategoryGroup {
  /** URL path prefix, e.g. "retningslinjer" — used as /:pathPrefix/* route */
  pathPrefix: string
  /** Display label for landing pages */
  label: string
  /** Short subtitle shown on the category landing page */
  subtitle: string
  /** Matching SEARCH_MAIN_CATEGORIES id for search tab linking */
  searchCategoryId: SearchMainCategoryId
  /** Backend info_type values that belong under this path prefix */
  infoTypes: readonly string[]
}

export const CONTENT_CATEGORY_GROUPS: readonly ContentCategoryGroup[] = [
  {
    pathPrefix: 'retningslinjer',
    label: 'Retningslinjer',
    subtitle: 'Nasjonale faglige retningslinjer og veiledere',
    searchCategoryId: 'retningslinjer',
    infoTypes: [
      'retningslinje',
      'nasjonal-veileder',
      'prioriteringsveileder',
      'normen-dokument',
    ],
  },
  {
    pathPrefix: 'nasjonale-forlop',
    label: 'Nasjonale forløp',
    subtitle: 'Pakkeforløp og nasjonale pasientforløp',
    searchCategoryId: 'retningslinjer',
    infoTypes: [
      'nasjonalt-forlop',
      'pakkeforlop-anbefaling',
    ],
  },
  {
    pathPrefix: 'faglige-rad',
    label: 'Faglige råd',
    subtitle: 'Nasjonale faglige råd og anbefalinger',
    searchCategoryId: 'faglige-rad',
    infoTypes: [
      'faglig-rad',
      'anbefaling',
      'rad',
      'pico',
    ],
  },
  {
    pathPrefix: 'veiledere',
    label: 'Veiledere',
    subtitle: 'Veiledere, veivisere og e-helsestandarder',
    searchCategoryId: 'veiledere',
    infoTypes: [
      'veileder',
      'veiledning',
      'veiviser',
      'ehelsestandard',
      'takst-med-merknad',
      'tilskudd',
    ],
  },
  {
    pathPrefix: 'rundskriv',
    label: 'Rundskriv',
    subtitle: 'Rundskriv fra Helsedirektoratet',
    searchCategoryId: 'rundskriv',
    infoTypes: [
      'rundskriv',
    ],
  },
  {
    pathPrefix: 'lovfortolkning',
    label: 'Lovfortolkning',
    subtitle: 'Lovfortolkninger, regelverk og kommentarer',
    searchCategoryId: 'lovfortolkning',
    infoTypes: [
      'lovfortolkning',
      'lov-eller-forskriftstekst-med-kommentar',
      'regelverk-lov-eller-forskrift',
      'veileder-lov-forskrift',
      'paragraf-med-kommentar',
    ],
  },
  {
    pathPrefix: 'statistikk',
    label: 'Statistikk og rapporter',
    subtitle: 'Statistikk, registre og rapporter',
    searchCategoryId: 'statistikk-og-rapporter',
    infoTypes: [
      'rapport',
      'statistikkelement',
      'statistikk',
    ],
  },
]

/**
 * Additional path prefixes that exist in the backend but don't have
 * a dedicated landing page. These get content-only routes (no index page).
 */
export const CONTENT_ONLY_PREFIXES: readonly string[] = [
  'rapporter',
  'referanse',
  'normen',
  'standarder',
  'tilskudd',
  'konferanser',
  'nyheter',
  'horinger',
  'om-oss',
  'english',
  'nasjonale-krav-og-anbefalinger',
]

/** Set of all content category path prefixes for quick lookup */
export const CONTENT_CATEGORY_PREFIXES = new Set(
  CONTENT_CATEGORY_GROUPS.map((g) => g.pathPrefix),
)

/** All info_types covered by content category groups */
export const ALL_CONTENT_INFO_TYPES = new Set(
  CONTENT_CATEGORY_GROUPS.flatMap((g) => g.infoTypes),
)

export function getContentCategoryGroup(
  pathPrefix: string,
): ContentCategoryGroup | undefined {
  return CONTENT_CATEGORY_GROUPS.find((g) => g.pathPrefix === pathPrefix)
}

/** Find which content category group an info_type belongs to */
export function getContentCategoryByInfoType(
  infoType: string,
): ContentCategoryGroup | undefined {
  return CONTENT_CATEGORY_GROUPS.find((g) => g.infoTypes.includes(infoType))
}
