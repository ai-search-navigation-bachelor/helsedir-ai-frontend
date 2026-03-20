interface PipelineConnectorProps {
  type: 'straight' | 'fork' | 'merge'
  dimmed?: boolean
}

const LINE_COLOR = '#94a3b8'
const DIMMED_COLOR = '#e2e8f0'

function arrowStyle(color: string) {
  return {
    width: 0,
    height: 0,
    borderTop: '5px solid transparent',
    borderBottom: '5px solid transparent',
    borderLeft: `7px solid ${color}`,
  } as const
}

export function PipelineConnector({ type, dimmed }: PipelineConnectorProps) {
  const color = dimmed ? DIMMED_COLOR : LINE_COLOR

  if (type === 'straight') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '48px', flexShrink: 0, padding: '0 4px' }}>
        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor: color,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-1px',
              top: '-4px',
              ...arrowStyle(color),
            }}
          />
        </div>
      </div>
    )
  }

  if (type === 'fork') {
    // Query splits into two: one arrow up-right to BM25, one arrow down-right to Semantic
    return (
      <div
        style={{
          width: '48px',
          flexShrink: 0,
          position: 'relative',
          alignSelf: 'stretch',
          padding: '0 4px',
        }}
      >
        {/* Horizontal line from left edge to center */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '4px',
            width: '50%',
            height: '2px',
            backgroundColor: color,
            transform: 'translateY(-1px)',
          }}
        />
        {/* Vertical line from center-top to center-bottom */}
        <div
          style={{
            position: 'absolute',
            left: 'calc(50% + 4px)',
            top: '20%',
            bottom: '20%',
            width: '2px',
            backgroundColor: color,
            transform: 'translateX(-1px)',
          }}
        />
        {/* Top horizontal arrow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: 'calc(50% + 4px)',
            right: '4px',
            height: '2px',
            backgroundColor: color,
            transform: 'translateY(-1px)',
          }}
        >
          <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...arrowStyle(color) }} />
        </div>
        {/* Bottom horizontal arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: 'calc(50% + 4px)',
            right: '4px',
            height: '2px',
            backgroundColor: color,
            transform: 'translateY(1px)',
          }}
        >
          <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...arrowStyle(color) }} />
        </div>
      </div>
    )
  }

  // merge: two lines converging into one arrow
  return (
    <div
      style={{
        width: '48px',
        flexShrink: 0,
        position: 'relative',
        alignSelf: 'stretch',
        padding: '0 4px',
      }}
    >
      {/* Top horizontal line to center */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '4px',
          width: '50%',
          height: '2px',
          backgroundColor: color,
          transform: 'translateY(-1px)',
        }}
      />
      {/* Bottom horizontal line to center */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '4px',
          width: '50%',
          height: '2px',
          backgroundColor: color,
          transform: 'translateY(1px)',
        }}
      />
      {/* Vertical merge line */}
      <div
        style={{
          position: 'absolute',
          left: 'calc(50% + 4px)',
          top: '20%',
          bottom: '20%',
          width: '2px',
          backgroundColor: color,
          transform: 'translateX(-1px)',
        }}
      />
      {/* Output arrow from center to right */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 'calc(50% + 4px)',
          right: '4px',
          height: '2px',
          backgroundColor: color,
          transform: 'translateY(-1px)',
        }}
      >
        <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...arrowStyle(color) }} />
      </div>
    </div>
  )
}
