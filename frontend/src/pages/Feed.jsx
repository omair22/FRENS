import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHangouts, getFrends, getSuggest, rsvpHangout, setAvailability } from '../lib/api'
import { useStore } from '../store/useStore'
import HangoutCard from '../components/HangoutCard'
import FrenBubble from '../components/FrenBubble'
import { FeedSkeleton } from '../components/Skeleton'
import Toast from '../components/Toast'

const Feed = () => {
  const { user, hangouts, frens, toast, unreadCount, setHangouts, setFrens, setToast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState(null)
  const [showAvailSheet, setShowAvailSheet] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [showPast, setShowPast] = useState(false)

  const activeHangouts = hangouts.filter(h => h.status !== 'archived')
  const archivedHangouts = hangouts.filter(h => h.status === 'archived')

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

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
    } catch (err) {
      console.error('Feed fetch error:', err)
      setToast({ message: 'Failed to sync data 💨', type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [setHangouts, setFrens, setToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRsvp = async (id, response) => {
    try {
      const updatedHangouts = hangouts.map(h => {
        if (h.id === id) {
          const others = h.rsvps.filter(r => r.user_id !== user.id)
          return { ...h, rsvps: [...others, { user_id: user.id, response, user }] }
        }
        return h
      })
      setHangouts(updatedHangouts)
      await rsvpHangout(id, response)
      setToast({ message: 'RSVP saved ✅', type: 'success' })
    } catch (err) {
      setToast({ message: 'RSVP failed ❌', type: 'error' })
      fetchData()
    }
  }

  const handleSetAvail = async (status) => {
    try {
      await setAvailability(selectedDay.toISOString().split('T')[0], status)
      setToast({ message: 'Availability updated! 🎉', type: 'success' })
      setShowAvailSheet(false)
      fetchData(true)
    } catch (err) {
      setToast({ message: 'Update failed ❌', type: 'error' })
    }
  }

  if (loading && !refreshing) return <FeedSkeleton />

  return (
    <div className="min-h-screen bg-background pb-32 safe-top relative">
      {/* Header */}
      <div className="px-6 py-6 flex justify-between items-center">
        <h1 className="text-4xl font-display font-black italic text-gradient-red-yellow">FRENS</h1>
        <button
          onClick={() => navigate('/notifications')}
          className="relative w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          🔔
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
              style={{ background: '#ff6b6b', boxShadow: '0 0 8px rgba(255,107,107,0.5)' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </button>
      </div>

      <div className="space-y-8 animate-in fade-in duration-700">
        {/* Availability Strip */}
        <div className="space-y-4">
          <h3 className="px-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Your Week</h3>
          <div className="flex gap-3 overflow-x-auto px-6 no-scrollbar pb-2">
            {days.map((date, i) => (
              <button
                key={i}
                onClick={() => { setSelectedDay(date); setShowAvailSheet(true); }}
                className="flex-shrink-0 w-12 h-20 bg-card rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/5 active:scale-95 transition-all"
              >
                <span className="text-[8px] font-black opacity-30 uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <span className="font-display font-bold text-lg">{date.getDate()}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              </button>
            ))}
          </div>
        </div>

        {/* AI Suggestion Banner */}
        {aiSuggestion && (
          <div className="px-6">
            <div className="relative glass p-6 rounded-[2rem] overflow-hidden group border-primary-purple/20">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12 group-hover:rotate-0 transition-transform">🤖</div>
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary-purple rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary-purple">AI Scheduler Suggestion</span>
                </div>
                <h2 className="text-lg font-display font-black leading-tight normal-case italic line-clamp-2">
                  "{aiSuggestion.reason}"
                </h2>
                <div className="mt-2 flex gap-2">
                  <button className="bg-primary-purple text-background px-4 py-1.5 rounded-full text-[10px] font-black uppercase active:scale-95 transition-transform">
                    Plan Now
                  </button>
                  <button onClick={() => setAiSuggestion(null)} className="text-white/30 px-2 py-1.5 rounded-full text-[10px] font-black uppercase">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Who's Free Now Bubbles */}
        <div className="space-y-4">
          <h3 className="px-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Who's Free Now</h3>
          <div className="flex gap-4 overflow-x-auto px-6 no-scrollbar pb-2">
            <FrenBubble fren={{ ...user, name: 'You', status: user.status }} onClick={() => navigate('/profile')} />
            {frens.map(fren => (
              <FrenBubble key={fren.id} fren={fren} onClick={() => navigate(`/profile/${fren.id}`)} />
            ))}
          </div>
        </div>

        {/* Hangouts List */}
        <div className="px-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">The Vibe Check</h3>
            <button onClick={() => fetchData(true)} className={`text-[10px] font-black uppercase tracking-widest opacity-30 ${refreshing ? 'animate-spin' : ''}`}>
              {refreshing ? 'Syncing...' : 'Pull to Refresh'}
            </button>
          </div>

          <div className="space-y-6">
            {activeHangouts.map(h => (
              <HangoutCard key={h.id} hangout={h} onRsvp={handleRsvp} currentUserId={user?.id} />
            ))}

            {activeHangouts.length === 0 && (
              <div className="text-center py-20 bg-card rounded-[3rem] border border-white/5 border-dashed space-y-4">
                <span className="text-5xl block animate-bounce">💨</span>
                <div className="space-y-1">
                  <p className="font-display font-black normal-case text-xl italic">Nothing planned yet 👀</p>
                  <p className="text-sm opacity-30">Drop a vibe for the crew to coordinate.</p>
                </div>
                <button
                  onClick={() => navigate('/new')}
                  className="bg-primary-red text-background px-6 py-2 rounded-full text-[10px] font-black uppercase shadow-lg shadow-primary-red/20 active:scale-95 transition-transform"
                >
                  Plan Something +
                </button>
              </div>
            )}

            {/* Past hangouts — collapsible */}
            {archivedHangouts.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-3"
                  style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📦</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-white/50">Past Hangouts</p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {archivedHangouts.length} wrapped up
                      </p>
                    </div>
                  </div>
                  <span className="text-white/25 transition-transform duration-200"
                    style={{ transform: showPast ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ›
                  </span>
                </button>

                {showPast && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                    {archivedHangouts.map(h => (
                      <HangoutCard
                        key={h.id}
                        hangout={h}
                        onRsvp={handleRsvp}
                        currentUserId={user?.id}
                        archived
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability Bottom Sheet */}
      {showAvailSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-card rounded-t-[3rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-500">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-display font-black italic">Set Availability</h2>
              <p className="text-[10px] font-black uppercase opacity-30 tracking-widest">
                {selectedDay?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'free', label: "I'm Free / Down", emoji: '🕺', color: 'bg-primary-green' },
                { id: 'maybe', label: 'Maybe / Depends', emoji: '🤔', color: 'bg-primary-yellow' },
                { id: 'busy', label: 'Busy / Locked in', emoji: '🔒', color: 'bg-primary-red' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSetAvail(s.id)}
                  className={`flex items-center gap-4 p-5 rounded-[2rem] border border-white/5 glass transition-all active:scale-[0.98] group`}
                >
                  <span className="text-3xl">{s.emoji}</span>
                  <span className="flex-1 text-left font-display font-bold">{s.label}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${s.color} text-background`}>→</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAvailSheet(false)}
              className="w-full text-[10px] font-black uppercase tracking-[0.2em] opacity-30 py-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feed
