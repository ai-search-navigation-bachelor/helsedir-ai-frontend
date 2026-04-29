import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildUrl, httpRequest, ApiError } from './httpClient'

// --- buildUrl ---

describe('buildUrl', () => {
  it('returns a URL with no params unchanged', () => {
    const url = buildUrl('http://example.com/search')
    expect(url.toString()).toBe('http://example.com/search')
  })

  it('appends string parameters as query string', () => {
    const url = buildUrl('http://example.com/search', { query: 'diabetes' })
    expect(url.searchParams.get('query')).toBe('diabetes')
  })

  it('appends number and boolean parameters', () => {
    const url = buildUrl('http://example.com/search', { limit: 15, rerank: true })
    expect(url.searchParams.get('limit')).toBe('15')
    expect(url.searchParams.get('rerank')).toBe('true')
  })

  it('skips undefined parameters', () => {
    const url = buildUrl('http://example.com/search', { query: 'test', role: undefined })
    expect(url.searchParams.has('role')).toBe(false)
  })

  it('handles relative URLs by resolving against localhost', () => {
    const url = buildUrl('/api/search', { query: 'test' })
    expect(url.pathname).toBe('/api/search')
    expect(url.searchParams.get('query')).toBe('test')
  })
})

// --- ApiError ---

describe('ApiError', () => {
  it('has name ApiError', () => {
    const err = new ApiError('something failed')
    expect(err.name).toBe('ApiError')
  })

  it('stores status and statusText', () => {
    const err = new ApiError('not found', 404, 'Not Found')
    expect(err.status).toBe(404)
    expect(err.statusText).toBe('Not Found')
  })

  it('is an instance of Error', () => {
    const err = new ApiError('fail')
    expect(err).toBeInstanceOf(Error)
  })
})

// --- httpRequest ---

describe('httpRequest', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns parsed JSON on a successful response', async () => {
    const mockData = { results: [], total: 0 }
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await httpRequest('http://example.com/search')
    expect(result).toEqual(mockData)
  })

  it('throws ApiError on non-ok response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ detail: 'not found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(httpRequest('http://example.com/search')).rejects.toBeInstanceOf(ApiError)
  })

  it('throws ApiError when response is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('<html>error</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }),
    )

    await expect(httpRequest('http://example.com/search')).rejects.toBeInstanceOf(ApiError)
  })

  it('rethrows AbortError unchanged', async () => {
    const abortError = new DOMException('Aborted', 'AbortError')
    vi.mocked(fetch).mockRejectedValue(abortError)

    await expect(httpRequest('http://example.com/search')).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})
