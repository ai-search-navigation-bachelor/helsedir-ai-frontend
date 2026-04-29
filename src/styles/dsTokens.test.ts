import { describe, it, expect } from 'vitest'
import { ds, colors } from './dsTokens'

describe('ds.var', () => {
  it('wraps the name in a CSS var(--ds-...) expression', () => {
    expect(ds.var('color-logobla-1-base-default')).toBe('var(--ds-color-logobla-1-base-default)')
  })
})

describe('ds.color', () => {
  it('generates a CSS variable for a color and role', () => {
    expect(ds.color('logobla-1', 'base-default')).toBe('var(--ds-color-logobla-1-base-default)')
  })

  it('generates a CSS variable for hvit surface-default', () => {
    expect(ds.color('hvit', 'surface-default')).toBe('var(--ds-color-hvit-surface-default)')
  })

  it('generates a CSS variable for neutral border-subtle', () => {
    expect(ds.color('neutral', 'border-subtle')).toBe('var(--ds-color-neutral-border-subtle)')
  })
})

describe('colors shortcuts', () => {
  it('headerBg is a hardcoded hex value', () => {
    expect(colors.headerBg).toBe('#e6f2f6')
  })

  it('link uses the correct token', () => {
    expect(colors.link).toBe('var(--ds-color-bla-1-text-default)')
  })

  it('border uses the neutral border-default token', () => {
    expect(colors.border).toBe('var(--ds-color-neutral-border-default)')
  })
})
