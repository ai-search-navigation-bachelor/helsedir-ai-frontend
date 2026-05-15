/** Application entry point. Mounts the React root with BrowserRouter and TanStack QueryClientProvider. */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import '@digdir/designsystemet-css'
import '../design-tokens-build/theme.css'
import './index.css'
import '@fontsource/open-sans/index.css'
import '@fontsource-variable/source-serif-4/index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
