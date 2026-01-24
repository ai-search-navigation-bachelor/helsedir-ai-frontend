import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FiChevronDown, FiChevronRight, FiArrowLeft } from 'react-icons/fi'
import { Button, Alert, Paragraph, Spinner } from '@digdir/designsystemet-react'
import type { InfoResultItem } from '../api/search'
import { getInfobitApi } from '../api/search'

type InfoItemProps = {
  item: InfoResultItem
  depth: number
}

function InfoItem({ item, depth }: InfoItemProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = item.children && item.children.length > 0

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        style={{
          padding: '16px',
          marginBottom: '12px',
          backgroundColor: depth === 0 ? '#fff' : '#f9f9f9',
          borderRadius: '4px',
          border: '1px solid #e0e0e0',
          boxShadow: depth === 0 ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setExpanded(!expanded)
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: '#0051be',
                marginTop: '2px',
              }}
              aria-label={expanded ? 'Skjul innhold' : 'Vis innhold'}
            >
              {expanded ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
            </button>
          )}
          <div style={{ flex: 1 }}>
            <h3 
              style={{ 
                margin: 0, 
                fontSize: depth === 0 ? '24px' : '18px', 
                fontWeight: 600,
                color: '#1a1a1a',
                lineHeight: '1.4',
              }}
            >
              {item.tittel}
            </h3>
            {item.infoId && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}>
                {item.infoType && `${item.infoType} • `}ID: {item.infoId}
              </p>
            )}
            {item.tekst && (
              <div 
                style={{ 
                  margin: '12px 0 0', 
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#333',
                }}
                dangerouslySetInnerHTML={{ __html: item.tekst }}
              />
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div style={{ marginTop: '8px', marginLeft: '20px' }}>
          {item.children!.map((child) => (
            <InfoItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function InfoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [depth] = useState(2)

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['infobit', id, depth],
    queryFn: async ({ signal }) => {
      if (!id) throw new Error('ID mangler')
      return getInfobitApi(id, { signal, depth })
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // Cache i 10 minutter
  })

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', backgroundColor: '#fff' }}>
      <Button
        variant='tertiary'
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px' }}
      >
        <FiArrowLeft size={20} />
        Tilbake
      </Button>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner title="Laster informasjon..." />
        </div>
      )}

      {error && (
        <Alert data-color='danger'>
          <Paragraph>
            {error instanceof Error ? error.message : 'Henting av infobit feilet'}
          </Paragraph>
        </Alert>
      )}

      {result && (
        <div>
          <InfoItem item={result} depth={0} />
        </div>
      )}
    </div>
  )
}
