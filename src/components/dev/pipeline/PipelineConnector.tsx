interface PipelineConnectorProps {
  type: 'straight' | 'fork' | 'merge'
}

const ARROW = {
  width: 0,
  height: 0,
  borderTop: '5px solid transparent',
  borderBottom: '5px solid transparent',
  borderLeft: '7px solid #94a3b8',
} as const

const LINE_COLOR = '#94a3b8'

export function PipelineConnector({ type }: PipelineConnectorProps) {
  if (type === 'straight') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', width: '48px', flexShrink: 0, padding: '0 4px' }}>
        <div
          style={{
            flex: 1,
            height: '2px',
            backgroundColor: LINE_COLOR,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-1px',
              top: '-4px',
              ...ARROW,
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
            backgroundColor: LINE_COLOR,
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
            backgroundColor: LINE_COLOR,
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
            backgroundColor: LINE_COLOR,
            transform: 'translateY(-1px)',
          }}
        >
          <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...ARROW }} />
        </div>
        {/* Bottom horizontal arrow */}
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: 'calc(50% + 4px)',
            right: '4px',
            height: '2px',
            backgroundColor: LINE_COLOR,
            transform: 'translateY(1px)',
          }}
        >
          <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...ARROW }} />
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
          backgroundColor: LINE_COLOR,
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
          backgroundColor: LINE_COLOR,
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
          backgroundColor: LINE_COLOR,
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
          backgroundColor: LINE_COLOR,
          transform: 'translateY(-1px)',
        }}
      >
        <div style={{ position: 'absolute', right: '-1px', top: '-4px', ...ARROW }} />
      </div>
    </div>
  )
}
