import React from 'react'

const RSVP_OPTIONS = [
  { label: "I'm In", value: 'in' },
  { label: 'Maybe', value: 'interested' },
  { label: 'Skip', value: 'skip' },
]

const RsvpButtons = ({ currentRsvp, onRsvp }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {RSVP_OPTIONS.map((opt) => {
      const isActive = currentRsvp === opt.value
      return (
        <button
          key={opt.value}
          onClick={() => onRsvp(opt.value)}
          style={{
            flex: 1,
            height: 36,
            borderRadius: 8,
            background: isActive ? '#f5f5f5' : '#1a1a1a',
            color: isActive ? '#0a0a0a' : '#666666',
            border: isActive ? 'none' : '1px solid rgba(255,255,255,0.07)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'transform 0.1s ease, background 0.15s ease',
          }}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {isActive ? '✓ ' : ''}{opt.label}
        </button>
      )
    })}
  </div>
)

export default RsvpButtons
