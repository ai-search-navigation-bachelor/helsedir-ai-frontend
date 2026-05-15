# Helsedirektoratet AI Frontend

A React + TypeScript frontend for Helsedirektoratet's AI-powered health content search system. The application lets users search across health guidelines, topic pages, recommendations, regulations, and advice — with role-based result personalisation for health professionals.

## Tech Stack

| Library | Purpose |
|---|---|
| React 19 + TypeScript | UI and type safety |
| Vite | Build tool and dev server |
| React Router v7 | Client-side routing |
| TanStack Query (React Query v5) | Server state, caching, async data fetching |
| Zustand | Global client state (search context, role selection) |
| Digdir Designsystemet | Norwegian government component library and design tokens |
| DOMPurify | HTML sanitisation for content from the API |
| Highcharts | Charts for content statistics views |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm test
```

## Environment Configuration

Copy `.env.example` to `.env.local` and set the backend URL:

```env
# Point directly to the backend (local dev default)
VITE_API_BASE_URL=http://129.241.150.141:8000

# Or use a relative path when running behind a reverse proxy (VM/prod)
# VITE_API_BASE_URL=/api

# When using /api in local dev, set a proxy target to avoid CORS issues:
# VITE_API_PROXY_TARGET=http://localhost:8000

# Optional: Helsedirektoratet external API (used as content fallback)
VITE_HELSEDIR_API_KEY=your-api-key-here
VITE_HELSEDIR_API_URL=https://api.helsedirektoratet.no
```

## Architecture

### State Management

- **TanStack Query** — all server data (search results, content, theme pages). Configured in [src/lib/queryClient.ts](src/lib/queryClient.ts) with a 5-minute stale time and no refetch on window focus.
- **Zustand** — global client state persisted to sessionStorage:
  - [src/stores/searchStore.ts](src/stores/searchStore.ts) — active search query, `search_id`, and filters
  - [src/stores/roleStore.ts](src/stores/roleStore.ts) — selected user role (persisted to localStorage)
  - [src/stores/contentDisclosureStore.ts](src/stores/contentDisclosureStore.ts) — open/closed accordion state per page
  - [src/stores/temasideBreadcrumbStore.ts](src/stores/temasideBreadcrumbStore.ts) — cached breadcrumb trails for temaside navigation

### API Layer

All API modules live in [src/api/](src/api/) and use the shared HTTP client in [src/lib/httpClient.ts](src/lib/httpClient.ts):

| Module | Description |
|---|---|
| `search.ts` | General and keyword search with pagination |
| `content.ts` | Fetch content by ID or path |
| `themePages.ts` | Fetch all published theme pages (temasider) |
| `helsedir.ts` | Direct Helsedirektoratet external API (content fallback) |
| `statistics.ts` | Per-content usage statistics |
| `roles.ts` | Available health-professional roles |
| `roleTags.ts` | Role-tag assignments per document (dev/admin) |
| `infoTypes.ts` | Content info-type list (dev/admin) |

### Routing

Defined in [src/App.tsx](src/App.tsx):

| Path | Page | Description |
|---|---|---|
| `/` | Home | Search form and category navigation |
| `/search` | SearchPage | Tabbed search results by category |
| `/dev` | DevPage | Developer search comparison tool (internal) |
| `/tags` | TagsPage | Documents grouped by role tag |
| `/retningslinjer/*` | ContentDetail | Guidelines content |
| `/faglige-rad/*` | ContentDetail | Professional advice content |
| `/veiledere/*` | ContentDetail | Guidance documents |
| `/<temaside-category>/*` | TemasideHubPage / TemasideLeafPage | Hierarchical theme pages |
| `/content/:id` | ContentDetail | Legacy ID-based content fallback |

### Component Organisation

```
src/components/
├── content/         # Content rendering (hierarchical view, temaside, detail)
├── dev/             # Developer tools (search pipeline comparison, score visualisation)
├── layout/          # App shell (header, footer, layout wrapper)
├── search/          # Search result cards and list components
└── ui/              # Reusable UI components (search form, breadcrumbs, role picker)
```

### Search Flow

1. User enters a query → stored in Zustand (`searchStore`)
2. Backend returns results grouped by category + a `search_id`
3. `search_id` is persisted and forwarded with subsequent category-scoped searches for context continuity
4. Selected role is forwarded to all search requests to personalise ranking

## Testing

Tests are written with [Vitest](https://vitest.dev/) and [Testing Library](https://testing-library.com/):

```bash
npm test          # Run tests in watch mode
npm run coverage  # Generate coverage report
```

Test files are co-located with source files (`*.test.ts` / `*.test.tsx`). Test setup is in [src/test/setup.ts](src/test/setup.ts).
