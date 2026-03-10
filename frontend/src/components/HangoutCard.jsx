import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import RsvpButtons from './RsvpButtons'

const HangoutCard = ({ hangout, onRsvp, currentUserId, archived = false }) => {
  const navigate = useNavigate()
  const { id, title, emoji, location, datetime, end_datetime, rsvps, creator, is_public } = hangout

  const going = rsvps?.filter(r => r.response === 'going' || r.response === 'in') || []
  const interested = rsvps?.filter(r => r.response === 'interested') || []
  const notGoing = rsvps?.filter(r => r.response === 'skip' || r.response === 'out') || []

  const getDuration = (start, end) => {
    if (!start || !end) return ''
    const mins = Math.round((new Date(end) - new Date(start)) / 60000)
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    const remaining = mins % 60
    return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`
  }

  const dateObj = datetime ? new Date(datetime) : null
  const dateString = dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD 🗓️'
  const timeString = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
  const endTimeStr = end_datetime ? new Date(end_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''

  const myRsvp = rsvps?.find(r => r.user_id === currentUserId)?.response

  return (
    <div
      className="card-frens group relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700"
      style={{
        background: archived ? '#131118' : '',
        border: archived ? '1px solid rgba(255,255,255,0.04)' : '',
        opacity: archived ? 0.65 : 1,
        filter: archived ? 'saturate(0.5)' : 'none'
      }}
    >
      {/* Left accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary-red shadow-[0_0_15px_rgba(255,107,107,0.5)]" />

      <Link to={`/hangout/${id}`} className="block space-y-4">
        {/* Header row */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4">
            <span className="text-5xl drop-shadow-2xl transition-transform group-hover:scale-110 duration-500">
              {emoji || '✨'}
            </span>
            <div className="flex-1 min-w-0">
              {archived && (
                <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                  📦 Past
                </span>
              )}
              <h3 className="text-xl font-display font-black leading-none mb-1 group-hover:text-primary-red transition-colors truncate">
                {title}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-1">
                📍 {location || 'TBD'}
              </p>
              {/* Creator */}
              {creator && (
                <div
                  className="flex items-center gap-1.5 mt-1 w-fit cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${creator.id}`) }}
                >
                  <Avatar name={creator?.name} config={creator?.avatar_config || {}} size={20} />
                  <span className="text-[9px] text-white/30 font-bold">
                    by {creator.name} {creator.id === currentUserId && '(me)'}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Visibility badge */}
          <span className="text-[8px] font-black uppercase px-2 py-1 rounded-full bg-white/5 text-white/30 flex-shrink-0">
            {is_public ? '🌍' : '🔒'}
          </span>
        </div>

        {/* Date + attendee stacks */}
        <div className="flex items-center gap-2">
          <div className="bg-white/5 rounded-2xl px-4 py-2 flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-tighter text-white/30">When</span>
            <span className="text-sm font-bold text-primary-yellow">
              {dateString}
              {timeString && (
                <span className="text-white/80">
                  {` · ${timeString}`}
                  {endTimeStr && (
                    <span className="text-white/40 font-normal">
                      {' - '}{endTimeStr}
                      {' · '}{getDuration(datetime, end_datetime)}
                    </span>
                  )}
                </span>
              )}
            </span>
          </div>

          {/* Stacked going avatars */}
          <div className="flex -space-x-2 ml-auto">
            {going.slice(0, 4).map((r, i) => (
              <div key={i}
                className="w-7 h-7 rounded-full border-2 border-card overflow-hidden bg-card cursor-pointer hover:scale-110 hover:z-20 transition-transform relative z-10"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${r.user?.id}`) }}
              >
                <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={28} />
              </div>
            ))}
            {going.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-card bg-white/10 flex items-center justify-center text-[9px] font-black">
                +{going.length - 4}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* RSVP summary counts */}
      <div className="flex gap-3 px-1 mb-3 mt-2">
        <span className="text-[10px] font-black text-primary-green">✅ {going.length}</span>
        <span className="text-[10px] font-black text-primary-yellow">👀 {interested.length}</span>
        <span className="text-[10px] font-black text-white/20">❌ {notGoing.length}</span>
      </div>

      {!archived && (
        <div className="pt-3 border-t border-white/5">
          <RsvpButtons currentRsvp={myRsvp} onRsvp={(res) => onRsvp(id, res)} />
        </div>
      )}
    </div>
  )
}

export default HangoutCard
