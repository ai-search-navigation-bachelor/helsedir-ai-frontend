import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, ContentDetail, CategorizedSearch, CategoryResults } from './pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<CategorizedSearch />} />
        <Route path="category/:category" element={<CategoryResults />} />
        <Route path="content/:id" element={<ContentDetail />} />
      </Route>
    </Routes>
  )
}

export default App

