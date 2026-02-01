import { Link } from 'react-router-dom'
import type { SearchResult } from '../../types'
import { CategoryResultItem } from './CategoryResultItem'

interface ResultItemProps {
  result: SearchResult
}

export function ResultItem({ result }: ResultItemProps) {
  return (
    <Link 
      to={`/content/${result.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <a
        href={`/content/${result.id}`}
        onClick={(e) => {
          e.preventDefault()
          window.location.href = `/content/${result.id}`
        }}
        style={{
          display: 'block',
          padding: '16px 20px',
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc'
          e.currentTarget.style.borderColor = '#cbd5e1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white'
          e.currentTarget.style.borderColor = '#e2e8f0'
        }}
      >
        <CategoryResultItem 
          result={result} 
          variant="regular"
        />
      </a>
    </Link>
  )
}
