import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@digdir/designsystemet-css'
import '../design-tokens-build/theme.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
