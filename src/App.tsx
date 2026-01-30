import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, InfoDetail, CategorizedSearch, CategoryResults } from './pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<CategorizedSearch />} />
        <Route path="category" element={<CategoryResults />} />
        <Route path="info/:id" element={<InfoDetail />} />
      </Route>
    </Routes>
  )
}

export default App

