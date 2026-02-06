// Custom layout configurations for specific temasider
// Use this to override the default hierarchical layout when needed

export type CustomSection = {
  title: string;
  paths: string[]; // Paths relative to the parent category
};

export type CustomLayout = {
  sections: CustomSection[];
};

/**
 * Categories that should render as flat lists (ignoring any nested URL hierarchy)
 * Add category paths here when the real Helsedir site shows only direct links
 * without grouping by subcategories, even if the URL structure has nesting.
 */
export const FORCE_FLAT_CATEGORIES: string[] = [
  '/lov-og-forskrift',
  '/tilskudd-og-finansiering',
  '/statistikk-registre-og-rapporter',
];

/**
 * Custom layouts for categories that need manual grouping
 * 
 * Only add categories here if they need custom section headers
 * that don't match the URL hierarchy.
 * 
 * Categories with flat structures (direct children only) will
 * automatically render correctly without custom configuration.
 */
export const CUSTOM_TEMASIDE_LAYOUTS: Record<string, CustomLayout> = {
  '/digitalisering-og-e-helse': {
    sections: [
      {
        title: 'Krav og anbefalinger på e-helsefeltet',
        paths: [
          '/digitalisering-og-e-helse/e-helsestandarder-og-standardiseringstiltak',
          '/digitalisering-og-e-helse/referansekatalogen-for-e-helse',
          '/digitalisering-og-e-helse/reguleringsplanen',
          '/digitalisering-og-e-helse/normen-personvern-og-informasjonssikkerhet',
          '/digitalisering-og-e-helse/nasjonal-arkitektur',
        ],
      },
      {
        title: 'Kodeverk og terminologi',
        paths: [
          '/digitalisering-og-e-helse/helsefaglige-kodeverk',
          '/digitalisering-og-e-helse/helsefaglig-terminologi',
        ],
      },
      {
        title: 'Strategi, planer og status',
        paths: [
          '/digitalisering-og-e-helse/nasjonal-e-helsestrategi',
          '/digitalisering-og-e-helse/veikart-for-nasjonal-e-helsestrategi',
          '/digitalisering-og-e-helse/nasjonal-e-helseportefolje',
          '/digitalisering-og-e-helse/plan-for-digitalisering-pa-legemiddelomradet',
          '/digitalisering-og-e-helse/prinsipper-for-innbyggertjenester',
        ],
      },
      {
        title: 'Utvalgte tiltak og satsinger',
        paths: [
          '/digitalisering-og-e-helse/pasientens-legemiddelliste',
          '/digitalisering-og-e-helse/kunstig-intelligens',
          '/digitalisering-og-e-helse/digital-samhandling',
          '/digitalisering-og-e-helse/kritisk-informasjon-i-kjernejournal',
        ],
      },
    ],
  },
};
