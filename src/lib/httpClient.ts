/** Default headers included in every outgoing request. */
const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const

/** Error returned by the HTTP client when the server responds with a non-2xx status code. */
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

/** Options accepted by {@link httpRequest}. */
export interface HttpRequestOptions {
  /** AbortSignal used to cancel the request (e.g. on component unmount). */
  signal?: AbortSignal
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** HTTP status codes that should NOT be logged as errors (e.g. 404 for "not found" lookups). */
  suppressErrorStatuses?: number[]
  cache?: RequestCache
  body?: string
}

/**
 * Builds a URL from a base string and optional query parameters.
 * Accepts both absolute URLs and relative paths (resolved against the current origin),
 * enabling same-origin deployments behind a reverse proxy without code changes.
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
 * Performs a typed HTTP request with consistent error handling and JSON parsing.
 * Throws {@link ApiError} on non-2xx responses or network failures.
 */
export async function httpRequest<T>(
  url: string | URL,
  options: HttpRequestOptions = {},
): Promise<T> {
  const { signal, headers = {}, method = 'GET', suppressErrorStatuses = [], cache, body } = options

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
      ...(body !== undefined && method !== 'GET' && { body }),
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
