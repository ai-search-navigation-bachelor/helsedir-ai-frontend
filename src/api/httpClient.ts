/**
 * HTTP Client Utility
 * Centralized HTTP request handling with consistent error handling and response parsing
 */

import { DEFAULT_HEADERS } from './config'

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
}

/**
 * Build URL with query parameters
 */
export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined>,
): URL {
  const url = new URL(baseUrl)
  
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
  const { signal, headers = {}, method = 'GET' } = options

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      signal,
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
      console.error(`API Error: ${error.message}`, {
        status: error.status,
        statusText: error.statusText,
      })
      throw error
    }
    
    if (error instanceof Error) {
      console.error(`Request error: ${error.message}`)
      throw new ApiError(error.message)
    }
    
    throw error
  }
}
