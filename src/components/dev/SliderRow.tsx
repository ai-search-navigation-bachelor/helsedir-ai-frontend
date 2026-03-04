import { ds, colors } from '../../styles/dsTokens'

interface SliderRowProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function SliderRow({ id, label, value, min, max, step, onChange, disabled }: SliderRowProps) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}
      >
        <label
          htmlFor={id}
          style={{
            fontSize: '0.875rem',
            fontWeight: 500,
            color: disabled ? colors.textSubtle : colors.text,
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: disabled ? colors.textSubtle : ds.color('logobla-1', 'text-default'),
            minWidth: '44px',
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: disabled ? colors.borderSubtle : ds.color('logobla-2', 'base-default'),
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      />
    </div>
  )
}
