# Breadcrumbs Checklist (Canonical)

Use this when we have full article hierarchy data.

## Rules
- Breadcrumbs must represent canonical site hierarchy, not search context.
- First item is always `Forside` (`/`).
- Last item is current page and is non-clickable.
- Intermediate items must be clickable when route exists.
- Avoid duplicate adjacent labels.

## Required Data
- Canonical parent relation for each content item (`parent_id` or equivalent).
- Canonical temaside/root relation for each content item.
- Stable title for each ancestor node.
- Route mapping for each breadcrumb node (`/temaside/...` or `/content/:id`).

## Resolver Priority
1. Backend-provided canonical breadcrumb array (if available).
2. Canonical parent chain from content metadata.
3. Temaside path/index fallback.
4. Minimal fallback: `Forside > Current page`.

## Implementation Notes
- Keep one shared resolver in frontend (single source of truth).
- Do not build breadcrumb hierarchy from search results.
- Show search as separate UI action (e.g. `Tilbake til søk`) if needed.
- Add tests for:
  - canonical path correctness
  - clickability of intermediate crumbs
  - duplicate removal
