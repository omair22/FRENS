import React from 'react'

const FrenBubble = ({ fren, onClick, showStatus = true, size = 'md' }) => {
  const statusColors = {
    free: 'border-primary-green',
    maybe: 'border-primary-yellow',
    busy: 'border-primary-red',
    offline: 'border-white/10'
  }

  const sizes = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl'
  }

  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 group transition-all active:scale-95 flex-shrink-0"
    >
      <div className={`
        ${sizes[size]} bg-card rounded-full flex items-center justify-center relative
        border-2 ${statusColors[fren.status || 'offline']}
        shadow-lg transition-transform group-hover:scale-110
      `}>
        {fren.emoji || '👤'}
        {showStatus && fren.status === 'free' && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-green border-2 border-background rounded-full animate-pulse" />
        )}
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter opacity-40 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden w-14 text-center">
        {fren.name?.split(' ')[0] || '...'}
      </span>
    </button>
  )
}

export default FrenBubble
