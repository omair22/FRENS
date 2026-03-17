import React from 'react'
import Avatar from './Avatar'

const TimeProposalCard = ({ proposal, onVote, myVote, isHost, onAccept, onDelete }) => {
  const { id, datetime, label, votes } = proposal

  const inVotes = votes?.filter(v => v.interest === 'in') || []
  const maybeVotes = votes?.filter(v => v.interest === 'maybe') || []
  const outVotes = votes?.filter(v => v.interest === 'out') || []

  const dateObj = new Date(datetime)
  const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
            {label || dateStr}
          </h4>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', margin: '2px 0 0' }}>
            {timeStr}
          </p>
        </div>
        {isHost && (
          <button
            onClick={onAccept}
            className="btn-primary"
            style={{ height: 32, width: 'auto', padding: '0 12px', fontSize: 12, borderRadius: 8 }}
          >
            Pick this
          </button>
        )}
      </div>

      {/* Vote counts */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { label: 'In', count: inVotes.length, color: '#4caf7d', bg: 'rgba(76,175,125,0.1)' },
          { label: 'Maybe', count: maybeVotes.length, color: '#f5a623', bg: 'rgba(245,166,35,0.1)' },
          { label: 'Out', count: outVotes.length, color: '#ff4d4d', bg: 'rgba(255,77,77,0.1)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666' }}>
              <span style={{ color: '#f5f5f5', fontWeight: 600 }}>{s.count}</span> {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Avatar stack */}
      {(inVotes.length > 0 || maybeVotes.length > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', marginLeft: 4 }}>
            {[...inVotes, ...maybeVotes].slice(0, 6).map((v, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }}>
                <Avatar name={v.user?.name} config={v.user?.avatar_config || {}} size={24} />
              </div>
            ))}
          </div>
          {inVotes.length + maybeVotes.length > 6 && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3a3a3a' }}>
              +{inVotes.length + maybeVotes.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { id: 'in', label: 'In' },
          { id: 'maybe', label: 'Maybe' },
          { id: 'out', label: 'Out' },
        ].map(v => {
          const isActive = myVote === v.id
          return (
            <button
              key={v.id}
              onClick={() => onVote(v.id)}
              style={{
                flex: 1, height: 36, borderRadius: 8,
                background: isActive ? '#f5f5f5' : '#1a1a1a',
                color: isActive ? '#0a0a0a' : '#666666',
                border: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'transform 0.1s ease',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {v.label}
            </button>
          )
        })}
      </div>

      {isHost && (
        <button
          onClick={onDelete}
          style={{
            alignSelf: 'center', background: 'none', border: 'none',
            fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: '#3a3a3a',
            cursor: 'pointer', padding: '4px 8px'
          }}
        >
          Remove proposal
        </button>
      )}
    </div>
  )
}

export default TimeProposalCard
