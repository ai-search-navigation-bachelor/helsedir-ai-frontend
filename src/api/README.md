# API Module

This module handles all HTTP communication with the backend API, following SOLID principles and clean architecture patterns.

## Structure

```
api/
├── index.ts              # Central export point for all API functionality
├── config.ts             # API configuration and endpoints
├── httpClient.ts         # Reusable HTTP client utility
├── types.ts              # Shared type definitions
├── categorized.ts        # Categorized search API
├── categorySearch.ts     # Category-specific search API
└── search.ts             # General search and content API
```

## Design Principles

### Single Responsibility Principle (SRP)
- **config.ts**: Manages environment variables and endpoint configuration
- **httpClient.ts**: Handles HTTP requests, error handling, and response parsing
- **types.ts**: Defines shared type definitions
- Each API file focuses on one specific feature

### DRY (Don't Repeat Yourself)
- Common HTTP logic centralized in `httpClient.ts`
- Shared types in `types.ts`
- URL building and parameter handling abstracted
- Consistent error handling across all endpoints

### Open/Closed Principle
- Easy to extend with new API endpoints
- HTTP client can be enhanced without modifying existing code
- Type definitions can be extended through interfaces

## Usage

### Import from index
```typescript
import { searchCategorizedApi, searchApi, getContentApi } from '@/api'
```

### Categorized Search
```typescript
const results = await searchCategorizedApi('adhd', {
  signal: abortController.signal,
  role: 'doctor',
})
```

### Category Search
```typescript
const results = await searchCategoryApi('adhd', 'retningslinje', {
  search_id: 'abc-123',
  signal: abortController.signal,
})
```

### General Search
```typescript
const results = await searchApi('adhd', {
  offset: 0,
  limit: 10,
  signal: abortController.signal,
})
```

### Get Content
```typescript
const content = await getContentApi('content-id-123', 'search-id-456', {
  signal: abortController.signal,
})
```

## Error Handling

All API functions throw `ApiError` which includes:
- `message`: Error description
- `status`: HTTP status code (if available)
- `statusText`: HTTP status text (if available)

```typescript
try {
  const results = await searchApi('query')
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error: ${error.message}`, error.status)
  }
}
```

## Configuration

API endpoints are configured through environment variables (`.env` file):

```env
VITE_API_BASE_URL=http://129.241.150.141:8000
VITE_SEARCH_ENDPOINT=http://129.241.150.141:8000/search
VITE_CATEGORIZED_SEARCH_ENDPOINT=http://129.241.150.141:8000/search/categorized
VITE_CONTENT_ENDPOINT=http://129.241.150.141:8000/content
```

For local development, create `.env.local` with localhost URLs.

## Adding New Endpoints

1. Add endpoint to `config.ts`
2. Define types in `types.ts` (if shared) or in the specific API file
3. Create function using `httpRequest` and `buildUrl`
4. Export from `index.ts`

Example:
```typescript
// In config.ts
export const API_ENDPOINTS = {
  // ... existing
  newEndpoint: getEnvVar('VITE_NEW_ENDPOINT', `${DEFAULT_BASE_URL}/new`),
}

// In newApi.ts
export async function newApi(params: NewParams): Promise<NewResponse> {
  const url = buildUrl(API_ENDPOINTS.newEndpoint, params)
  return httpRequest<NewResponse>(url)
}
```
