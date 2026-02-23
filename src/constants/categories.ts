/**
 * Category constants for search functionality
 */

export const SEARCH_MAIN_CATEGORIES = [
  {
    id: 'retningslinjer',
    label: 'Retningslinje',
    subcategoryIds: [
      'retningslinje',
      'nasjonalt-forlop',
      'pakkeforlop-anbefaling',
      'normen-dokument',
      'nasjonal-veileder',
      'prioriteringsveileder',
    ],
  },
  {
    id: 'faglige-rad',
    label: 'Faglige råd',
    subcategoryIds: ['anbefaling', 'rad', 'faglig-rad', 'pico'],
  },
  {
    id: 'veiledere',
    label: 'Veiledere',
    subcategoryIds: [
      'takst-med-merknad',
      'veiviser',
      'ehelsestandard',
      'tilskudd',
      'veileder',
      'veiledning',
    ],
  },
  {
    id: 'rundskriv',
    label: 'Rundskriv',
    subcategoryIds: ['rundskriv'],
  },
  {
    id: 'lovfortolkning',
    label: 'Lovfortolkning',
    subcategoryIds: [
      'lov-eller-forskriftstekst-med-kommentar',
      'lovfortolkning',
      'regelverk-lov-eller-forskrift',
      'veileder-lov-forskrift',
      'paragraf-med-kommentar',
    ],
  },
  {
    id: 'statistikk-og-rapporter',
    label: 'Statistikk og rapport',
    subcategoryIds: ['rapport', 'statistikkelement', 'statistikk'],
  },
  {
    id: 'temaside',
    label: 'Temaside',
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

