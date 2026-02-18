import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

const svgMarkupCache = new Map<string, string>()
const svgLoadCache = new Map<string, Promise<string>>()

const COLOR_TOKEN_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|\brgb\(([^)]+)\)|\bwhite\b/gi

function normalizePresentationColor(value: string) {
  return value.replace(COLOR_TOKEN_PATTERN, 'currentColor')
}

function rewriteStyleDeclaration(styleValue: string) {
  return styleValue.replace(
    /(fill|stroke)\s*:\s*([^;]+)/gi,
    (_, property: string, value: string) => `${property}: ${normalizePresentationColor(value.trim())}`,
  )
}

function rewritePresentationColors(svgMarkup: string) {
  return svgMarkup
    .replace(
      /\b(fill|stroke)\s*=\s*"([^"]*)"/gi,
      (_, property: string, value: string) => `${property}="${normalizePresentationColor(value)}"`,
    )
    .replace(
      /\b(fill|stroke)\s*=\s*'([^']*)'/gi,
      (_, property: string, value: string) => `${property}='${normalizePresentationColor(value)}'`,
    )
    .replace(
      /\bstyle\s*=\s*"([^"]*)"/gi,
      (_, value: string) => `style="${rewriteStyleDeclaration(value)}"`,
    )
    .replace(
      /\bstyle\s*=\s*'([^']*)'/gi,
      (_, value: string) => `style='${rewriteStyleDeclaration(value)}'`,
    )
    .replace(
      /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
      (_, attrs: string, cssBody: string) => `<style${attrs}>${rewriteStyleDeclaration(cssBody)}</style>`,
    )
}

function sanitizeSvgMarkup(markup: string) {
  return DOMPurify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_ATTR: ['class', 'aria-hidden', 'focusable'],
  })
}

function toTintableSvgMarkup(rawSvg: string) {
  const withoutXmlDecl = rawSvg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const recolored = rewritePresentationColors(withoutXmlDecl)

  return recolored.replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
    const cleanedAttrs = attrs
      .replace(/\swidth="[^"]*"/gi, '')
      .replace(/\sheight="[^"]*"/gi, '')
    return `<svg${cleanedAttrs} class="temaside-icon-svg" aria-hidden="true" focusable="false">`
  })
}

async function loadTintableSvg(src: string) {
  const cachedMarkup = svgMarkupCache.get(src)
  if (cachedMarkup) return cachedMarkup

  const cachedPromise = svgLoadCache.get(src)
  if (cachedPromise) return cachedPromise

  const promise = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load icon: ${src}`)
      }
      return response.text()
    })
    .then((rawSvg) => {
      const markup = sanitizeSvgMarkup(toTintableSvgMarkup(rawSvg))
      svgMarkupCache.set(src, markup)
      return markup
    })
    .finally(() => {
      svgLoadCache.delete(src)
    })

  svgLoadCache.set(src, promise)
  return promise
}

interface TintableSvgIconProps {
  src: string
  alt: string
  className: string
}

export function TintableSvgIcon({ src, alt, className }: TintableSvgIconProps) {
  const [loadedMarkupBySrc, setLoadedMarkupBySrc] = useState<Record<string, string>>({})
  const markup = svgMarkupCache.get(src) ?? loadedMarkupBySrc[src] ?? null

  useEffect(() => {
    let active = true

    if (markup) {
      return () => {
        active = false
      }
    }

    loadTintableSvg(src)
      .then((nextMarkup) => {
        if (active) {
          setLoadedMarkupBySrc((prev) => (prev[src] ? prev : { ...prev, [src]: nextMarkup }))
        }
      })
      .catch((error) => {
        console.warn('Failed to load tintable SVG', src, error)
      })

    return () => {
      active = false
    }
  }, [markup, src])

  if (!markup) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <span
      className={className}
      role="img"
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
