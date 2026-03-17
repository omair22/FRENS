import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHangouts, getFrends, getSuggest, rsvpHangout, setAvailability } from '../lib/api'
import { useStore } from '../store/useStore'
import HangoutCard from '../components/HangoutCard'
import FrenBubble from '../components/FrenBubble'
import { FeedSkeleton } from '../components/Skeleton'

const FILTERS = ['All', 'Today', 'This Week']

const BellIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const Feed = () => {
  const { user, hangouts, frens, unreadCount, setHangouts, setFrens, setToast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [showAvailSheet, setShowAvailSheet] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showPast, setShowPast] = useState(false)
  const [activeFilter, setActiveFilter] = useState('All')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  const firstName = user?.name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const activeHangouts = hangouts.filter(h => {
    if (h.status === 'archived') return false
    if (activeFilter === 'Today') {
      return h.datetime && new Date(h.datetime).toDateString() === new Date().toDateString()
    }
    if (activeFilter === 'This Week') {
      const end = new Date()
      end.setDate(end.getDate() + 7)
      return h.datetime && new Date(h.datetime) <= end
    }
    return true
  })
  const archivedHangouts = hangouts.filter(h => h.status === 'archived')

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const [hangoutsRes, frensRes, aiRes] = await Promise.all([
        getHangouts(),
        getFrends(),
        getSuggest().catch(() => ({ data: null }))
      ])
      setHangouts(hangoutsRes.data)
      setFrens(frensRes.data)
      if (aiRes.data) setAiSuggestion(aiRes.data)
    } catch {
      setToast({ message: 'Failed to load feed', type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [setHangouts, setFrens, setToast])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRsvp = async (id, response) => {
    try {
      const updated = hangouts.map(h => {
        if (h.id !== id) return h
        const others = h.rsvps.filter(r => r.user_id !== user.id)
        return { ...h, rsvps: [...others, { user_id: user.id, response, user }] }
      })
      setHangouts(updated)
      await rsvpHangout(id, response)
    } catch {
      setToast({ message: 'RSVP failed', type: 'error' })
      fetchData()
    }
  }

  const handleSetAvail = async (status) => {
    try {
      await setAvailability(selectedDay.toISOString().split('T')[0], status)
      setToast({ message: 'Updated', type: 'success' })
      setShowAvailSheet(false)
      fetchData(true)
    } catch {
      setToast({ message: 'Update failed', type: 'error' })
    }
  }

  if (loading && !refreshing) return <FeedSkeleton />

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 96 }}>

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 20px 12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
            {greeting}, {firstName}
          </h1>
          <button
            onClick={() => navigate('/notifications')}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: unreadCount > 0 ? '#f5f5f5' : '#666666',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: 2, right: 2,
                width: 8, height: 8, borderRadius: '50%',
                background: '#ff4d4d', border: '2px solid #0a0a0a',
              }} />
            )}
          </button>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`pill ${activeFilter === f ? 'pill-active' : 'pill-inactive'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* ── Availability Strip ── */}
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <p className="section-label" style={{ marginBottom: 12 }}>Your Week</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px' }}>
            {days.map((date, i) => {
              const isToday = i === 0
              return (
                <button
                  key={i}
                  onClick={() => { setSelectedDay(date); setShowAvailSheet(true) }}
                  style={{
                    flexShrink: 0,
                    width: 52,
                    height: 72,
                    borderRadius: 12,
                    background: isToday ? '#1a1a1a' : '#111111',
                    border: isToday ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#3a3a3a' }}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span style={{
                    fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700,
                    color: isToday ? '#f5f5f5' : '#666666',
                  }}>
                    {date.getDate()}
                  </span>
                  <div style={{
                    width: 4, height: 4, borderRadius: '50%',
                    background: isToday ? '#f5f5f5' : 'rgba(255,255,255,0.1)',
                  }} />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Fren Status Strip ── */}
        {frens.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Who's Around</p>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 4px' }}>
              <FrenBubble fren={{ ...user, name: 'You' }} onClick={() => navigate('/profile')} />
              {frens.map(f => (
                <FrenBubble key={f.id} fren={f} onClick={() => navigate(`/profile/${f.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* ── AI Suggestion ── */}
        {aiSuggestion && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/new')}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>✦</span>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', margin: 0, flex: 1, lineHeight: 1.4 }}>
                {aiSuggestion.reason}
              </p>
              <span style={{ color: '#3a3a3a', fontSize: 18, flexShrink: 0 }}>→</span>
            </div>
          </div>
        )}

        {/* ── Hangouts ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p className="section-label">
              {activeFilter === 'All' ? 'Upcoming' : activeFilter}
            </p>
            <button
              onClick={() => fetchData(true)}
              style={{
                fontFamily: 'DM Sans, sans-serif', fontSize: 12,
                color: '#3a3a3a', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              {refreshing ? '...' : 'Refresh'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activeHangouts.map(h => (
              <HangoutCard key={h.id} hangout={h} onRsvp={handleRsvp} currentUserId={user?.id} />
            ))}

            {activeHangouts.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '48px 20px',
                border: '1px dashed rgba(255,255,255,0.07)',
                borderRadius: 12,
              }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', marginBottom: 8 }}>
                  Nothing planned
                </p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', marginBottom: 24 }}>
                  Drop a vibe for the crew.
                </p>
                <button
                  onClick={() => navigate('/new')}
                  className="btn-primary"
                  style={{ width: 'auto', padding: '0 24px', display: 'inline-flex' }}
                >
                  Plan something
                </button>
              </div>
            )}
          </div>

          {/* Past hangouts */}
          {archivedHangouts.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <button
                onClick={() => setShowPast(!showPast)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <p className="section-label" style={{ margin: 0 }}>Archived · {archivedHangouts.length}</p>
                <span style={{ color: '#3a3a3a', transform: showPast ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>›</span>
              </button>
              {showPast && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {archivedHangouts.map(h => (
                    <HangoutCard key={h.id} hangout={h} onRsvp={handleRsvp} currentUserId={user?.id} archived />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Availability Sheet ── */}
      {showAvailSheet && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowAvailSheet(false)}
        >
          <div style={{ width: '100%', maxWidth: 448, background: '#111111', borderRadius: '20px 20px 0 0', padding: '0 20px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', marginBottom: 4 }}>
              Set Availability
            </h2>
            <p className="section-label" style={{ marginBottom: 24 }}>
              {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {[
                { id: 'free', label: "I'm Free", sublabel: 'Down for anything', dot: '#4caf7d' },
                { id: 'maybe', label: 'Maybe', sublabel: 'Depends on the plan', dot: '#f5a623' },
                { id: 'busy', label: 'Busy', sublabel: 'Not available', dot: '#ff4d4d' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSetAvail(s.id)}
                  style={{
                    padding: '14px 16px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', gap: 12,
                    cursor: 'pointer',
                    transition: 'transform 0.1s ease',
                    textAlign: 'left',
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>{s.label}</p>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: 0 }}>{s.sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAvailSheet(false)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: '#3a3a3a', fontFamily: 'DM Sans, sans-serif', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
