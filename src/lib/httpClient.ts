/**
 * HTTP Client Utility
 * Centralized HTTP request handling with consistent error handling and response parsing
 */

/**
 * Default request headers
 */
const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const

/**
 * API Error with status code
 */
export class ApiError extends Error {
  status?: number
  statusText?: string

  constructor(
    message: string,
    status?: number,
    statusText?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

/**
 * Request options for HTTP client
 */
export interface HttpRequestOptions {
  signal?: AbortSignal
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  suppressErrorStatuses?: number[]
  cache?: RequestCache
  body?: string
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>,
): URL {
  const url = (() => {
    try {
      return new URL(baseUrl)
    } catch {
      // Allow relative URLs (e.g. "/api/search") by resolving against current origin
      // This enables same-origin deployments behind a reverse proxy.
      const origin =
        typeof window !== 'undefined' && window.location
          ? window.location.origin
          : 'http://localhost'
      return new URL(baseUrl, origin)
    }
  })()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url
}

/**
 * Validate JSON response
 */
function validateJsonResponse(response: Response): void {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      'Expected JSON response',
      response.status,
      response.statusText,
    )
  }
}

/**
 * Make HTTP request with consistent error handling
 */
export async function httpRequest<T>(
  url: string | URL,
  options: HttpRequestOptions = {},
): Promise<T> {
  const { signal, headers = {}, method = 'GET', suppressErrorStatuses = [], cache } = options

  // Debug logging
  if (import.meta.env.DEV) {
    console.log(`[HTTP ${method}]`, url.toString())
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal,
      ...(cache !== undefined && { cache }),
    })

    if (!response.ok) {
      throw new ApiError(
        `Request failed: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
      )
    }

    validateJsonResponse(response)
    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      if (!error.status || !suppressErrorStatuses.includes(error.status)) {
        console.error(`API Error: ${error.message}`, {
          status: error.status,
          statusText: error.statusText,
        })
      }
      throw error
    }

    if (error instanceof Error) {
      // Let AbortErrors pass through unchanged so callers can detect them by name
      if (error.name === 'AbortError') {
        throw error
      }
      console.error(`Request error: ${error.message}`)
      throw new ApiError(error.message)
    }

    throw error
  }
}
