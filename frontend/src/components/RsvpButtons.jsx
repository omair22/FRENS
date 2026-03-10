import React from 'react'

const RsvpButtons = ({ currentRsvp, onRsvp }) => {
  const options = [
    { label: "I'm In", value: 'in', emoji: '✅', color: 'bg-primary-green' },
    { label: "Interested", value: 'interested', emoji: '🧐', color: 'bg-primary-yellow' },
    { label: "Skip", value: 'skip', emoji: '🤷', color: 'bg-white/10' }
  ]

  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onRsvp(opt.value)}
          className={`
            flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all duration-300
            ${currentRsvp === opt.value 
              ? `${opt.color} text-background scale-95 shadow-lg shadow-${opt.color.replace('bg-', '')}/20` 
              : 'bg-white/5 text-white/40 hover:bg-white/10 active:scale-90'}
          `}
        >
          <span className="text-sm">{opt.emoji}</span>
          <span className="text-[8px] font-black uppercase tracking-tighter">
            {currentRsvp === opt.value ? 'Selected' : opt.label}
          </span>
        </button>
      ))}
    </div>
  )
}

export default RsvpButtons
