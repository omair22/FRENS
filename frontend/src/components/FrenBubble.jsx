import React from 'react'
import Avatar from './Avatar'

const FrenBubble = ({ fren, onClick, showStatus = true }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 group transition-all active:scale-95 flex-shrink-0"
  >
    <Avatar
      name={fren.name}
      config={fren.avatar_config || {}}
      size={56}
      status={showStatus ? fren.status : undefined}
      className="ring-2 ring-white/5 group-hover:ring-white/20 transition-all"
    />
    <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap w-14 text-center overflow-hidden">
      {fren.name?.split(' ')[0] || '...'}
    </span>
  </button>
)

export default FrenBubble
