import type { IconType } from 'react-icons'
import {
  IoBarChartOutline,
  IoClipboardOutline,
  IoDocumentTextOutline,
  IoInformationCircleOutline,
  IoLibraryOutline,
  IoListOutline,
  IoNewspaperOutline,
} from 'react-icons/io5'
import { normalizeContentType } from '../../../constants/content'

interface CategoryColors {
  border: string
  icon: string
  iconBg: string
  tag: string
}

type CategoryIcon =
  | { kind: 'asset'; src: string; alt: string }
  | { kind: 'component'; component: IconType }

interface CategoryRule {
  icon: CategoryIcon
  palette: PaletteKey
}

export interface TemasideCategoryVisual {
  icon: CategoryIcon
  colors: CategoryColors
}

const PALETTES = {
  blue: { border: '#bfdbfe', icon: '#2563eb', iconBg: '#eff6ff', tag: '#1d4ed8' },
  cyan: { border: '#a5f3fc', icon: '#0891b2', iconBg: '#ecfeff', tag: '#0e7490' },
  green: { border: '#bbf7d0', icon: '#15803d', iconBg: '#f0fdf4', tag: '#166534' },
  amber: { border: '#fde68a', icon: '#b45309', iconBg: '#fffbeb', tag: '#92400e' },
  orange: { border: '#fed7aa', icon: '#c2410c', iconBg: '#fff7ed', tag: '#9a3412' },
  rose: { border: '#fecdd3', icon: '#be123c', iconBg: '#fff1f2', tag: '#9f1239' },
  violet: { border: '#ddd6fe', icon: '#7c3aed', iconBg: '#f5f3ff', tag: '#6d28d9' },
  indigo: { border: '#c7d2fe', icon: '#4f46e5', iconBg: '#eef2ff', tag: '#4338ca' },
  slate: { border: '#cbd5e1', icon: '#475569', iconBg: '#f8fafc', tag: '#334155' },
} as const

type PaletteKey = keyof typeof PALETTES

const ASSET = {
  guidelines: '/more-icons/retningslinjer_veiledere_faglige_rad.svg',
  reports: '/more-icons/Rapporter.svg',
  normative: '/more-icons/Normerende.svg',
  pathway: '/more-icons/nasjonalt-forlop.svg',
  hearings: '/more-icons/H%C3%B8ringer.svg',
  grants: '/Tilskudd.svg',
  statistics: '/Statistikk.svg',
  legal: '/Rundskriv_Veileder_til_lov.svg',
} as const

const assetIcon = (src: string, alt: string): CategoryIcon => ({ kind: 'asset', src, alt })
const componentIcon = (component: IconType): CategoryIcon => ({ kind: 'component', component })

/**
 * Mapped from live backend data (snapshot: 2026-02-18):
 * - /theme-pages + /content/{id} for all 287 temasider
 * - /search/categorized for broad sample queries to catch extra types
 *
 * Priority rule: use project icons from /public where they fit.
 * React icons are used as fallback where no fitting project icon exists.
 */
const EXACT_RULES: Record<string, CategoryRule> = {
  anbefaling: { icon: componentIcon(IoClipboardOutline), palette: 'blue' },
  'pakkeforlop-anbefaling': { icon: assetIcon(ASSET.pathway, 'Pakkeforløp-anbefaling'), palette: 'blue' },
  rad: { icon: assetIcon(ASSET.guidelines, 'Råd'), palette: 'violet' },
  'faglig-rad': { icon: assetIcon(ASSET.guidelines, 'Faglig råd'), palette: 'violet' },
  retningslinje: { icon: assetIcon(ASSET.guidelines, 'Retningslinje'), palette: 'blue' },
  'nasjonal-faglig-retningslinje': { icon: assetIcon(ASSET.guidelines, 'Nasjonal faglig retningslinje'), palette: 'blue' },
  veileder: { icon: assetIcon(ASSET.guidelines, 'Veileder'), palette: 'cyan' },
  'nasjonal-veileder': { icon: assetIcon(ASSET.guidelines, 'Nasjonal veileder'), palette: 'cyan' },
  prioriteringsveileder: { icon: assetIcon(ASSET.guidelines, 'Prioriteringsveileder'), palette: 'cyan' },
  'veileder-lov-forskrift': { icon: assetIcon(ASSET.legal, 'Veileder til lov og forskrift'), palette: 'amber' },
  'nasjonalt-forlop': { icon: assetIcon(ASSET.pathway, 'Nasjonalt forløp'), palette: 'green' },
  pakkeforlop: { icon: assetIcon(ASSET.pathway, 'Pakkeforløp'), palette: 'green' },
  lov: { icon: assetIcon(ASSET.legal, 'Lov'), palette: 'amber' },
  forskrift: { icon: assetIcon(ASSET.legal, 'Forskrift'), palette: 'amber' },
  'regelverk-lov-eller-forskrift': { icon: assetIcon(ASSET.legal, 'Regelverk lov/forskrift'), palette: 'amber' },
  'lov-eller-forskriftstekst-med-kommentar': { icon: assetIcon(ASSET.legal, 'Lov/forskrift med kommentar'), palette: 'orange' },
  rundskriv: { icon: assetIcon(ASSET.legal, 'Rundskriv'), palette: 'orange' },
  rapport: { icon: assetIcon(ASSET.reports, 'Rapport'), palette: 'slate' },
  artikkel: { icon: componentIcon(IoInformationCircleOutline), palette: 'slate' },
  nyhet: { icon: componentIcon(IoNewspaperOutline), palette: 'slate' },
  statistikkelement: { icon: assetIcon(ASSET.statistics, 'Statistikk'), palette: 'rose' },
  pico: { icon: assetIcon(ASSET.statistics, 'PICO'), palette: 'rose' },
  tilskudd: { icon: assetIcon(ASSET.grants, 'Tilskudd'), palette: 'amber' },
  'takst-med-merknad': { icon: assetIcon(ASSET.grants, 'Takst med merknad'), palette: 'amber' },
  ehelsestandard: { icon: assetIcon(ASSET.normative, 'E-helsestandard'), palette: 'indigo' },
  'normen-dokument': { icon: assetIcon(ASSET.normative, 'Normen-dokument'), palette: 'indigo' },
  'generisk-normerende-enhet': { icon: assetIcon(ASSET.normative, 'Normerende enhet'), palette: 'indigo' },
  horing: { icon: assetIcon(ASSET.hearings, 'Høring'), palette: 'orange' },
  temaside: { icon: componentIcon(IoLibraryOutline), palette: 'slate' },
}

const KEYWORD_RULES: Array<{ keywords: string[]; rule: CategoryRule }> = [
  { keywords: ['retningslinje', 'veileder', 'rad'], rule: { icon: assetIcon(ASSET.guidelines, 'Retningslinje/veileder/råd'), palette: 'blue' } },
  { keywords: ['forlop'], rule: { icon: assetIcon(ASSET.pathway, 'Forløp'), palette: 'green' } },
  { keywords: ['rapport', 'artikkel', 'nyhet'], rule: { icon: assetIcon(ASSET.reports, 'Rapport/artikkel/nyhet'), palette: 'slate' } },
  { keywords: ['statistikk', 'pico'], rule: { icon: assetIcon(ASSET.statistics, 'Statistikk'), palette: 'rose' } },
  { keywords: ['tilskudd', 'takst'], rule: { icon: assetIcon(ASSET.grants, 'Tilskudd'), palette: 'amber' } },
  { keywords: ['lov', 'forskrift', 'rundskriv', 'regelverk'], rule: { icon: assetIcon(ASSET.legal, 'Regelverk'), palette: 'amber' } },
  { keywords: ['standard', 'norm'], rule: { icon: assetIcon(ASSET.normative, 'Normerende'), palette: 'indigo' } },
  { keywords: ['horing'], rule: { icon: assetIcon(ASSET.hearings, 'Høring'), palette: 'orange' } },
]

const FALLBACK_ICONS: readonly CategoryIcon[] = [
  componentIcon(IoListOutline),
  componentIcon(IoDocumentTextOutline),
  componentIcon(IoBarChartOutline),
  componentIcon(IoLibraryOutline),
]

const FALLBACK_PALETTES: readonly PaletteKey[] = [
  'slate',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'violet',
  'indigo',
]

function normalizeInfoType(infoType: string) {
  return normalizeContentType(infoType)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function pickFallbackRule(key: string): CategoryRule {
  const hash = hashString(key || 'innhold')
  const icon = FALLBACK_ICONS[hash % FALLBACK_ICONS.length]
  const palette = FALLBACK_PALETTES[hash % FALLBACK_PALETTES.length]
  return { icon, palette }
}

export function getTemasideCategoryVisual(infoType: string): TemasideCategoryVisual {
  const normalizedKey = normalizeInfoType(infoType)
  const exact = EXACT_RULES[normalizedKey]
  if (exact) {
    return { icon: exact.icon, colors: PALETTES[exact.palette] }
  }

  const keywordMatch = KEYWORD_RULES.find(({ keywords }) => keywords.some((keyword) => normalizedKey.includes(keyword)))
  if (keywordMatch) {
    return { icon: keywordMatch.rule.icon, colors: PALETTES[keywordMatch.rule.palette] }
  }

  const fallback = pickFallbackRule(normalizedKey)
  return { icon: fallback.icon, colors: PALETTES[fallback.palette] }
}
