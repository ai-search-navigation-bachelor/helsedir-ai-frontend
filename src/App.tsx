import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { AppSearch } from './components/ui/AppSearch'
import { AppInfoSearch } from './components/ui/AppInfoSearch'

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <AppLayout>
      {!selectedId ? (
        <AppSearch onSelectResult={(id) => setSelectedId(id)} />
      ) : (
        <>
          <button
            onClick={() => setSelectedId(null)}
            style={{
              padding: '8px 16px',
              marginBottom: '16px',
              backgroundColor: '#fff',
              color: '#0051be',
              border: '1px solid #0051be',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ← Tilbake til søk
          </button>
          <AppInfoSearch selectedId={selectedId} />
        </>
      )}
    </AppLayout>
  )
}

export default App

