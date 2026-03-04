import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, ContentDetail, SearchPage, TemasideHubPage, TemasideLeafPage, NotFound, DevPage } from './pages'
import { TEMASIDE_CATEGORIES } from './constants/temasider'
import { CONTENT_CATEGORY_GROUPS, CONTENT_ONLY_PREFIXES } from './constants/contentRoutes'

function App() {
  const showDevRoute = import.meta.env.DEV

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchPage />} />
        {showDevRoute && <Route path="dev" element={<DevPage />} />}

        {/* Path-based content routes (e.g. /retningslinjer/adhd) */}
        {CONTENT_CATEGORY_GROUPS.map((group) => (
          <Route key={group.pathPrefix} path={group.pathPrefix}>
            <Route index element={<Navigate to="/" replace />} />
            <Route path="*" element={<ContentDetail pathPrefix={group.pathPrefix} />} />
          </Route>
        ))}

        {/* Temaside hub pages (e.g. /forebygging-diagnose-og-behandling) */}
        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-hub`}
            path={category.slug}
            element={<TemasideHubPage categorySlugOverride={category.slug} />}
          />
        ))}

        {/* Temaside leaf pages (e.g. /forebygging-diagnose-og-behandling/diabetes) */}
        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-leaf`}
            path={`${category.slug}/*`}
            element={<TemasideLeafPage categorySlug={category.slug} />}
          />
        ))}

        {/* Content-only routes (no landing page, just content detail) */}
        {CONTENT_ONLY_PREFIXES.map((prefix) => (
          <Route key={prefix} path={`${prefix}/*`} element={<ContentDetail pathPrefix={prefix} />} />
        ))}

        {/* Legacy ID-based content route (fallback) */}
        <Route path="content/:id" element={<ContentDetail />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
