# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite frontend for Helsedirektoratet's AI-powered search system. The application provides categorized search functionality for health-related content including guidelines (retningslinjer), topic pages (temasider), recommendations, regulations, and advice.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Configuration

Copy `.env.example` to `.env.local` and configure API endpoints:

```env
VITE_API_BASE_URL=http://129.241.150.141:8000
VITE_SEARCH_ENDPOINT=http://129.241.150.141:8000/search
VITE_CATEGORIZED_SEARCH_ENDPOINT=http://129.241.150.141:8000/search/categorized
VITE_CONTENT_ENDPOINT=http://129.241.150.141:8000/content
VITE_HELSEDIR_API_KEY=your-api-key-here
```

For local backend development, point endpoints to `http://localhost:8000`.

## Architecture

### State Management

- **TanStack Query (React Query)**: Server state, caching, and async data fetching
  - Configured in `src/lib/queryClient.ts` with 5-minute stale time and refetch disabled on window focus
  - Query hooks in `src/hooks/queries/`
- **Zustand**: Global client state (search context persistence)
  - `src/stores/searchStore.ts`: Persists `search_id` and `query` across navigation using localStorage

### API Layer

The API layer follows SOLID principles with clear separation of concerns:

- **`src/api/config.ts`**: Centralized endpoint configuration with environment variable validation
- **`src/api/httpClient.ts`**: Reusable HTTP client with consistent error handling (`ApiError` class)
- **`src/api/types.ts`**: Shared type definitions across API modules
- **`src/api/categorized.ts`**: Categorized search API (returns results grouped by info_type)
- **`src/api/categorySearch.ts`**: Category-specific search API (search within one category)
- **`src/api/search.ts`**: General search and content fetching
- **`src/api/helsedir.ts`**: Direct Helsedirektoratet API integration for nested content

All API functions accept `AbortSignal` for request cancellation and optional `role` parameter for personalization.

### Routing

React Router v7 structure (`src/App.tsx`):
- `/` - Home page with search form
- `/search` - Categorized search results
- `/category` - Category-specific results (e.g., only retningslinjer)
- `/content/:id` - Content detail page with nested structure

### Component Organization

```
src/components/
├── content/         # Content display components (chapters, TOC, HTML rendering)
├── layout/          # App shell (header, layout wrapper)
├── search/          # Search result cards (category-specific and general)
└── ui/              # Reusable UI components (search forms, breadcrumbs)
```

Component types are defined in `src/types/components.ts` and `src/types/pages.ts`.

### Category System

Five predefined categories in `src/constants/categories.ts`:
1. `temaside` - Topic pages
2. `retningslinje` - Guidelines
3. `anbefaling` - Recommendations
4. `regelverk-lov-eller-forskrift` - Regulations/laws
5. `veileder-lov-forskrift` - Guidance on laws/regulations

Categories are displayed in this specific order throughout the UI.

### Design System

Uses **Digdir Designsystemet** (Norwegian government design system): https://designsystemet.no/no/components

#### Component Library

Import components from `@digdir/designsystemet-react`:

```typescript
import { Button, Search, Heading, Spinner, Alert } from '@digdir/designsystemet-react'
```

**Available components include:**
- **Interactive**: Button, Checkbox, Radio, Switch, ToggleGroup, Select, Dropdown
- **Form**: Search, Input, Textarea, Textfield, Field, Fieldset, ErrorSummary
- **Display**: Card, CardBlock, Badge, Chip, Tag, Avatar, Divider, Skeleton
- **Navigation**: Breadcrumbs, Link, Pagination, Tabs, SkipLink
- **Feedback**: Alert, Spinner, Tooltip, Popover, ValidationMessage
- **Typography**: Heading, Paragraph, Label
- **Layout**: Dialog, Details, Table, List

#### Composite Component Pattern

Some Designsystemet components use a composite pattern with subcomponents:

```typescript
// Search component example (see src/components/ui/HomeSearchForm.tsx)
<Search>
  <Search.Input placeholder="Søk..." value={query} onChange={onChange} />
  <Search.Clear onClick={onClear} />
  <Search.Button type="submit">Søk</Search.Button>
</Search>
```

Other composite components: `Avatar.Stack`, `Breadcrumbs.List/Item/Link`, `Fieldset.Legend`, `Table.Head/Body/Row/Cell`

#### Design Tokens

Custom theme configuration in `designsystemet.config.json` defines Helsedirektoratet brand colors:
- **Main colors**: `logobla-1` (#025169), `logobla-2` (#047FA4), `hvit` (white)
- **Support colors**: `bla-1/2/3`, `gronn-1/2/3`, `gul-1/2/3`, `lilla-1/2/3`, `svart`

**Token helper utility** (`src/styles/dsTokens.ts`):

```typescript
import { ds, colors } from '@/styles/dsTokens'

// Use semantic color roles
style={{
  backgroundColor: ds.color('logobla-1', 'base-default'),
  color: ds.color('logobla-1', 'base-contrast-default'),
  border: `2px solid ${ds.color('logobla-1', 'border-default')}`
}}

// Or use predefined semantic shortcuts
style={{
  backgroundColor: colors.headerBg,
  color: colors.text,
  borderColor: colors.border
}}
```

**Color roles available:**
- `background-default/tinted`, `surface-default/tinted/hover/active`
- `border-subtle/default/strong`
- `text-subtle/default`
- `base-default/hover/active/contrast-subtle/contrast-default`

#### Styling Guidelines

1. **Prefer Designsystemet components** over custom implementations
2. **Use component props** for variants and sizes:
   ```typescript
   <Button variant="primary" data-size="md">Submit</Button>
   <Alert severity="info">Message</Alert>
   ```
3. **Use design tokens** via the `ds` helper for consistent theming
4. **Inline styles are acceptable** for component-specific layout (flex, grid, spacing)
5. **Custom CSS** should be minimal - only when Designsystemet doesn't provide needed styling
6. **Always import global CSS** in main.tsx:
   ```typescript
   import '@digdir/designsystemet-css'
   import '../design-tokens-build/theme.css'
   ```

### Content Rendering

Content detail pages fetch and display nested hierarchical content:
- HTML content sanitized with DOMPurify before rendering
- Nested structure (chapters/sections) rendered recursively via `ChapterAccordion`
- Table of contents generated from nested structure
- Breadcrumb navigation based on content type

## Key Technical Details

### Search Flow

1. User enters query → stores in Zustand (`searchStore`)
2. Categorized search API called → returns `search_id` and results grouped by category
3. `search_id` persisted for context in subsequent category-specific searches
4. Click category → navigate to `/category` with query params → category-specific search using stored `search_id`

### TypeScript Paths

No path aliases configured. Use relative imports (e.g., `../../api` not `@/api`).

### Data Fetching Patterns

- All queries use TanStack Query hooks in `src/hooks/queries/`
- Queries include query keys with all dependencies for proper cache invalidation
- AbortSignal passed to API functions for automatic cleanup on unmount/navigation
- Error boundaries not implemented - errors bubble to query states

### Styling Approach

- **Component-first**: Use Designsystemet components with their built-in variants and props
- **Design tokens**: Access theme colors via `ds.color()` helper from `src/styles/dsTokens.ts`
- **Inline styles**: Used for component-specific layout (flexbox, grid, spacing, borders)
- **Global CSS**: Only `@digdir/designsystemet-css` and `design-tokens-build/theme.css` imported in `main.tsx`
- **No CSS modules or CSS-in-JS**: Keep styling simple and maintainable

## Common Patterns

### Adding a New API Endpoint

1. Add endpoint to `src/api/config.ts`
2. Define types in `src/api/types.ts` or create new API module file
3. Create API function using `httpRequest` and `buildUrl` utilities
4. Export from `src/api/index.ts`
5. Create corresponding React Query hook in `src/hooks/queries/`

### Creating a New Search Result Card

Search result cards for different content types are in `src/components/search/`:
- Extend `SearchResultBase` type from `src/api/types.ts`
- Use Designsystemet `Card` component as base
- Follow naming pattern: `{Type}Card.tsx` (e.g., `RetningslinjeCard.tsx`)

### Working with Nested Content

Content from Helsedirektoratet API can be deeply nested (chapters → sections → subsections):
- Type: `NestedContent` in `src/api/types.ts`
- Recursive rendering component: `ChapterAccordion.tsx`
- Accordion-based UI for collapsible sections

### Using Designsystemet Components

**Button variants and sizes:**
```typescript
<Button variant="primary">Primary action</Button>
<Button variant="secondary">Secondary action</Button>
<Button variant="tertiary">Tertiary action</Button>
<Button data-size="sm | md | lg">Sized button</Button>
```

**Alert for feedback:**
```typescript
<Alert severity="info | success | warning | danger">
  <Paragraph>Message content</Paragraph>
</Alert>
```

**Typography hierarchy:**
```typescript
<Heading level={1 | 2 | 3 | 4 | 5} size="xs | sm | md | lg | xl | xxl">
  Heading text
</Heading>
<Paragraph size="xs | sm | md | lg">Body text</Paragraph>
```

**Search with composite pattern** (see `HomeSearchForm.tsx:27-44`):
```typescript
<Search>
  <Search.Input
    id="search-id"
    placeholder="Search..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />
  <Search.Clear onClick={() => setQuery('')} />
  <Search.Button type="submit">Search</Search.Button>
</Search>
```

**Custom theming with design tokens** (see `AppHeader.tsx:42-70`):
```typescript
<Button
  variant="secondary"
  style={{
    backgroundColor: ds.color('hvit', 'surface-default'),
    border: `2px solid ${ds.color('logobla-1', 'base-hover')}`,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
  }}
>
  Button text
</Button>
```
