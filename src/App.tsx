import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout'
import { Home, Search, InfoDetail } from './pages'

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="info/:id" element={<InfoDetail />} />
      </Route>
    </Routes>
  )
}

export default App

