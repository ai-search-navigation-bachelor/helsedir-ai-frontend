# New SearchPage Component

## Overview
The new `SearchPage` component is a modern replacement for `CategorizedSearch` with a cleaner, tab-based interface for browsing search results by category.

## Route
- **URL**: `/search?query=<search-term>&category=<category-id>`
- **Example**: `/search?query=adhd&category=all`

## Quick Start

To test the new search page:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to: `http://localhost:5173/search?query=adhd`

3. Try the following:
   - Enter a search query
   - Click different category tabs
   - Use the theme filter dropdown
   - Click on result cards to view details

## Features

### 1. **Search Bar**
- Uses the existing `SearchForm` component
- Clear button (X) to reset search
- Magnifying glass icon for submitting search
- Auto-updates URL parameters on search

### 2. **Theme Filter**
- Uses the existing `FilterBar` component
- Dropdown showing "Alle temaer" by default
- Filters results by selected themes
- Multi-select with checkbox support

### 3. **Category Tabs**
- Built with Digdir's `Tabs` component
- Shows all available categories with result counts
- Categories include:
  - **Alle** - All results combined
  - **Temaside** - Theme pages
  - **Nasjonalfaglig retningslinje** - National guidelines
  - **Anbefalinger** - Recommendations
  - **Regelverk** - Regulations
  - **Råd** - Advice

### 4. **Results Display**
- Shows count: "X treff på [search-term]"
- Cards with:
  - Category label (colored badge)
  - Title
  - Explanation/excerpt (if available)
- Hover effect on cards
- Click to navigate to content detail page with search_id

### 5. **Sorting**
- Results are sorted by score (highest first)
- Maintains sorting within each category tab

## Components Used

- `@digdir/designsystemet-react`:
  - `Tabs` - Category navigation
  - `Alert` - Error and info messages
  - `Spinner` - Loading state
  - `Paragraph` - Text content

- Custom components:
  - `SearchForm` - Search input with clear button
  - `FilterBar` - Theme dropdown filter

## State Management

- Uses `useSearchStore` (Zustand) for:
  - Filter state (tema)
  - Search ID tracking
  - Search query storage

- URL parameters:
  - `query` - The search term
  - `category` - Active category tab (defaults to "all")

## API Integration

- Uses `useCategorizedSearchQuery` hook
- Fetches search results from backend
- Returns categorized results with priority ordering
- Passes search_id to content detail page for analytics

## Navigation

The new `SearchPage` has replaced the old `CategorizedSearch` and is now the default search page at the `/search` route. The old components and pages have been removed:
- Deleted `src/components/search/` folder
- Deleted `src/pages/CategorizedSearch.tsx`
- Deleted `src/pages/CategoryResults.tsx`

All navigation throughout the app now uses the new SearchPage component.

## Styling

- Uses Tailwind CSS for utility classes
- Custom colors and spacing match Helsedirektoratet design
- Blue accent color (`#3b82f6`) for active states and borders
- Responsive layout with max-width container
- Card-based design with hover effects

## Differences from CategorizedSearch

### What's New:
- ✅ Tab-based category navigation (instead of scroll-based sections)
- ✅ Cleaner, simpler layout
- ✅ Better mobile responsiveness
- ✅ Consistent card design across all categories
- ✅ No sidebar navigation needed

### What's Removed:
- ❌ CategorySidebar component
- ❌ Expandable category cards (ExpandableCategoryCard)
- ❌ Custom cards for temaside/retningslinje (uses unified design)
- ❌ Collapse/expand functionality

## Future Improvements

- [ ] Add sorting options (relevance, date, title)
- [ ] Add pagination for large result sets
- [ ] Add keyboard navigation for tabs
- [ ] Add result preview on hover
- [ ] Add filters for date ranges
- [ ] Add "Load more" functionality within tabs
- [ ] Add search suggestions/autocomplete

