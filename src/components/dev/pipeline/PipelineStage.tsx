import type { PipelineStageId } from '../../../types/dev'

interface PipelineStageProps {
  id: PipelineStageId
  label: string
  description: string
  accentHex: string
  isActive: boolean
  onClick: () => void
  summary: string
  disabled?: boolean
}

export function PipelineStage({
  label,
  description,
  accentHex,
  isActive,
  onClick,
  summary,
  disabled,
}: PipelineStageProps) {
  const effectiveColor = disabled ? '#94a3b8' : accentHex

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '10px 14px',
        minWidth: '130px',
        borderRadius: '8px',
        border: disabled
          ? '2px dashed #cbd5e1'
          : `2px solid ${isActive ? accentHex : '#e2e8f0'}`,
        backgroundColor: disabled
          ? '#f8fafc'
          : isActive ? `${accentHex}0d` : '#fff',
        boxShadow: disabled
          ? 'none'
          : isActive
            ? `inset 4px 0 0 ${accentHex}, 0 2px 8px ${accentHex}22`
            : `inset 4px 0 0 ${accentHex}, 0 1px 3px rgba(0,0,0,0.06)`,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.2s ease',
        outline: 'none',
        position: 'relative',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.borderColor = `${accentHex}88`
          e.currentTarget.style.boxShadow = `inset 4px 0 0 ${accentHex}, 0 2px 6px ${accentHex}18`
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !disabled) {
          e.currentTarget.style.borderColor = '#e2e8f0'
          e.currentTarget.style.boxShadow = `inset 4px 0 0 ${accentHex}, 0 1px 3px rgba(0,0,0,0.06)`
        }
      }}
    >
      <span
        style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: disabled ? '#94a3b8' : isActive ? accentHex : '#1e293b',
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: '0.68rem',
          color: disabled ? '#b0b8c4' : '#64748b',
          lineHeight: 1.3,
        }}
      >
        {description}
      </span>
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          color: effectiveColor,
          marginTop: '2px',
        }}
      >
        {summary}
      </span>
    </button>
  )
}
