import React from 'react'
import { Link } from 'react-router-dom'
import RsvpButtons from './RsvpButtons'

const HangoutCard = ({ hangout, onRsvp }) => {
  const { id, title, emoji, location, datetime, rsvps, vibe_options } = hangout
  
  const going = rsvps?.filter(r => r.response === 'going') || []
  const interested = rsvps?.filter(r => r.response === 'interested') || []
  
  const dateObj = datetime ? new Date(datetime) : null
  const dateString = dateObj 
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'TBD 🗓️'
  const timeString = dateObj
    ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : ''

  const myRsvp = rsvps?.find(r => r.user_id === hangout.my_id)?.response

  return (
    <div className="card-frens group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary-red shadow-[0_0_15px_rgba(255,107,107,0.5)]" />
      
      <Link to={`/hangout/${id}`} className="block space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <span className="text-5xl drop-shadow-2xl transition-transform group-hover:scale-110 duration-500">
              {emoji || '✨'}
            </span>
            <div>
              <h3 className="text-xl font-display font-black leading-none mb-1 group-hover:text-primary-red transition-colors">
                {title}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1">
                📍 {location || 'TBD'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/5 rounded-2xl px-4 py-2 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter text-white/30">When</span>
            <span className="text-sm font-bold text-primary-yellow">{dateString} {timeString && `· ${timeString}`}</span>
          </div>
          
          <div className="flex -space-x-3 ml-auto">
            {going.slice(0, 3).map((r, i) => (
              <div 
                key={i} 
                className="w-8 h-8 rounded-full border-2 border-card bg-background flex items-center justify-center text-sm"
                title={r.user?.name}
              >
                {r.user?.emoji || '👤'}
              </div>
            ))}
            {going.length > 3 && (
              <div className="w-8 h-8 rounded-full border-2 border-card bg-white/10 flex items-center justify-center text-[10px] font-black">
                +{going.length - 3}
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="pt-4 mt-2 border-t border-white/5 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-30 px-1">
          <span>Crew Status</span>
          <span>{going.length} going · {interested.length} interested</span>
        </div>
        
        <RsvpButtons 
          currentRsvp={myRsvp} 
          onRsvp={(res) => onRsvp(id, res)} 
        />
      </div>
    </div>
  )
}

export default HangoutCard
