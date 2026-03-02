/**
 * Category constants for search functionality
 */

export const SEARCH_MAIN_CATEGORIES = [
  {
    id: 'retningslinjer',
    label: 'Retningslinjer',
    subcategoryIds: [
      'retningslinje',
    ],
  },
  {
    id: 'faglige-rad',
    label: 'Faglige råd',
    subcategoryIds: ['anbefaling', 'rad', 'faglig-rad', 'pico', 'nasjonalt-forlop', 'pakkeforlop-anbefaling'],
  },
  {
    id: 'veiledere',
    label: 'Veiledere og standarder',
    subcategoryIds: [
      'nasjonal-veileder',
      'veileder',
      'veiledning',
      'veiviser',
      'prioriteringsveileder',
      'normen-dokument',
      'ehelsestandard',
      'takst-med-merknad',
      'tilskudd',
    ],
  },
  {
    id: 'regelverk',
    label: 'Regelverk',
    subcategoryIds: [
      'lov-eller-forskriftstekst-med-kommentar',
      'lovfortolkning',
      'regelverk-lov-eller-forskrift',
      'veileder-lov-forskrift',
      'paragraf-med-kommentar',
      'rundskriv',
    ],
  },
  {
    id: 'statistikk-og-rapporter',
    label: 'Statistikk og rapporter',
    subcategoryIds: ['rapport', 'statistikkelement', 'statistikk'],
  },
  {
    id: 'temaside',
    label: 'Temasider',
    subcategoryIds: ['temaside'],
  },
] as const

export type SearchMainCategory = (typeof SEARCH_MAIN_CATEGORIES)[number]
export type SearchMainCategoryId = SearchMainCategory['id']
export type SearchSubcategoryId = SearchMainCategory['subcategoryIds'][number]

export const SEARCH_SUBCATEGORY_LABELS: Record<SearchSubcategoryId, string> = {
  retningslinje: 'Nasjonal faglig retningslinje',
  'nasjonalt-forlop': 'Nasjonalt forløp',
  'pakkeforlop-anbefaling': 'Pakkeforløp-anbefaling',
  'normen-dokument': 'Normen-dokument',
  'nasjonal-veileder': 'Nasjonal veileder',
  prioriteringsveileder: 'Prioriteringsveileder',
  anbefaling: 'Anbefaling',
  rad: 'Råd',
  'faglig-rad': 'Nasjonale faglige råd',
  pico: 'Pico',
  'takst-med-merknad': 'Takst med merknad',
  veiviser: 'Veiviser',
  ehelsestandard: 'Nasjonal e-helsestandard',
  tilskudd: 'Tilskudd',
  veileder: 'Veileder',
  veiledning: 'Veiledning',
  rundskriv: 'Rundskriv',
  'lov-eller-forskriftstekst-med-kommentar': 'Lov- eller forskriftstekst med kommentar',
  lovfortolkning: 'Lovfortolkning',
  'regelverk-lov-eller-forskrift': 'Regelverk (lov eller forskrift)',
  'veileder-lov-forskrift': 'Veileder til lov og forskrift',
  'paragraf-med-kommentar': 'Paragraf med kommentar',
  rapport: 'Rapport',
  statistikkelement: 'Statistikkelement',
  statistikk: 'Statistikk',
  temaside: 'Temaside',
}

const MAIN_CATEGORY_BY_SUBCATEGORY = SEARCH_MAIN_CATEGORIES.reduce(
  (acc, category) => {
    category.subcategoryIds.forEach((subcategoryId) => {
      acc[subcategoryId] = category.id
    })
    return acc 
  },
  {} as Record<string, SearchMainCategoryId>,
)

export function getMainCategoryBySubcategory(
  subcategoryId: string,
): SearchMainCategoryId | undefined {
  return MAIN_CATEGORY_BY_SUBCATEGORY[subcategoryId]
}

