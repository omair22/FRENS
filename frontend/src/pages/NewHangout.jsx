import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { createHangout, getHangout, updateHangoutDetails } from '../lib/api'
import Avatar from '../components/Avatar'
import DateTimePicker from '../components/DateTimePicker'
import { detectScene } from '../lib/sceneDetector'
import GamingScene from '../components/scenes/GamingScene'
import CafeScene from '../components/scenes/CafeScene'



const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MAPPING = [
  { keywords: ['food', 'pizza', 'burger', 'taco', 'eat', 'dinner', 'lunch', 'breakfast', 'hungry', 'ramen', 'sushi', 'pasta', 'brunch', 'buffet', 'snack', 'restaurant'], emoji: '🍕' },
  { keywords: ['coffee', 'cafe', 'tea', 'latte', 'starbucks', 'espresso', 'matcha', 'brew', 'caffeine', 'morning'], emoji: '☕' },
  { keywords: ['drinks', 'bar', 'beer', 'wine', 'alcohol', 'pub', 'party', 'cocktail', 'cheers', 'night out', 'club', 'tequila', 'whiskey', 'gin', 'happy hour'], emoji: '🍻' },
  { keywords: ['game', 'gaming', 'play', 'xbox', 'ps5', 'computer', 'pc', 'switch', 'nintendo', 'valorant', 'cod', 'minecraft', 'streamer', 'league', 'warzone', 'csgo', 'board game', 'cards'], emoji: '🎮' },
  { keywords: ['walk', 'park', 'hike', 'outdoor', 'stroll', 'nature', 'mountain', 'trail', 'fresh air', 'wandering', 'jog', 'running', 'run'], emoji: '🚶' },
  { keywords: ['movie', 'film', 'watch', 'cinema', 'show', 'netflix', 'theater', 'marvel', 'disney', 'horror', 'documentary'], emoji: '🎬' },
  { keywords: ['study', 'work', 'library', 'focus', 'books', 'learn', 'exam', 'class', 'lecture', 'homework', 'project', 'meeting', 'code', 'coding', 'develop', 'office'], emoji: '📚' },
  { keywords: ['gym', 'workout', 'train', 'fitness', 'lift', 'weights', 'cardio', 'strength', 'muscle', 'yoga', 'pilates', 'treadmill'], emoji: '💪' },
]



const getAutoEmoji = (title) => {
  const t = title.toLowerCase()
  for (const item of MAPPING) {
    if (item.keywords.some(k => t.includes(k))) return item.emoji
  }
  return '✨'
}


const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="toggle"
    style={{ background: value ? '#4caf7d' : '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)' }}
  >
    <div className="toggle-thumb" style={{ left: value ? 23 : 3 }} />
  </button>
)

const NewHangout = () => {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { frens, setUser, user, setToast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', emoji: '✨', location: '', notes: '', isTbd: false, invitedFrens: [], datetime: null, end_datetime: null })
  const [isPublic, setIsPublic] = useState(false)
  const [showEndTime, setShowEndTime] = useState(false)

  useEffect(() => {
    if (isEditing) return
    const auto = getAutoEmoji(form.title)
    if (auto !== form.emoji) {
      setForm(f => ({ ...f, emoji: auto }))
    }
  }, [form.title, isEditing])


  useEffect(() => {
    if (!isEditing) return

    setLoading(true)
    getHangout(id)
      .then(res => {
        const h = res.data
        setForm({ title: h.title || '', emoji: h.emoji || '🍕', location: h.location || '', notes: h.notes || '', isTbd: !h.datetime, invitedFrens: [], datetime: h.datetime || null, end_datetime: h.end_datetime || null })
        setIsPublic(h.is_public || false)
        setShowEndTime(Boolean(h.end_datetime))
      })
      .catch(() => setToast({ message: 'Failed to load', type: 'error' }))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return setToast({ message: 'Add a title', type: 'error' })
    setLoading(true)
    try {
      if (!form.isTbd && form.datetime && new Date(form.datetime) < new Date()) {
        setLoading(false)
        return setToast({ message: 'Start time cannot be in the past', type: 'error' })
      }
      const payload = { title: form.title, emoji: form.emoji, location: form.location, datetime: form.isTbd ? null : form.datetime, end_datetime: showEndTime && !form.isTbd ? form.end_datetime : null, notes: form.notes, is_public: isPublic, invitedFrenIds: form.invitedFrens }
      if (isEditing) {
        await updateHangoutDetails(id, payload)
        navigate(`/hangout/${id}`)
      } else {
        const res = await createHangout(payload)
        navigate(`/hangout/${res.data.id}`)
      }
      setToast({ message: isEditing ? 'Updated' : 'Created', type: 'success' })
    } catch {
      setToast({ message: 'Something went wrong', type: 'error' })
    } finally { setLoading(false) }
  }

  const toggleFren = (frenId) => {
    const next = form.invitedFrens.includes(frenId)
      ? form.invitedFrens.filter(f => f !== frenId)
      : [...form.invitedFrens, frenId]
    setForm({ ...form, invitedFrens: next })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '56px 20px 24px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
            color: '#666666', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <BackIcon />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
          {isEditing ? 'Edit Hangout' : 'New Hangout'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Hero Section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, margin: '0 0 40px' }}>
          {(detectScene(form.title) === 'gaming' || detectScene(form.title) === 'cafe') && (
            <div 
              className="animate-scale-pop"
              style={{ width: '100%', marginBottom: 20, overflow: 'hidden', borderRadius: 16 }}
            >
              {detectScene(form.title) === 'gaming' ? (
                <GamingScene 
                  rsvps={[{ user, response: 'in' }]} 
                  width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 40, 450) : 400}
                  height={220}
                />
              ) : (
                <CafeScene 
                  rsvps={[{ user, response: 'in' }]} 
                  width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 40, 450) : 400}
                  height={220}
                />
              )}
            </div>
          )}

          <input
            type="text"
            placeholder="Name this hangout..."
            className="glow-underline"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            style={{ 
              fontFamily: 'Syne, sans-serif', 
              fontSize: '2rem', 
              fontWeight: 800, 
              textAlign: 'center',
              width: '100%',
              color: '#f5f5f5',
              marginTop: 12
            }}
            required
            autoFocus
          />
        </div>

        <input
          type="text"
          placeholder="Where? (optional)"
          className="input-frens"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
        />


        {/* Date & Time */}
        <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: form.isTbd ? 0 : 16 }}>
            <p className="section-label">Date & Time</p>
            <button
              type="button"
              onClick={() => setForm({ ...form, isTbd: !form.isTbd })}
              style={{
                padding: '4px 12px', borderRadius: 8,
                background: form.isTbd ? '#f5f5f5' : '#1a1a1a',
                color: form.isTbd ? '#0a0a0a' : '#666666',
                border: '1px solid rgba(255,255,255,0.07)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              {form.isTbd ? 'TBD' : 'Set TBD'}
            </button>
          </div>
            {!form.isTbd && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <p className="section-label" style={{ fontSize: 10, color: '#3a3a3a', marginBottom: 8 }}>Start</p>
                  <DateTimePicker
                    initialValue={form.datetime}
                    onChange={val => setForm(f => ({ ...f, datetime: val }))}
                    defaultToNow
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showEndTime ? 8 : 0 }}>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#666666', margin: 0 }}>Add end time?</p>
                  <Toggle value={showEndTime} onChange={setShowEndTime} />
                </div>

                {showEndTime && (
                  <div style={{ marginTop: 12 }}>
                    <p className="section-label" style={{ fontSize: 10, color: '#3a3a3a', marginBottom: 8 }}>End</p>
                    <DateTimePicker
                      initialValue={form.end_datetime}
                      onChange={val => setForm(f => ({ ...f, end_datetime: val }))}
                      minDate={form.datetime ? new Date(form.datetime) : new Date()}
                    />
                  </div>
                )}
              </>
            )}
        </div>

        {/* Notes */}
        <div>
          <p className="section-label" style={{ marginBottom: 8 }}>Notes</p>
          <textarea
            placeholder="Any details..."
            className="input-frens"
            style={{ height: 88 }}
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Invite frens */}
        {!isEditing && (
          <div>
            <p className="section-label" style={{ marginBottom: 12 }}>Invite Frens</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              {frens.length === 0 ? (
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', padding: '16px', textAlign: 'center' }}>No frens yet</p>
              ) : frens.map(fren => {
                const selected = form.invitedFrens.includes(fren.id)
                return (
                  <div
                    key={fren.id}
                    onClick={() => toggleFren(fren.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      background: selected ? '#1a1a1a' : 'transparent',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Avatar name={fren.name} config={fren.avatar_config || {}} size={36} status={fren.status} />
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', flex: 1, margin: 0 }}>{fren.name}</p>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      border: selected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                      background: selected ? '#f5f5f5' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: '#0a0a0a',
                    }}>
                      {selected ? '✓' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Public toggle */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
        }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', margin: '0 0 2px' }}>
              {isPublic ? 'Public' : 'Private'}
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: 0 }}>
              {isPublic ? 'Anyone can see this' : 'Frens you invite only'}
            </p>
          </div>
          <Toggle value={isPublic} onChange={setIsPublic} />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Hangout'}
        </button>
      </form>
    </div>
  )
}


export default NewHangout
