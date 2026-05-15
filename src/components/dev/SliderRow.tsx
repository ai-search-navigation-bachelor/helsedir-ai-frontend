/** Labeled range slider row used in the weight configuration and pipeline detail panels. */
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <label
          htmlFor={id}
          style={{
            fontSize: '0.8rem',
            fontWeight: 500,
            color: disabled ? '#94a3b8' : '#475569',
            letterSpacing: '0.01em',
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: disabled ? '#94a3b8' : '#047FA4',
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
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
          accentColor: disabled ? '#94a3b8' : '#047FA4',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          height: '4px',
        }}
      />
    </div>
  )
}
