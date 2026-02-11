export const TEMASIDE_CATEGORIES = [
  {
    slug: 'forebygging-diagnose-og-behandling',
    path: '/forebygging-diagnose-og-behandling',
    title: 'Forebygging, diagnose og behandling',
    iconSrc: '/Forebygging_diagnose_behandling.svg',
  },
  {
    slug: 'digitalisering-og-e-helse',
    path: '/digitalisering-og-e-helse',
    title: 'Digitalisering og e-helse',
    iconSrc: '/Digitalisering_E-helse.svg',
  },
  {
    slug: 'lov-og-forskrift',
    path: '/lov-og-forskrift',
    title: 'Lov og forskrift',
    iconSrc: '/Rundskriv_Veileder_til_lov.svg',
  },
  {
    slug: 'helseberedskap',
    path: '/helseberedskap',
    title: 'Helseberedskap',
    iconSrc: '/Helseberedskap.svg',
  },
  {
    slug: 'autorisasjon-og-spesialistutdanning',
    path: '/autorisasjon-og-spesialistutdanning',
    title: 'Autorisasjon og spesialistutdanning',
    iconSrc: '/Autorisasjon.svg',
  },
  {
    slug: 'tilskudd-og-finansiering',
    path: '/tilskudd-og-finansiering',
    title: 'Tilskudd og finansiering',
    iconSrc: '/Tilskudd.svg',
  },
  {
    slug: 'statistikk-registre-og-rapporter',
    path: '/statistikk-registre-og-rapporter',
    title: 'Statistikk, registre og rapporter',
    iconSrc: '/Statistikk.svg',
  },
] as const

export type TemasideCategory = (typeof TEMASIDE_CATEGORIES)[number]
export type TemasideCategorySlug = TemasideCategory['slug']

export const TEMASIDE_CATEGORY_SLUGS: readonly TemasideCategorySlug[] = TEMASIDE_CATEGORIES.map(
  (category) => category.slug,
)

export function getTemasideCategoryBySlug(slug: string): TemasideCategory | undefined {
  return TEMASIDE_CATEGORIES.find((category) => category.slug === slug)
}

export function isTemasideCategorySlug(slug: string): slug is TemasideCategorySlug {
  return TEMASIDE_CATEGORY_SLUGS.includes(slug as TemasideCategorySlug)
}
