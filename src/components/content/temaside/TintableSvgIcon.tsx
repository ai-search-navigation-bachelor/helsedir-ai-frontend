import { useEffect, useState } from 'react'

const svgMarkupCache = new Map<string, string>()
const svgLoadCache = new Map<string, Promise<string>>()

function toTintableSvgMarkup(rawSvg: string) {
  const withoutXmlDecl = rawSvg
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')

  const recolored = withoutXmlDecl
    .replace(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g, 'currentColor')
    .replace(/\brgb\(([^)]+)\)/gi, 'currentColor')
    .replace(/\bwhite\b/gi, 'currentColor')

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
      const markup = toTintableSvgMarkup(rawSvg)
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
  const [markup, setMarkup] = useState<string | null>(() => svgMarkupCache.get(src) ?? null)

  useEffect(() => {
    let active = true

    const cached = svgMarkupCache.get(src)
    if (cached) {
      setMarkup(cached)
      return () => {
        active = false
      }
    }

    setMarkup(null)

    loadTintableSvg(src)
      .then((nextMarkup) => {
        if (active) setMarkup(nextMarkup)
      })
      .catch(() => {
        if (active) setMarkup(null)
      })

    return () => {
      active = false
    }
  }, [src])

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
