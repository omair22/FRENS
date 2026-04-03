import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import RsvpButtons from './RsvpButtons'
import CountdownTimer from './CountdownTimer'
import { detectScene } from '../lib/sceneDetector'
import GamingScene from './scenes/GamingScene'

const HangoutCard = ({ hangout, onRsvp, currentUserId, archived = false }) => {
  const navigate = useNavigate()
  const { id, title, emoji, location, datetime, end_datetime, rsvps, creator, is_public } = hangout

  const going = rsvps?.filter(r => r.response === 'going' || r.response === 'in') || []
  const interested = rsvps?.filter(r => r.response === 'interested') || []
  const notGoing = rsvps?.filter(r => r.response === 'skip' || r.response === 'out') || []

  const dateObj = datetime ? new Date(datetime) : null
  const isToday = dateObj && new Date().toDateString() === dateObj.toDateString()
  const dateLabel = dateObj
    ? isToday
      ? 'Today at ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
        (datetime ? ' · ' + dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '')
    : 'Date TBD'

  const myRsvp = rsvps?.find(r => r.user_id === currentUserId)?.response
  const sceneType = detectScene(title)
  const hasScene = sceneType !== 'default'

  return (
    <div
      style={{
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        overflow: 'hidden',
        opacity: archived ? 0.5 : 1,
      }}
    >
      {hasScene && sceneType === 'gaming' && (
        <GamingScene
          rsvps={rsvps || []}
          width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 40, 408) : 368}
          height={200}
        />
      )}
      <Link to={`/hangout/${id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ padding: 16 }}>

          {/* Top row: emoji + title + chip */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{emoji || '✨'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#f5f5f5',
                  margin: 0,
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {title}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className="chip" style={{ flexShrink: 0 }}>
                {is_public ? 'Public' : 'Private'}
              </span>
              <CountdownTimer targetDate={datetime} />
            </div>
          </div>

          {/* Second row: date */}
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', margin: '0 0 12px 36px' }}>
            {dateLabel} {location ? `· ${location}` : ''}
          </p>

          {/* Third row: avatar stack + count */}
          {going.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 36, marginBottom: 12 }}>
              <div style={{ display: 'flex' }}>
                {going.slice(0, 5).map((r, i) => (
                  <div
                    key={i}
                    style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i, position: 'relative' }}
                    onClick={e => { e.preventDefault(); navigate(`/profile/${r.user?.id}`) }}
                  >
                    <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={24} />
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666' }}>
                {going.length} going
                {interested.length > 0 ? ` · ${interested.length} maybe` : ''}
              </span>
            </div>
          )}

          {creator && (
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 36, marginBottom: going.length > 0 ? 0 : 4, cursor: 'pointer' }}
              onClick={e => { e.preventDefault(); navigate(`/profile/${creator.id}`) }}
            >
              <Avatar name={creator.name} config={creator.avatar_config || {}} size={16} />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a' }}>
                {creator.name}{creator.id === currentUserId ? ' (you)' : ''}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Bottom row: RSVP buttons */}
      {!archived && (
        <div style={{ padding: '0 16px 16px' }}>
          <RsvpButtons currentRsvp={myRsvp} onRsvp={(res) => onRsvp(id, res)} />
        </div>
      )}
    </div>
  )
}

export default HangoutCard
