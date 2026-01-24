import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { Home } from './pages/Home'
import { SearchPage } from './pages/Search'

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/search' element={<SearchPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  )
}

export default App
