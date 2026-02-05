import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, ContentDetail, SearchPage, TemasideIndexPage, TemasideHubPage } from './pages'


function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="content/:id" element={<ContentDetail />} />
        <Route path="temasider">
          <Route index element={<TemasideIndexPage />} />
          <Route path="*" element={<TemasideHubPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App

