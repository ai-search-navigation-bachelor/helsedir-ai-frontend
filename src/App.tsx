import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, ContentDetail, SearchPage, TemasideHubPage } from './pages'
import { TEMASIDE_CATEGORIES } from './constants/temasider'
// import { CategoryContentOrHubRoute } from './router/categoryRoutes'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="content/:id" element={<ContentDetail />} />

        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-hub`}
            path={`${category.slug}/*`}
            element={<TemasideHubPage categorySlugOverride={category.slug} />}
          />
        ))}

        {/* {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-content-or-hub`}
            path={`${category.slug}/:id`}
            element={<CategoryContentOrHubRoute categorySlug={category.slug} />}
          />
        ))} */}

        {/* Legacy redirect: /:categorySlug/content/:id → /:categorySlug/:id */}
        {/* {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-content-legacy`}
            path={`${category.slug}/content/:id`}
            element={<LegacyCategoryContentRedirect categorySlug={category.slug} />}
          />
        ))} */}
      </Route>
    </Routes>
  )
}

export default App
