import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { createHangout, getHangout, updateHangoutDetails } from '../lib/api'
import Avatar from '../components/Avatar'
import DateTimePicker from '../components/DateTimePicker'

const NewHangout = () => {
  const { id } = useParams()
  const isEditing = Boolean(id)

  const { frens, setToast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    emoji: '🍕',
    location: '',
    notes: '',
    isTbd: false,
    invitedFrens: [],
    datetime: null,
    end_datetime: null
  })
  const [isPublic, setIsPublic] = useState(false)
  const [showEndTime, setShowEndTime] = useState(false)

  const emqliList = ['🍕', '🍻', '☕', '🍔', '🌮', '🎨', '📽️', '🏸', '🎮', '🎸', '💃', '🚶', '🍱', '🧺', '⛸️', '🎳']

  useEffect(() => {
    if (isEditing) {
      setLoading(true)
      getHangout(id)
        .then(res => {
          const h = res.data
          setForm({
            title: h.title || '',
            emoji: h.emoji || '🍕',
            location: h.location || '',
            notes: h.notes || '',
            isTbd: !h.datetime,
            invitedFrens: [], // We won't re-invite people on edit for simplicity
            datetime: h.datetime || null,
            end_datetime: h.end_datetime || null
          })
          setIsPublic(h.is_public || false)
          setShowEndTime(Boolean(h.end_datetime))
        })
        .catch(() => setToast({ message: 'Failed to load', type: 'error' }))
        .finally(() => setLoading(false))
    }
  }, [id, isEditing, setToast])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return setToast({ message: 'Title is required! ⚠️', type: 'error' })

    setLoading(true)
    try {
      const payload = {
        title: form.title,
        emoji: form.emoji,
        location: form.location,
        datetime: form.isTbd ? null : form.datetime,
        end_datetime: showEndTime && !form.isTbd ? form.end_datetime : null,
        notes: form.notes,
        is_public: isPublic,
        invitedFrenIds: form.invitedFrens || [],
      }

      if (isEditing) {
        await updateHangoutDetails(id, payload)
        setToast({ message: 'Hangout updated! 🎉', type: 'success' })
        navigate(`/hangout/${id}`)
      } else {
        const res = await createHangout(payload)
        setToast({ message: 'Hangout created! 🎉', type: 'success' })
        navigate(`/hangout/${res.data.id}`)
      }
    } catch (err) {
      setToast({ message: isEditing ? 'Failed to update ❌' : 'Failed to create ❌', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const toggleFren = (id) => {
    const next = form.invitedFrens.includes(id)
      ? form.invitedFrens.filter(f => f !== id)
      : [...form.invitedFrens, id]
    setForm({ ...form, invitedFrens: next })
  }

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center">🔙</button>
        <h1 className="text-3xl font-display font-black italic">{isEditing ? 'EDIT HANGOUT' : 'NEW HANGOUT'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Emoji Picker */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30">The Vibe</label>
          <div className="grid grid-cols-4 gap-3">
            {emqliList.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setForm({ ...form, emoji: e })}
                className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-primary-yellow scale-110 shadow-lg shadow-primary-yellow/20 -rotate-3' : 'bg-card border border-white/5 opacity-40'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Details List */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30 block">Quick Details</label>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
            {[
              { emoji: '🍔', text: 'Grab Food' },
              { emoji: '☕', text: 'Coffee' },
              { emoji: '🍻', text: 'Drinks' },
              { emoji: '🎮', text: 'Gaming' },
              { emoji: '🚶', text: 'Take a Walk' },
              { emoji: '📽️', text: 'Watch a Movie' },
              { emoji: '🎤', text: 'Karaoke' },
              { emoji: '🏋️', text: 'Gym session' }
            ].map(tag => (
              <button
                key={tag.text}
                type="button"
                onClick={() => setForm(f => ({ ...f, emoji: tag.emoji, title: tag.text }))}
                className="flex items-center gap-2 whitespace-nowrap bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full transition-all flex-shrink-0"
              >
                <span className="text-base">{tag.emoji}</span>
                <span className="text-xs font-bold">{tag.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="What's the plan?"
            className="input-frens text-xl font-display font-bold placeholder:opacity-20"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Where?"
            className="input-frens text-sm"
            value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
          />
        </div>

        {/* Date & Time */}
        <div className="space-y-4 card-frens p-4">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-30">Date & Time</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, isTbd: !form.isTbd })}
              className={`px-3 py-1 rounded-full text-[8px] font-black uppercase transition-colors ${form.isTbd ? 'bg-primary-purple text-background' : 'bg-white/5 text-white/30'}`}
            >
              {form.isTbd ? 'TBD ON' : 'SET TBD'}
            </button>
          </div>

          {!form.isTbd && (
            <DateTimePicker
              initialValue={form.datetime}
              onChange={val => setForm(f => ({ ...f, datetime: val }))}
              defaultToNow={true}
            />
          )}

          {form.isTbd && (
            <p className="text-center text-[10px] font-bold opacity-30 py-2">Date TBD — you can set it later</p>
          )}
        </div>

        {/* End Time Toggle */}
        {!form.isTbd && (
          <div>
            <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xl">🏁</span>
                <div>
                  <p className="text-sm font-bold">End Time</p>
                  <p className="text-[10px] text-white/40">Optional — when does it wrap up?</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEndTime(!showEndTime)
                  if (!showEndTime && selectedDate && !endSelectedDate) {
                    setEndSelectedDate(selectedDate)
                  }
                }}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${showEndTime ? 'bg-primary-green' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showEndTime ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {showEndTime && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                <DateTimePicker
                  initialValue={form.end_datetime || form.datetime}
                  onChange={val => setForm(f => ({ ...f, end_datetime: val }))}
                  defaultToNow={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Extra Notes</label>
          <textarea
            placeholder="Add a note"
            className="input-frens min-h-[100px] text-sm resize-none"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Invite Frens (Hidden on Edit) */}
        {!isEditing && (
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Invite the Crew</label>
            <div className="max-h-60 overflow-y-auto no-scrollbar space-y-1 bg-card rounded-2xl border border-white/5 pb-1">
              {frens.map(fren => {
                const getClosenessLabel = (score) => {
                  if (score >= 10) return 'regular'
                  if (score >= 5) return 'often'
                  if (score >= 2) return 'sometimes'
                  return null
                }
                const isSelected = form.invitedFrens.includes(fren.id)
                return (
                  <div
                    key={fren.id}
                    onClick={() => toggleFren(fren.id)}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-white/5"
                    style={{
                      background: isSelected ? 'rgba(107,203,119,0.1)' : 'transparent',
                    }}
                  >
                    <Avatar
                      name={fren.name}
                      config={fren.avatar_config || {}}
                      size={40}
                      status={fren.status}
                    />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{fren.name}</p>
                      {getClosenessLabel(fren.closeness) && (
                        <p className="text-[10px] text-white/30 mt-0.5">
                          hang out {getClosenessLabel(fren.closeness)}
                        </p>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary-green bg-primary-green' : 'border-white/20'}`}>
                      {isSelected && <span className="text-background text-[10px] font-black">✓</span>}
                    </div>
                  </div>
                )
              })}
              {frens.length === 0 && <p className="text-[10px] font-bold opacity-20 p-4 text-center">No frens yet</p>}
            </div>
          </div>
        )}

        {/* Public / Private toggle */}
        <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-white/10">
          <div>
            <p className="font-bold text-sm">{isPublic ? '🌍 Public' : '🔒 Private'}</p>
            <p className="text-[10px] text-white/30 mt-0.5">
              {isPublic ? 'Anyone can see and join this hangout' : 'Only invited frens can see this'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic(!isPublic)}
            className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPublic ? 'bg-primary-green' : 'bg-white/10'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary bg-gradient-to-r from-primary-red to-primary-yellow text-background shadow-xl shadow-primary-red/20"
        >
          {loading ? 'Saving' : isEditing ? 'Save Changes' : 'Create Hangout'}
        </button>
      </form>
    </div>
  )
}

export default NewHangout
