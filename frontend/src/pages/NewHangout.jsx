import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { createHangout } from '../lib/api'

const NewHangout = () => {
  const { frens, setToast } = useStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    emoji: '🍕',
    location: '',
    notes: '',
    isTbd: false,
    invitedFrens: []
  })
  const [isPublic, setIsPublic] = useState(false)

  // Date/time picker state
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHour, setSelectedHour] = useState('7')
  const [selectedMinute, setSelectedMinute] = useState('00')
  const [selectedAmPm, setSelectedAmPm] = useState('PM')

  const emojis = ['🍕', '🍻', '☕', '🍔', '🌮', '🎨', '📽️', '🏸', '🎮', '🎸', '💃', '🚶', '🍱', '🧺', '⛸️', '🎳']

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  const hours = ['1','2','3','4','5','6','7','8','9','10','11','12']
  const minutes = ['00','15','30','45']

  const buildDatetime = () => {
    if (!selectedDate) return null
    const d = new Date(selectedDate)
    let h = parseInt(selectedHour)
    if (selectedAmPm === 'PM' && h < 12) h += 12
    if (selectedAmPm === 'AM' && h === 12) h = 0
    d.setHours(h, parseInt(selectedMinute), 0, 0)
    return d.toISOString()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return setToast({ message: 'Title is required! ⚠️', type: 'error' })
    
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        emoji: form.emoji,
        location: form.location,
        datetime: form.isTbd ? null : buildDatetime(),
        notes: form.notes,
        is_public: isPublic
      }
      
      const res = await createHangout(payload)
      setToast({ message: 'Hangout created! 🎉', type: 'success' })
      navigate(`/hangout/${res.data.id}`)
    } catch (err) {
      setToast({ message: 'Failed to create ❌', type: 'error' })
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

  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const monthLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center">🔙</button>
        <h1 className="text-3xl font-display font-black italic">DROP A VIBE</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pb-20">
        {/* Emoji Picker */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30">The Vibe</label>
          <div className="grid grid-cols-4 gap-3">
            {emojis.map(e => (
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
            <div className="space-y-4">
              {/* Day Scroller */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                {days.map((d, i) => {
                  const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString()
                  const isToday = i === 0
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedDate(d)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 w-14 py-3 rounded-2xl transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-red text-background scale-105 shadow-lg shadow-primary-red/30'
                          : 'bg-white/5 border border-white/5 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="text-[8px] font-black uppercase tracking-wider">
                        {isToday ? 'Today' : dayLabels[d.getDay()]}
                      </span>
                      <span className="text-lg font-display font-black leading-none">{d.getDate()}</span>
                      <span className="text-[8px] opacity-60">{monthLabels[d.getMonth()]}</span>
                    </button>
                  )
                })}
              </div>

              {/* Time Picker */}
              {selectedDate && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-30 text-center">
                    What time?
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {/* Hour */}
                    <div className="flex flex-wrap gap-1.5 justify-center max-w-[120px]">
                      {hours.map(h => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setSelectedHour(h)}
                          className={`w-9 h-9 rounded-xl text-sm font-black transition-all duration-150 ${
                            selectedHour === h
                              ? 'bg-primary-yellow text-background scale-110 shadow-md shadow-primary-yellow/30'
                              : 'bg-white/5 opacity-40 hover:opacity-80'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>

                    <div className="text-2xl font-display font-black opacity-20">:</div>

                    {/* Minute */}
                    <div className="flex flex-col gap-1.5">
                      {minutes.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSelectedMinute(m)}
                          className={`w-14 h-9 rounded-xl text-sm font-black transition-all duration-150 ${
                            selectedMinute === m
                              ? 'bg-primary-yellow text-background shadow-md shadow-primary-yellow/30'
                              : 'bg-white/5 opacity-40 hover:opacity-80'
                          }`}
                        >
                          :{m}
                        </button>
                      ))}
                    </div>

                    {/* AM/PM */}
                    <div className="flex flex-col gap-1.5">
                      {['AM','PM'].map(period => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setSelectedAmPm(period)}
                          className={`w-12 h-9 rounded-xl text-[11px] font-black transition-all duration-150 ${
                            selectedAmPm === period
                              ? 'bg-primary-green text-background shadow-md shadow-primary-green/30'
                              : 'bg-white/5 opacity-40 hover:opacity-80'
                          }`}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="text-center text-primary-yellow font-display font-black text-sm opacity-80">
                    {dayLabels[selectedDate.getDay()]}, {monthLabels[selectedDate.getMonth()]} {selectedDate.getDate()} at {selectedHour}:{selectedMinute} {selectedAmPm}
                  </div>
                </div>
              )}

              {!selectedDate && (
                <p className="text-center text-[10px] font-bold opacity-20 py-2">Pick a day above ↑</p>
              )}
            </div>
          )}

          {form.isTbd && (
            <p className="text-center text-[10px] font-bold opacity-30 py-2">Date TBD — you can set it later</p>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Extra Notes</label>
          <textarea
            placeholder="Any specific vibes/bring-your-own stuff?"
            className="input-frens min-h-[100px] text-sm resize-none"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* Invite Frens */}
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest opacity-30 px-1">Invite the Crew</label>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {frens.map(fren => (
              <button
                key={fren.id}
                type="button"
                onClick={() => toggleFren(fren.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 group transition-all ${form.invitedFrens.includes(fren.id) ? 'scale-110' : 'opacity-40'}`}
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-colors ${form.invitedFrens.includes(fren.id) ? 'bg-primary-red border-primary-red shadow-lg shadow-primary-red/20' : 'bg-card border-white/5'}`}>
                  {fren.emoji}
                </div>
                <span className="text-[8px] font-black uppercase">{fren.name.split(' ')[0]}</span>
              </button>
            ))}
            {frens.length === 0 && <p className="text-[10px] font-bold opacity-20">Add some frens first!</p>}
          </div>
        </div>

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
          {loading ? 'Dropping Vibe...' : 'Drop Vibe 🤘'}
        </button>
      </form>
    </div>
  )
}

export default NewHangout
