import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@digdir/designsystemet-react'
import { useRoleTagsQuery } from '../hooks/queries/useRoleTagsQuery'
import { useInfoTypesQuery } from '../hooks/queries/useInfoTypesQuery'
import { RoleIcon } from '../utils/roleIcons'
import { buildContentUrl } from '../lib/contentUrl'
import type { RoleTagGroup, RoleTagDocument } from '../api/roleTags'

const mono = "'JetBrains Mono', 'Fira Code', monospace"

function filterDocuments(docs: RoleTagDocument[], query: string): RoleTagDocument[] {
  const lower = query.toLowerCase()
  return docs.filter((d) => d.title.toLowerCase().includes(lower) || d.info_type.toLowerCase().includes(lower))
}

export function TagsPage() {
  const { data, isLoading, isError, error, refetch } = useRoleTagsQuery()
  const { data: infoTypes } = useInfoTypesQuery()
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  const [untaggedExpanded, setUntaggedExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [infoTypesOpen, setInfoTypesOpen] = useState(false)

  const toggleRole = (slug: string) => {
    setExpandedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 pb-8 sm:px-6 lg:px-12">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '120px 0' }}>
          <Spinner data-size="md" aria-label="Laster rolle-tags..." />
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 pb-8 sm:px-6 lg:px-12">
        <Header />
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '8px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '0.88rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span>{error instanceof Error ? error.message : 'Kunne ikke laste rolle-tags.'}</span>
          <button
            type="button"
            onClick={() => void refetch()}
            style={{
              padding: '6px 16px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #fecaca',
              backgroundColor: '#fff',
              color: '#dc2626',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Prøv igjen
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data || data.total_documents === 0) {
    return (
      <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 pb-8 sm:px-6 lg:px-12">
        <Header />
        <div
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
          }}
        >
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Ingen dokumenter funnet.
          </p>
        </div>
      </div>
    )
  }

  const isFiltering = searchQuery.trim().length > 0

  const filteredRoles = useMemo(() => {
    if (!isFiltering) return data.roles
    return data.roles
      .map((role) => {
        const docs = filterDocuments(role.documents, searchQuery)
        return { ...role, documents: docs, document_count: docs.length }
      })
      .filter((role) => role.document_count > 0)
  }, [data.roles, searchQuery, isFiltering])

  const filteredUntagged = useMemo(() => {
    if (!isFiltering) return data.untagged_documents
    return filterDocuments(data.untagged_documents, searchQuery)
  }, [data.untagged_documents, searchQuery, isFiltering])

  const searchableTypes = useMemo(() => {
    if (!infoTypes) return null
    return new Set(infoTypes.filter((t) => t.searchable).map((t) => t.slug))
  }, [infoTypes])

  const searchableStats = useMemo(() => {
    if (!searchableTypes) return null
    let tagged = 0
    let untagged = 0
    for (const role of data.roles) {
      for (const doc of role.documents) {
        if (searchableTypes.has(doc.info_type)) tagged++
      }
    }
    for (const doc of data.untagged_documents) {
      if (searchableTypes.has(doc.info_type)) untagged++
    }
    // tagged counts each doc per role it appears in, so deduplicate
    const seenTagged = new Set<string>()
    for (const role of data.roles) {
      for (const doc of role.documents) {
        if (searchableTypes.has(doc.info_type)) seenTagged.add(doc.id)
      }
    }
    return { total: seenTagged.size + untagged, tagged: seenTagged.size, untagged }
  }, [data, searchableTypes])

  const totalFilteredDocs = isFiltering
    ? filteredRoles.reduce((sum, r) => sum + r.document_count, 0) + filteredUntagged.length
    : data.total_documents

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pt-6 pb-8 sm:px-6 lg:px-12">
      <Header />

      {/* Search bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filtrer dokumenter..."
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '10px 14px',
            fontSize: '0.88rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#047FA4' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0' }}
        />
      </div>

      {/* Summary stats */}
      {searchableStats && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f0f9ff',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Søkbare dokumenter
            </span>
            <button
              type="button"
              onClick={() => setInfoTypesOpen((v) => !v)}
              title="Vis info-typer"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: '1.5px solid #94a3b8',
                background: infoTypesOpen ? '#025169' : 'transparent',
                color: infoTypesOpen ? '#fff' : '#94a3b8',
                fontSize: '0.68rem',
                fontWeight: 700,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                padding: 0,
                lineHeight: 1,
              }}
            >
              i
            </button>
          </div>

          {infoTypesOpen && infoTypes && (
            <div
              style={{
                marginBottom: '12px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#047FA4', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Søkbare
                  </div>
                  {infoTypes.filter((t) => t.searchable).map((t) => (
                    <div key={t.slug} style={{ color: '#1e293b', padding: '2px 0' }}>
                      {t.display_name} <span style={{ color: '#94a3b8', fontFamily: mono, fontSize: '0.72rem' }}>({t.slug})</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#94a3b8', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    Ikke søkbare
                  </div>
                  {infoTypes.filter((t) => !t.searchable).map((t) => (
                    <div key={t.slug} style={{ color: '#94a3b8', padding: '2px 0' }}>
                      {t.display_name} <span style={{ fontFamily: mono, fontSize: '0.72rem' }}>({t.slug})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '32px', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontFamily: mono, fontSize: '1.4rem', fontWeight: 800, color: '#025169' }}>
                {searchableStats.total}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '6px' }}>totalt</span>
            </div>
            <div>
              <span style={{ fontFamily: mono, fontSize: '1.1rem', fontWeight: 700, color: '#047FA4' }}>
                {searchableStats.tagged}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '6px' }}>med rolle-tag</span>
            </div>
            <div>
              <span style={{ fontFamily: mono, fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8' }}>
                {searchableStats.untagged}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '6px' }}>uten rolle-tag</span>
            </div>
            {isFiltering && (
              <div>
                <span style={{ fontFamily: mono, fontSize: '1.1rem', fontWeight: 700, color: '#059669' }}>
                  {totalFilteredDocs}
                </span>
                <span style={{ fontSize: '0.82rem', color: '#64748b', marginLeft: '6px' }}>treff</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
            {data.total_documents} dokumenter totalt i databasen
          </div>
        </div>
      )}

      {!searchableStats && (
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <StatBadge label="Totalt dokumenter" value={data.total_documents} />
          <StatBadge label="Med rolle-tag" value={data.total_documents - data.untagged_count} />
          <StatBadge label="Uten rolle-tag" value={data.untagged_count} />
          {isFiltering && <StatBadge label="Treff" value={totalFilteredDocs} />}
        </div>
      )}

      {/* No filter results */}
      {isFiltering && totalFilteredDocs === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            borderRadius: '10px',
            border: '1px dashed #cbd5e1',
            backgroundColor: '#f8fafc',
            marginBottom: '20px',
          }}
        >
          <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
            Ingen dokumenter matcher &laquo;{searchQuery}&raquo;
          </p>
        </div>
      )}

      {/* Role list */}
      {filteredRoles.length > 0 && (
      <div
        style={{
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#fff',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        {filteredRoles.map((role, i) => (
          <RoleRow
            key={role.slug}
            role={role}
            expanded={expandedRoles.has(role.slug)}
            onToggle={() => toggleRole(role.slug)}
            isLast={i === filteredRoles.length - 1 && filteredUntagged.length === 0}
          />
        ))}
      </div>
      )}

      {/* Untagged section */}
      {filteredUntagged.length > 0 && (
        <div
          style={{
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#fafafa',
            overflow: 'hidden',
          }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={() => setUntaggedExpanded(!untaggedExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setUntaggedExpanded(!untaggedExpanded)
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: '18px', color: '#94a3b8' }}>○</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#94a3b8' }}>
              Uten rolle-tag
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: '0.82rem',
                color: '#94a3b8',
                marginLeft: 'auto',
              }}
            >
              {filteredUntagged.length}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                color: '#94a3b8',
                transform: untaggedExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
              }}
            >
              ▶
            </span>
          </div>
          {untaggedExpanded && (
            <DocumentList documents={filteredUntagged} />
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function Header() {
  return (
    <header style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#047FA4',
          }}
        />
        <h1
          style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            margin: 0,
            color: '#025169',
            letterSpacing: '-0.02em',
          }}
        >
          Role Tags
        </h1>
      </div>
      <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
        Oversikt over hvilke dokumenter som er tagget med de forskjellige rollene.
      </p>
    </header>
  )
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        padding: '10px 16px',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>{label}</div>
      <div
        style={{
          fontFamily: mono,
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#025169',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function RoleRow({
  role,
  expanded,
  onToggle,
  isLast,
}: {
  role: RoleTagGroup
  expanded: boolean
  onToggle: () => void
  isLast: boolean
}) {
  return (
    <div
      style={{
        borderBottom: isLast && !expanded ? 'none' : '1px solid #f1f5f9',
      }}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <RoleIcon slug={role.slug} displayName={role.display_name} size={18} style={{ color: '#025169', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
          {role.display_name}
        </span>
        <span
          style={{
            fontFamily: mono,
            fontSize: '0.82rem',
            color: '#047FA4',
            marginLeft: 'auto',
          }}
        >
          {role.document_count}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          ▶
        </span>
      </div>
      {expanded && <DocumentList documents={role.documents} />}
    </div>
  )
}

function DocumentList({ documents }: { documents: RoleTagDocument[] }) {
  return (
    <div
      style={{
        padding: '0 16px 12px 44px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {documents.map((doc) => (
        <div
          key={doc.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: '#f8fafc',
            fontSize: '0.84rem',
          }}
        >
          <Link
            to={buildContentUrl(doc)}
            style={{
              color: '#047FA4',
              textDecoration: 'none',
              fontWeight: 500,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
            }}
          >
            {doc.title}
          </Link>
          <span
            style={{
              fontFamily: mono,
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {doc.info_type}
          </span>
        </div>
      ))}
    </div>
  )
}
