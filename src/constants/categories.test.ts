import { describe, it, expect } from 'vitest'
import {
  SEARCH_MAIN_CATEGORIES,
  SEARCH_SUBCATEGORY_LABELS,
  getMainCategoryBySubcategory,
} from './categories'

describe('getMainCategoryBySubcategory', () => {
  it('maps retningslinje to retningslinjer', () => {
    expect(getMainCategoryBySubcategory('retningslinje')).toBe('retningslinjer')
  })

  it('maps temaside to temaside', () => {
    expect(getMainCategoryBySubcategory('temaside')).toBe('temaside')
  })

  it('maps anbefaling to faglige-rad', () => {
    expect(getMainCategoryBySubcategory('anbefaling')).toBe('faglige-rad')
  })

  it('maps regelverk-lov-eller-forskrift to regelverk', () => {
    expect(getMainCategoryBySubcategory('regelverk-lov-eller-forskrift')).toBe('regelverk')
  })

  it('returns undefined for unknown subcategory', () => {
    expect(getMainCategoryBySubcategory('ukjent-kategori')).toBeUndefined()
  })

  it('every subcategoryId in SEARCH_MAIN_CATEGORIES resolves to its parent', () => {
    for (const category of SEARCH_MAIN_CATEGORIES) {
      for (const subcategoryId of category.subcategoryIds) {
        expect(getMainCategoryBySubcategory(subcategoryId)).toBe(category.id)
      }
    }
  })
})

describe('SEARCH_SUBCATEGORY_LABELS', () => {
  it('has a label for every subcategoryId in SEARCH_MAIN_CATEGORIES', () => {
    for (const category of SEARCH_MAIN_CATEGORIES) {
      for (const subcategoryId of category.subcategoryIds) {
        expect(SEARCH_SUBCATEGORY_LABELS).toHaveProperty(subcategoryId)
        expect(typeof SEARCH_SUBCATEGORY_LABELS[subcategoryId]).toBe('string')
      }
    }
  })
})
