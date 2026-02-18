import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, ContentDetail, SearchPage, TemasideHubPage } from './pages'
import { TEMASIDE_CATEGORIES, type TemasideCategorySlug } from './constants/temasider'

function isLikelyContentId(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/^\d{4}-\d{4}-[a-z0-9-]{8,}$/i.test(trimmed)) return true
  if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(trimmed)) return true
  return false
}

function CategoryContentOrHubRoute({ categorySlug }: { categorySlug: TemasideCategorySlug }) {
  const params = useParams()
  const id = (params.id || '').trim()

  if (isLikelyContentId(id)) {
    return <ContentDetail />
  }

  return <TemasideHubPage categorySlugOverride={categorySlug} subPathOverride={id} />
}

function LegacyCategoryContentRedirect({ categorySlug }: { categorySlug: TemasideCategorySlug }) {
  const params = useParams()
  const id = (params.id || '').trim()

  if (!id) {
    return <Navigate to={`/${categorySlug}`} replace />
  }

  return <Navigate to={`/${categorySlug}/${id}`} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="content/:id" element={<ContentDetail />} />
        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-content-legacy`}
            path={`${category.slug}/content/:id`}
            element={<LegacyCategoryContentRedirect categorySlug={category.slug} />}
          />
        ))}
        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-content-or-hub`}
            path={`${category.slug}/:id`}
            element={<CategoryContentOrHubRoute categorySlug={category.slug} />}
          />
        ))}
        {TEMASIDE_CATEGORIES.map((category) => (
          <Route
            key={`${category.slug}-hub`}
            path={`${category.slug}/*`}
            element={<TemasideHubPage categorySlugOverride={category.slug} />}
          />
        ))}
      </Route>
    </Routes>
  )
}

export default App

