import React from 'react'
import Avatar from './Avatar'

const FrenBubble = ({ fren, onClick, showStatus = true }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 flex-shrink-0 group"
    style={{ transition: 'opacity 0.15s ease', width: 56 }}
  >
    <Avatar
      name={fren.name}
      config={fren.avatar_config || {}}
      size={44}
      status={showStatus ? fren.status : undefined}
    />
    <span
      className="text-center w-full overflow-hidden text-ellipsis whitespace-nowrap"
      style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 10,
        fontWeight: 500,
        color: '#666666',
        transition: 'color 0.15s ease',
      }}
    >
      {fren.name?.split(' ')[0] || '—'}
    </span>
  </button>
)

export default FrenBubble
