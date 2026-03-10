import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getHangout, rsvpHangout, addVibeOption, voteVibeOption,
  deleteHangout, toggleVisibility, updateHangoutStatus,
  addHost, removeHost, addIdea, voteOnIdea, getFrends,
  getStops, addStop, deleteStop, inviteToHangout,
  updateHangoutDetails, getTimeProposals, addTimeProposal,
  voteOnTime, deleteTimeProposal, acceptTime, acceptIdea
} from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'
import BottomSheet from '../components/BottomSheet'
import RangeSlider from '../components/RangeSlider'
import TimeProposalCard from '../components/TimeProposalCard'
import DateTimePicker from '../components/DateTimePicker'

// ─── Helpers ─────────────────────────────────
const formatTimeRange = (start, end) => {
  if (!start) return 'TBD'
  const startStr = new Date(start).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short'
  }) + ' · ' + new Date(start).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  })
  if (!end) return startStr
  const endStr = new Date(end).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  })
  // Check if same day
  const sameDay = new Date(start).toDateString() === new Date(end).toDateString()
  return sameDay
    ? startStr + ' – ' + endStr
    : startStr + ' → ' + new Date(end).toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
}

const getDuration = (start, end) => {
  if (!start || !end) return ''
  const mins = Math.round((new Date(end) - new Date(start)) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remaining = mins % 60
  return remaining > 0 ? `${hrs}h ${remaining}m` : `${hrs}h`
}

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const fmt = (iso) => {
  if (!iso) return 'TBD 🗓️'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const StatusBadge = ({ status }) => {
  const map = { planning: ['🗓️ Planning', 'bg-primary-yellow/10 text-primary-yellow'], locked: ['🔒 Locked', 'bg-primary-red/10 text-primary-red'], happening: ['⚡ Happening', 'bg-primary-green/10 text-primary-green'] }
  const [label, cls] = map[status] || map.planning
  return <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${cls}`}>{label}</span>
}

// ─── Avatar Row ───────────────────────────────
const AvatarRow = ({ rsvps, size = 'sm', max = 6 }) => {
  const visible = rsvps.slice(0, max)
  const extra = rsvps.length - visible.length
  return (
    <div className="flex -space-x-2 items-center">
      {visible.map((r, i) => (
        <div key={i} title={r.user?.name} className="border-2 border-background rounded-full overflow-hidden flex-shrink-0">
          <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={size} />
        </div>
      ))}
      {extra > 0 && <div className="w-7 h-7 rounded-full border-2 border-background bg-white/10 flex items-center justify-center text-[9px] font-black ml-1">+{extra}</div>}
    </div>
  )
}

// ─── Idea Card ────────────────────────────────
const IdeaCard = ({ idea, hangoutId, currentUserId, onVoted }) => {
  const navigate = useNavigate()
  const inVotes = idea.votes?.filter(v => v.vote === 'in') || []
  const interestedVotes = idea.votes?.filter(v => v.vote === 'interested') || []
  const outVotes = idea.votes?.filter(v => v.vote === 'out') || []
  const total = idea.votes?.length || 0
  const myVote = idea.votes?.find(v => v.user_id === currentUserId)?.vote

  const handleVote = async (vote) => {
    try { await voteOnIdea(hangoutId, idea.id, vote); onVoted() } catch (e) { console.error(e) }
  }

  return (
    <div className="card-frens p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{idea.emoji || '💡'}</span>
          <div>
            <h4 className="font-display font-black text-lg leading-tight">{idea.title}</h4>
            {idea.description && <p className="text-[11px] opacity-50 mt-0.5">{idea.description}</p>}
            {(idea.location || idea.proposed_datetime) && (
              <p className="text-[10px] font-black uppercase opacity-30 mt-1 flex gap-3">
                {idea.location && <span>📍 {idea.location}</span>}
                {idea.proposed_datetime && <span>🕐 {fmt(idea.proposed_datetime)}</span>}
              </p>
            )}
          </div>
        </div>
        {idea.creator && (
          <div className="flex items-center gap-1.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/profile/${idea.creator?.id}`)}>
            <Avatar name={idea.creator?.name} config={idea.creator?.avatar_config || {}} size={24} />
            <span className="text-[8px] opacity-30 font-black uppercase">
              {idea.creator.name?.split(' ')[0]} {idea.creator.id === currentUserId && '(me)'}
            </span>
          </div>
        )}
      </div>

      {/* Vote bars */}
      {total > 0 && (
        <div className="space-y-1.5">
          {[['in', '✅', inVotes, 'bg-primary-green'], ['interested', '👀', interestedVotes, 'bg-primary-yellow'], ['out', '❌', outVotes, 'bg-primary-red']].map(([key, icon, votes, color]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[9px] w-4">{icon}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: total ? `${(votes.length / total) * 100}%` : '0%' }} />
              </div>
              <span className="text-[9px] font-black opacity-40 w-4">{votes.length}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vote buttons */}
      <div className="flex gap-2">
        {[['in', '✅ In'], ['interested', '👀 Maybe'], ['out', '❌ Out']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => handleVote(v)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${myVote === v ? 'bg-white/15 border border-white/20 scale-95' : 'bg-white/5 opacity-50 hover:opacity-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Host accept idea button */}
      {idea.hangout_host_or_creator && (
        <button
          onClick={async () => {
            try {
              await acceptIdea(hangoutId, idea.id)
              onVoted() // Refresh hangout
              // The toast will be handled in the parent assuming we pass a toast fn or we could just silently update it.
            } catch (e) {
              console.error(e)
            }
          }}
          className="mt-2 w-full py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-all"
          style={{
            border: '1px solid rgba(107,203,119,0.2)',
            color: '#6bcb77',
            background: 'rgba(107,203,119,0.05)'
          }}
        >
          Accept this idea
        </button>
      )}
    </div>
  )
}

// ─── Add Idea Form ────────────────────────────
const AddIdeaForm = ({ hangoutId, onAdded, onClose }) => {
  const [form, setForm] = useState({ title: '', emoji: '💡', description: '', location: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try { await addIdea(hangoutId, form); onAdded() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const ideaEmojis = ['💡', '🍕', '🍻', '☕', '🎬', '🎮', '🏖️', '🏔️', '🎨', '🎸', '⚽', '🍱']

  return (
    <form onSubmit={handleSubmit} className="card-frens p-5 space-y-4 border border-white/10 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-black italic">Suggest an idea</h4>
        <button type="button" onClick={onClose} className="text-white/30 hover:text-white">✕</button>
      </div>
      {/* Emoji row */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {ideaEmojis.map(e => (
          <button key={e} type="button" onClick={() => setForm(f => ({ ...f, emoji: e }))}
            className={`text-2xl w-10 h-10 rounded-xl flex-shrink-0 transition-all ${form.emoji === e ? 'bg-white/15 scale-110' : 'opacity-40'}`}>{e}</button>
        ))}
      </div>
      <input required placeholder="Idea title *" className="input-frens" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
      <input placeholder="Location (optional)" className="input-frens" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      <textarea placeholder="Details (optional)" className="input-frens resize-none min-h-[72px] text-sm" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      <button type="submit" disabled={loading || !form.title} className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-2xl font-black text-sm transition-all disabled:opacity-30">
        {loading ? 'Adding...' : '＋ Add Idea'}
      </button>
    </form>
  )
}

// ─── Co-host Modal ────────────────────────────
const CoHostModal = ({ hangoutId, currentHosts, onClose, onAdded }) => {
  const [frens, setFrens] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getFrends().then(r => setFrens(r.data)).catch(() => { }) }, [])

  const hostIds = currentHosts.map(h => h.user_id)
  const filtered = frens.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = async (userId) => {
    setLoading(true)
    try { await addHost(hangoutId, userId); onAdded() } catch (e) { console.error(e) } finally { setLoading(false) }
  }
  const handleRemove = async (userId) => {
    setLoading(true)
    try { await removeHost(hangoutId, userId); onAdded() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center" onClick={onClose}>
      <div className="w-full max-w-md bg-background rounded-t-[2.5rem] p-6 space-y-4 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-display font-black italic text-xl">Add Co-host 👑</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl">✕</button>
        </div>
        <input type="text" placeholder="Search frens..." className="input-frens" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar">
          {filtered.map(f => {
            const getClosenessLabel = (score) => {
              if (score >= 10) return 'regular'
              if (score >= 5) return 'often'
              if (score >= 2) return 'sometimes'
              return null
            }

            const isHost = hostIds.includes(f.id)
            return (
              <div key={f.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3 text-left">
                  <Avatar name={f.name} config={f.avatar_config || {}} size={40} status={f.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{f.name}</span>
                      {isHost && <span className="text-[8px] bg-primary-yellow/20 text-primary-yellow font-black uppercase px-2 py-0.5 rounded-full">👑 Host</span>}
                    </div>
                    {getClosenessLabel(f.closeness) && (
                      <p className="text-[10px] text-white/30 mt-0.5 font-normal">
                        hang out {getClosenessLabel(f.closeness)}
                      </p>
                    )}
                  </div>
                </div>
                {isHost ? (
                  <button onClick={() => handleRemove(f.id)} disabled={loading} className="text-[10px] font-black text-primary-red/70 hover:text-primary-red uppercase px-3 py-1.5 rounded-xl bg-primary-red/10">Remove</button>
                ) : (
                  <button onClick={() => handleAdd(f.id)} disabled={loading} className="text-[10px] font-black text-primary-green uppercase px-3 py-1.5 rounded-xl bg-primary-green/10">Add</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────
const HangoutDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setToast, setActiveFab } = useStore()
  const [hangout, setHangout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myRsvp, setMyRsvp] = useState(null)
  const [showRsvpSheet, setShowRsvpSheet] = useState(false)
  const [pendingResponse, setPendingResponse] = useState(null)
  const [rsvpOptions, setRsvpOptions] = useState({
    full_hangout: true,
    arriving_at: '',
    leaving_at: '',
    out_reason: ''
  })
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [showCoHostModal, setShowCoHostModal] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Invites ──
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [frens, setFrens] = useState([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [selectedInvites, setSelectedInvites] = useState([])

  // ── Stops / Itinerary ──
  const [stops, setStops] = useState([])
  const [stopsExpanded, setStopsExpanded] = useState(false)
  const [showAddStop, setShowAddStop] = useState(false)
  const [newStop, setNewStop] = useState({ title: '', emoji: '📍', location: '', notes: '' })

  // ── Inline Edit (Host) ──
  const [editingTitle, setEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [editingTime, setEditingTime] = useState(false)
  const [draftDatetime, setDraftDatetime] = useState('')
  const [draftEndDatetime, setDraftEndDatetime] = useState('')
  const [savingDetails, setSavingDetails] = useState(false)

  // ── Time Poll ──
  const [timePollExpanded, setTimePollExpanded] = useState(false)
  const [timeProposals, setTimeProposals] = useState([])
  const [showAddTimeProposal, setShowAddTimeProposal] = useState(false)
  const [newProposal, setNewProposal] = useState({ datetime: '', label: '' })
  const [myTimeVotes, setMyTimeVotes] = useState({})

  const fetchHangout = async () => {
    try {
      const [res, tpRes] = await Promise.all([
        getHangout(id),
        getTimeProposals(id).catch(() => ({ data: [] }))
      ])
      setHangout(res.data)
      const found = res.data.rsvps?.find(r => r.user_id === user?.id)
      setMyRsvp(found || null)

      // Time proposals
      if (tpRes && tpRes.data) {
        setTimeProposals(tpRes.data)
        const votesMap = {}
        tpRes.data.forEach(p => {
          const myVote = p.votes?.find(v => v.user_id === user?.id)
          if (myVote) votesMap[p.id] = myVote.interest
        })
        setMyTimeVotes(votesMap)
      }

    } catch (err) {
      setToast({ message: 'Failed to load hangout ❌', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const fetchStops = async () => {
    try {
      if (!id) return
      const res = await getStops(id)
      setStops(res.data || [])
    } catch (_) { }
  }

  useEffect(() => { fetchHangout() }, [id])
  useEffect(() => { fetchStops() }, [id])

  // Fetch frens for inviting
  useEffect(() => {
    const checkIsAdmin = () => {
      if (!hangout || !user) return false
      if (hangout.created_by === user.id) return true
      const hostIds = (hangout.hosts || []).map(h => h.user_id)
      return hostIds.includes(user.id)
    }

    if (checkIsAdmin() && showInviteModal && frens.length === 0) {
      getFrends().then(res => setFrens(res.data || [])).catch(() => { })
    }
  }, [hangout, user, showInviteModal])

  useEffect(() => {
    if (!hangout || !user) {
      setActiveFab(null)
      return
    }

    const hostIds = (hangout.hosts || []).map(h => h.user_id)
    const isHostOrCreator = hangout.created_by === user.id || hostIds.includes(user.id)

    setActiveFab(isHostOrCreator ? {
      icon: '⚙️',
      onClick: () => {
        setShowAdmin(true)
        // Scroll to bottom where admin settings are
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100)
      }
    } : null)

    return () => setActiveFab(null)
  }, [hangout, user, id, setActiveFab, setShowAdmin])

  if (loading) return <div className="p-6 space-y-6 pb-32 max-w-md mx-auto"><Skeleton className="h-40" /><Skeleton className="h-32" /><Skeleton className="h-48" /></div>
  if (!hangout) return <div className="p-6 text-center opacity-30 pt-20"><span className="text-4xl block">🤷</span><p className="mt-4 font-black">Hangout not found</p></div>

  const isCreator = hangout.created_by === user?.id
  const hostIds = (hangout.hosts || []).map(h => h.user_id)
  const isHost = hostIds.includes(user?.id)
  const isAdmin = isCreator || isHost

  const going = hangout.rsvps?.filter(r => r.response === 'in' || r.response === 'going') || []
  const interested = hangout.rsvps?.filter(r => r.response === 'interested') || []
  const notGoing = hangout.rsvps?.filter(r => r.response === 'out' || r.response === 'skip') || []

  const handleRsvpTap = (response) => {
    setPendingResponse(response)
    if (response === 'interested') {
      submitRsvp({ response })
    } else {
      setShowRsvpSheet(true)
    }
  }

  const submitRsvp = async (rsvpData) => {
    try {
      const res = await rsvpHangout(id, rsvpData)
      setMyRsvp(res.data.rsvp)

      setHangout(prev => ({
        ...prev,
        rsvps: prev.rsvps
          .filter(r => r.user?.id !== user.id)
          .concat({
            ...res.data.rsvp,
            user: user
          })
      }))

      const toastMessages = {
        in: rsvpData.full_hangout === false ? "⏰ You're in for part of it!" : "✅ You're in!",
        interested: "👀 Marked as interested!",
        skip: rsvpData.out_reason
          ? `❌ Out — "${rsvpData.out_reason}"`
          : "❌ Marked as out"
      }
      setToast({ message: toastMessages[rsvpData.response], type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to update RSVP', type: 'error' })
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${hangout.title}"? This cannot be undone.`)) return
    setActionLoading(true)
    try {
      await deleteHangout(id)
      setToast({ message: 'Hangout deleted 🗑️', type: 'info' })
      navigate('/')
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Delete failed', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleVisibility = async () => {
    const newVal = !hangout.is_public
    try {
      await toggleVisibility(id, newVal)
      setHangout(h => ({ ...h, is_public: newVal }))
      setToast({ message: newVal ? '🌍 Now public' : '🔒 Now private', type: 'info' })
    } catch (err) {
      setToast({ message: 'Failed to change visibility', type: 'error' })
    }
  }

  const handleSendInvites = async () => {
    if (selectedInvites.length === 0) return
    setActionLoading(true)
    try {
      await inviteToHangout(id, selectedInvites)
      setToast({ message: 'Invites sent! 📨', type: 'success' })
      setShowInviteModal(false)
      setSelectedInvites([])
      fetchHangout() // Refresh RSVP list
    } catch (err) {
      setToast({ message: 'Failed to send invites', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setToast({ message: 'Link copied to clipboard! 📋', type: 'success' })
  }

  const handleAddStop = async () => {
    if (!newStop.title.trim()) return
    try {
      await addStop(id, { ...newStop })
      setNewStop({ title: '', emoji: '📍', location: '', notes: '' })
      setShowAddStop(false)
      fetchStops()
      setToast({ message: 'Stop added ✅', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to add stop', type: 'error' })
    }
  }

  const handleDeleteStop = async (stopId) => {
    try {
      setStops(s => s.filter(x => x.id !== stopId))
      await deleteStop(id, stopId)
    } catch (err) {
      setToast({ message: 'Failed to remove stop', type: 'error' })
      fetchStops()
    }
  }

  const handleStatusChange = async (status) => {
    try {
      await updateHangoutStatus(id, status)
      setHangout(h => ({ ...h, status }))
      setToast({ message: `Status: ${status} ✅`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to update status', type: 'error' })
    }
  }

  const handleSaveTitle = async () => {
    if (!draftTitle.trim()) return
    setSavingDetails(true)
    try {
      await updateHangoutDetails(hangout.id, { title: draftTitle.trim() })
      setHangout(prev => ({ ...prev, title: draftTitle.trim() }))
      setEditingTitle(false)
      setToast({ message: 'Name updated ✅', type: 'success' })
    } catch {
      setToast({ message: 'Failed to update', type: 'error' })
    } finally {
      setSavingDetails(false)
    }
  }

  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())
  const minDate = today.toISOString().slice(0, 16)
  const maxDate = new Date(
    today.getFullYear() + 5,
    today.getMonth(),
    today.getDate()
  ).toISOString().slice(0, 16)

  return (
    <div className="pb-32 max-w-md mx-auto safe-top animate-in fade-in duration-500">

      {/* ── Archived Banner ── */}
      {hangout.status === 'archived' && (
        <div className="mx-4 mt-3 px-4 py-3 rounded-2xl flex items-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)'
          }}
        >
          <span className="text-xl">📦</span>
          <div>
            <p className="text-sm font-bold text-white/50">This hangout has wrapped up</p>
            <p className="text-[11px] text-white/25 mt-0.5">
              {hangout.datetime
                ? 'Was on ' + new Date(hangout.datetime).toLocaleDateString('en-GB', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })
                : 'Now archived'}
            </p>
          </div>
        </div>
      )}

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-b from-card to-background px-6 pt-6 pb-8 space-y-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center mb-2">🔙</button>

        <div className="flex items-start gap-4">
          <span className="text-6xl drop-shadow-2xl">{hangout.emoji || '✨'}</span>
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle()
                    if (e.key === 'Escape') setEditingTitle(false)
                  }}
                  autoFocus
                  maxLength={60}
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 
                    font-display font-black text-2xl text-white outline-none"
                />
                <button onClick={handleSaveTitle} disabled={savingDetails}
                  className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background: '#6bcb77', color: '#0a1a0d' }}>
                  ✓
                </button>
                <button onClick={() => setEditingTitle(false)}
                  className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-sm">
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group mb-2">
                <h1 className="text-3xl font-display font-black italic leading-tight">{hangout.title}</h1>
                {isAdmin && hangout.status !== 'archived' && (
                  <button
                    onClick={() => { setDraftTitle(hangout.title); setEditingTitle(true) }}
                    className="w-7 h-7 flex-shrink-0 rounded-lg bg-white/5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit name">
                    ✏️
                  </button>
                )}
              </div>
            )}
            {/* Creator row */}
            {hangout.creator && (
              <div className="flex items-center gap-1.5 mt-2 w-fit cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/profile/${hangout.creator?.id}`)}>
                <Avatar name={hangout.creator?.name} config={hangout.creator?.avatar_config || {}} size={24} />
                <span className="text-[10px] font-black uppercase opacity-40">by {hangout.creator.name} {hangout.creator.id === user?.id && '(me)'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={hangout.status} />
              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-white/5 text-white/30">
                {hangout.is_public ? '🌍 Public' : '🔒 Private'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick info */}
        <div className="space-y-2 text-[11px] font-black uppercase opacity-40">
          <div className="flex items-center gap-2 group">
            <p>🕐 {fmt(hangout.datetime)}</p>
            {isAdmin && hangout.status !== 'archived' && (
              <button
                onClick={() => {
                  setDraftDatetime(hangout.datetime ? new Date(hangout.datetime).toISOString().slice(0, 16) : '')
                  setDraftEndDatetime(hangout.end_datetime ? new Date(hangout.end_datetime).toISOString().slice(0, 16) : '')
                  setEditingTime(true)
                }}
                className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ✏️
              </button>
            )}
          </div>
          {hangout.location && <p>📍 {hangout.location}</p>}
        </div>

        {/* Co-hosts row */}
        {hangout.hosts?.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase opacity-30">Hosted by</span>
            <div className="flex -space-x-2">
              {hangout.hosts.map((h, i) => (
                <div key={i} className="relative cursor-pointer hover:scale-105 transition-transform z-10 hover:z-20" onClick={() => navigate(`/profile/${h.user?.id}`)}>
                  <div className="border-2 border-background rounded-full overflow-hidden">
                    <Avatar name={h.user?.name} config={h.user?.avatar_config || {}} size={32} />
                  </div>
                  <span className="absolute -top-1 -right-1 text-[8px]">👑</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && (
          <div className="flex gap-2 pt-2 flex-wrap">
            <button onClick={handleDelete} disabled={actionLoading}
              className="flex items-center gap-1 text-[9px] font-black uppercase px-3 py-2 rounded-xl bg-primary-red/10 text-primary-red hover:bg-primary-red/20 transition-all">
              🗑️ Delete
            </button>
            <button onClick={handleToggleVisibility}
              className="flex items-center gap-1 text-[9px] font-black uppercase px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              {hangout.is_public ? '🔒 Make Private' : '🌍 Make Public'}
            </button>
            {isCreator && (
              <button onClick={() => setShowCoHostModal(true)}
                className="flex items-center gap-1 text-[9px] font-black uppercase px-3 py-2 rounded-xl bg-primary-yellow/10 text-primary-yellow hover:bg-primary-yellow/20 transition-all">
                👑 Co-host
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── ITINERARY / STOPS ── */}
      {(stops.length > 0 || isAdmin) && (
        <div className="mx-6 mt-2">
          <button
            onClick={() => setStopsExpanded(!stopsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors"
            style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">🗺️</span>
              <div className="text-left">
                <p className="text-sm font-bold">Itinerary</p>
                <p className="text-[10px] text-white/30 mt-0.5">
                  {stops.length === 0 ? 'No stops yet' : `${stops.length} stop${stops.length > 1 ? 's' : ''} planned`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stops.length > 0 && (
                <div className="flex -space-x-1">
                  {stops.slice(0, 3).map(s => (
                    <div key={s.id} className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: '#1d1928', border: '1.5px solid #0e0c14' }}>
                      {s.emoji}
                    </div>
                  ))}
                </div>
              )}
              <span className="text-white/30 text-sm transition-transform duration-200"
                style={{ transform: stopsExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            </div>
          </button>

          {stopsExpanded && (
            <div className="mt-2 space-y-0 animate-in slide-in-from-top-2 duration-200">
              {stops.map((stop, i) => (
                <div key={stop.id} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center flex-shrink-0" style={{ width: 32 }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm z-10"
                      style={{ background: '#1d1928', border: '2px solid rgba(255,255,255,0.1)' }}>
                      {stop.emoji}
                    </div>
                    {i < stops.length - 1 && (
                      <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.07)', minHeight: 16 }} />
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-sm">{stop.title}</p>
                        {stop.location && <p className="text-[10px] opacity-30 mt-0.5">📍 {stop.location}</p>}
                        {stop.notes && <p className="text-[10px] opacity-40 mt-1">{stop.notes}</p>}
                        {stop.start_time && (
                          <p className="text-[10px] text-primary-blue mt-1">
                            🕐 {new Date(stop.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        )}
                      </div>
                      {isAdmin && (
                        <button onClick={() => handleDeleteStop(stop.id)}
                          className="text-[9px] opacity-20 hover:opacity-60 px-2 py-1 rounded-lg">✕</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add stop */}
              {isAdmin && hangout.status !== 'archived' && !showAddStop && (
                <button onClick={() => setShowAddStop(true)}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-[13px] font-semibold"
                  style={{ border: '1.5px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                  Add stop
                </button>
              )}

              {isAdmin && showAddStop && (
                <div className="p-4 rounded-2xl space-y-3" style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <input
                    placeholder="Stop name (e.g. Dinner at Mario's)"
                    className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm outline-none border border-white/10 focus:border-white/20"
                    value={newStop.title}
                    onChange={e => setNewStop(s => ({ ...s, title: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <input
                      placeholder="📍 Location"
                      className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-xs outline-none border border-white/10"
                      value={newStop.location}
                      onChange={e => setNewStop(s => ({ ...s, location: e.target.value }))}
                    />
                    <select
                      className="bg-white/5 rounded-xl px-2 py-2 text-sm outline-none border border-white/10"
                      value={newStop.emoji}
                      onChange={e => setNewStop(s => ({ ...s, emoji: e.target.value }))}
                    >
                      {['📍', '🍕', '🎬', '☕', '🎮', '🏖️', '🎵', '🍻', '🛍️', '⚽'].map(e => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    placeholder="Notes (optional)"
                    className="w-full bg-white/5 rounded-xl px-3 py-2 text-xs outline-none border border-white/10"
                    value={newStop.notes}
                    onChange={e => setNewStop(s => ({ ...s, notes: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleAddStop}
                      className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase bg-primary-green text-background">
                      Add Stop
                    </button>
                    <button onClick={() => setShowAddStop(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-black uppercase bg-white/5 opacity-40">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="px-6 space-y-8">

        {/* ── RSVP Groups ── */}
        <div className="space-y-4">
          {/* Going */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-green">✅ Going ({going.length})</h3>
              {isAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-bold transition-all text-white flex items-center gap-1.5"
                >
                  <span className="text-primary-green">+</span> Invite
                </button>
              )}
            </div>
            {going.length > 0 ? (
              <div className="space-y-1">
                {going.map((r, i) => {
                  const isThisUserHost = hostIds.includes(r.user?.id) || hangout.created_by === r.user?.id
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors active:scale-95" onClick={() => navigate(`/profile/${r.user?.id}`)}>
                      <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={36} status={r.user?.status} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 pr-2">
                          <p className="text-sm font-semibold truncate leading-tight flex items-center gap-1 flex-wrap">
                            {r.user?.name}
                            {r.user?.id === user?.id && <span className="text-[10px] italic opacity-50 font-normal">(me)</span>}
                          </p>
                          {isThisUserHost && (
                            <span className="text-[8px] font-black bg-white/10 text-white/50 px-1.5 py-0.5 rounded uppercase tracking-widest shrink-0">Host</span>
                          )}
                        </div>
                        {r.full_hangout === false ? (
                          <p className="text-[10px] text-yellow-400/70 uppercase font-black tracking-widest">
                            ⏰ Partial
                            {r.arriving_at ? ' · from ' + formatTime(r.arriving_at) : ''}
                            {r.leaving_at ? ' · until ' + formatTime(r.leaving_at) : ''}
                          </p>
                        ) : (
                          <p className="text-[10px] text-green-400/60 uppercase font-black tracking-widest">Full hangout 🙌</p>
                        )}
                      </div>

                      {/* Creator controls: Make Host */}
                      {isCreator && hangout.created_by !== r.user?.id && (
                        <button
                          onClick={async () => {
                            try {
                              if (isThisUserHost) {
                                if (!confirm(`Remove ${r.user?.name} as co-host?`)) return
                                await removeHost(id, r.user?.id)
                                setToast({ message: `Removed ${r.user?.name} from hosts`, type: 'info' })
                              } else {
                                if (!confirm(`Make ${r.user?.name} a co-host? They will be able to invite people and edit details.`)) return
                                await addHost(id, r.user?.id)
                                setToast({ message: `${r.user?.name} is now a host! 👑`, type: 'success' })
                              }
                              fetchHangout()
                            } catch (e) {
                              setToast({ message: e.response?.data?.error || e.message || 'Error updating host status', type: 'error' })
                            }
                          }}
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all ${isThisUserHost
                            ? 'bg-primary-red/20 text-primary-red hover:bg-primary-red/30'
                            : 'bg-primary-blue/20 text-primary-blue hover:bg-primary-blue/30'
                            }`}
                        >
                          {isThisUserHost ? 'Revoke Host' : '+ Make Host'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : <p className="text-[10px] opacity-20 font-black italic">No one yet</p>}
          </div>

          {/* Interested */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-yellow">👀 Interested ({interested.length})</h3>
            </div>
            {interested.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {interested.map((r, i) => (
                  <div key={i}
                    className="flex flex-col items-center gap-1 opacity-70 cursor-pointer hover:opacity-100 transition-opacity active:scale-95"
                    onClick={() => navigate(`/profile/${r.user?.id}`)}>
                    <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={32} />
                    <span className="text-[8px] font-black uppercase opacity-40 text-center leading-tight">
                      {r.user?.name?.split(' ')[0]}
                      {r.user?.id === user?.id && <div className="lowercase italic opacity-60">(me)</div>}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] opacity-20 font-black italic">No one yet</p>}
          </div>

          {/* Not Going */}
          {notGoing.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-2">❌ Not Going ({notGoing.length})</h3>
              <div className="space-y-1">
                {notGoing.map((r, i) => (
                  <div key={i}
                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors active:scale-95"
                    onClick={() => navigate(`/profile/${r.user?.id}`)}>
                    <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={36} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white/50">
                        {r.user?.name}
                        {r.user?.id === user?.id && <span className="text-[10px] italic opacity-50 font-normal ml-1">(me)</span>}
                      </p>
                      {r.out_reason && (
                        <p className="text-[10px] text-white/30">
                          💬 {r.out_reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RSVP Buttons ── */}
        {hangout.status !== 'archived' && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30">Your RSVP</h3>
            <div className="flex gap-3">
              {[
                { response: 'in', label: "I'm In", activeColor: '#6bcb77', activeBg: 'rgba(107,203,119,0.15)' },
                { response: 'interested', label: 'Maybe', activeColor: '#ffd93d', activeBg: 'rgba(255,217,61,0.15)' },
                { response: 'skip', label: "I'm Out", activeColor: '#ff6b6b', activeBg: 'rgba(255,107,107,0.15)' },
              ].map(btn => (
                <button
                  key={btn.response}
                  onClick={() => handleRsvpTap(btn.response)}
                  className="flex-1 py-3 rounded-2xl font-display font-black text-[10px] uppercase transition-all border"
                  style={{
                    background: myRsvp?.response === btn.response ? btn.activeBg : 'rgba(255,255,255,0.04)',
                    borderColor: myRsvp?.response === btn.response ? btn.activeColor + '60' : 'rgba(255,255,255,0.08)',
                    color: myRsvp?.response === btn.response ? btn.activeColor : 'rgba(255,255,255,0.5)',
                    boxShadow: myRsvp?.response === btn.response ? `0 0 16px ${btn.activeColor}25` : 'none'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {myRsvp && (
              <div className="mt-2 text-center pb-2">
                {myRsvp.response === 'in' && !myRsvp.full_hangout && (
                  <p className="text-[10px] uppercase font-black text-white/40">
                    ⏰ You're joining
                    {myRsvp.arriving_at ? ' from ' + formatTime(myRsvp.arriving_at) : ''}
                    {myRsvp.leaving_at ? ' until ' + formatTime(myRsvp.leaving_at) : ''}
                    {' '}· <button onClick={() => handleRsvpTap('in')} className="text-white/60 underline">edit</button>
                  </p>
                )}
                {myRsvp.response === 'skip' && myRsvp.out_reason && (
                  <p className="text-[10px] uppercase font-black text-white/40">
                    💬 "{myRsvp.out_reason}"
                    · <button onClick={() => handleRsvpTap('skip')} className="text-white/60 underline">edit</button>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Notes ── */}
        {hangout.notes && (
          <div className="card-frens p-4">
            <p className="text-[10px] font-black uppercase opacity-30 mb-2">Notes</p>
            <p className="text-sm opacity-70">{hangout.notes}</p>
          </div>
        )}

        {/* ── Ideas Poll ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-black italic text-xl">💡 Ideas</h3>
              <p className="text-[10px] opacity-30 font-black uppercase">Vote on what to do</p>
            </div>
            <button
              onClick={() => setShowAddIdea(v => !v)}
              className="text-[9px] font-black uppercase px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
            >
              ＋ Suggest
            </button>
          </div>

          {showAddIdea && (
            <AddIdeaForm
              hangoutId={id}
              onAdded={() => { setShowAddIdea(false); fetchHangout() }}
              onClose={() => setShowAddIdea(false)}
            />
          )}

          {(hangout.ideas || []).length === 0 && !showAddIdea && (
            <div className="text-center py-10 opacity-20 space-y-2">
              <span className="text-4xl block">🤔</span>
              <p className="text-[10px] font-black uppercase">No ideas yet — be the first!</p>
            </div>
          )}

          {(hangout.ideas || []).map(idea => (
            <IdeaCard
              key={idea.id}
              idea={{ ...idea, hangout_host_or_creator: isAdmin }}
              hangoutId={id}
              currentUserId={user?.id}
              onVoted={() => {
                fetchHangout()
                setToast({ message: 'Idea locked in! 💡', type: 'success' })
              }}
            />
          ))}
        </div>

        {/* ── Time Poll ── */}
        {hangout.status !== 'archived' && (timeProposals.length > 0 || true) && (
          <div className="mt-4">
            <button
              onClick={() => setTimePollExpanded(!timePollExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors"
              style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🗳️</span>
                <div className="text-left">
                  <p className="text-sm font-bold">Time Poll</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {timeProposals.length === 0
                      ? 'Suggest a time, let frens vote'
                      : `${timeProposals.length} time${timeProposals.length > 1 ? 's' : ''} proposed`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {timeProposals.filter(p => myTimeVotes[p.id] === undefined).length > 0 && (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: '#ff6b6b', color: '#fff' }}>
                    {timeProposals.filter(p => myTimeVotes[p.id] === undefined).length}
                  </div>
                )}
                <span className="text-white/30 transition-transform duration-200 text-sm"
                  style={{ transform: timePollExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                  ›
                </span>
              </div>
            </button>

            {timePollExpanded && (
              <div className="mt-2 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {timeProposals.length === 0 && (
                  <p className="text-center text-sm text-white/25 py-4">
                    No times proposed yet — be the first!
                  </p>
                )}

                {timeProposals.map(proposal => (
                  <TimeProposalCard
                    key={proposal.id}
                    proposal={proposal}
                    myVote={myTimeVotes[proposal.id]}
                    isCreatorOrHost={isAdmin}
                    currentUserId={user?.id}
                    hangoutId={hangout.id}
                    onVote={async (interest) => {
                      setMyTimeVotes(prev => ({ ...prev, [proposal.id]: interest }))
                      try {
                        await voteOnTime(hangout.id, proposal.id, interest)
                        const res = await getTimeProposals(hangout.id)
                        setTimeProposals(res.data)
                      } catch {
                        setToast({ message: 'Vote failed', type: 'error' })
                      }
                    }}
                    onAccept={async () => {
                      try {
                        await acceptTime(hangout.id, proposal.id)
                        setHangout(prev => ({ ...prev, datetime: proposal.proposed_datetime }))
                        setToast({ message: '📅 Time locked in!', type: 'success' })
                        setTimeProposals([])
                        setTimePollExpanded(false)
                      } catch {
                        setToast({ message: 'Failed to accept time', type: 'error' })
                      }
                    }}
                    onDelete={async () => {
                      try {
                        await deleteTimeProposal(hangout.id, proposal.id)
                        setTimeProposals(prev => prev.filter(p => p.id !== proposal.id))
                      } catch {
                        setToast({ message: 'Failed to delete', type: 'error' })
                      }
                    }}
                  />
                ))}

                <button
                  onClick={() => setShowAddTimeProposal(true)}
                  className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors text-sm font-bold"
                  style={{ border: '1.5px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}
                >
                  ＋ Suggest a time
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Admin Panel ── */}
        {isAdmin && (
          <div className="space-y-3">
            <button
              onClick={() => setShowAdmin(v => !v)}
              className="w-full flex items-center justify-between p-4 card-frens text-left"
            >
              <span className="text-[10px] font-black uppercase opacity-40">⚙️ Admin Settings</span>
              <span className="text-white/30">{showAdmin ? '▲' : '▼'}</span>
            </button>

            {showAdmin && (
              <div className="card-frens p-5 space-y-4 animate-in fade-in duration-200">
                {/* Status change */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase opacity-30">Change Status</p>
                  <div className="flex gap-2">
                    {['planning', 'locked', 'happening'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${hangout.status === s ? 'bg-white/15 border border-white/20' : 'bg-white/5 opacity-50 hover:opacity-100'}`}
                      >
                        {s === 'planning' ? '🗓️' : s === 'locked' ? '🔒' : '⚡'} {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit */}
                <button
                  onClick={() => navigate(`/hangout/${id}/edit`)}
                  className="w-full py-3 bg-white/10 text-white rounded-2xl font-black text-sm hover:bg-white/20 transition-all border border-white/10"
                >
                  ✏️ Edit Details
                </button>

                {/* Delete */}
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="w-full py-3 bg-primary-red/10 text-primary-red rounded-2xl font-black text-sm hover:bg-primary-red/20 transition-all"
                >
                  🗑️ Delete Hangout
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Co-host modal */}
      {showCoHostModal && (
        <CoHostModal
          hangoutId={id}
          currentHosts={hangout.hosts || []}
          onClose={() => setShowCoHostModal(false)}
          onAdded={() => { setShowCoHostModal(false); fetchHangout() }}
        />
      )}

      {/* ── RSVP Detail Bottom Sheet ── */}
      {showRsvpSheet && pendingResponse === 'in' && (
        <BottomSheet onClose={() => setShowRsvpSheet(false)} title="You're In! 🎉">
          <p className="text-xs text-white/40 mb-3">Are you staying for the whole thing?</p>

          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setRsvpOptions(p => ({ ...p, full_hangout: true }))}
              className="flex-1 py-3 rounded-2xl font-bold text-sm border transition-all"
              style={{
                background: rsvpOptions.full_hangout ? 'rgba(107,203,119,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: rsvpOptions.full_hangout ? '#6bcb77' : 'rgba(255,255,255,0.08)',
                color: rsvpOptions.full_hangout ? '#6bcb77' : 'rgba(255,255,255,0.4)'
              }}
            >
              🙌 Full Hangout
            </button>
            <button
              onClick={() => setRsvpOptions(p => ({ ...p, full_hangout: false }))}
              className="flex-1 py-3 rounded-2xl font-bold text-sm border transition-all"
              style={{
                background: !rsvpOptions.full_hangout ? 'rgba(255,217,61,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: !rsvpOptions.full_hangout ? '#ffd93d' : 'rgba(255,255,255,0.08)',
                color: !rsvpOptions.full_hangout ? '#ffd93d' : 'rgba(255,255,255,0.4)'
              }}
            >
              ⏰ Part of It
            </button>
          </div>

          {!rsvpOptions.full_hangout && (
            <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
              <RangeSlider
                minTime={hangout.datetime || new Date().toISOString()}
                maxTime={hangout.end_datetime || null}
                defaultStart={rsvpOptions.arriving_at || hangout.datetime || new Date().toISOString()}
                defaultEnd={rsvpOptions.leaving_at || hangout.end_datetime || null}
                onChange={(times) => setRsvpOptions(p => ({
                  ...p,
                  arriving_at: times.arriving_at,
                  leaving_at: times.leaving_at
                }))}
              />
            </div>
          )}

          <button
            onClick={() => {
              const arriving = rsvpOptions.arriving_at && !rsvpOptions.full_hangout
                ? rsvpOptions.arriving_at
                : null

              const leaving = rsvpOptions.leaving_at && !rsvpOptions.full_hangout
                ? rsvpOptions.leaving_at
                : null

              submitRsvp({
                response: 'in',
                full_hangout: rsvpOptions.full_hangout,
                arriving_at: arriving,
                leaving_at: leaving
              })
              setShowRsvpSheet(false)
            }}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6bcb77, #4caf50)',
              color: '#0a1a0d',
              boxShadow: '0 6px 20px rgba(107,203,119,0.3)'
            }}
          >
            Confirm
          </button>
        </BottomSheet>
      )}

      {showRsvpSheet && pendingResponse === 'skip' && (
        <BottomSheet onClose={() => setShowRsvpSheet(false)} title="Can't make it 😢">
          <p className="text-xs text-white/40 mb-3">Let your frens know why (optional)</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {[
              '😴 Tired', '💸 Broke', '🤒 Not feeling well',
              '🏠 Staying in', '💼 Working', '🚗 No ride',
              '👨‍👩‍👧 Family stuff', '📚 Studying'
            ].map(reason => (
              <button
                key={reason}
                onClick={() => setRsvpOptions(p => ({
                  ...p,
                  out_reason: p.out_reason === reason ? '' : reason
                }))}
                className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all"
                style={{
                  background: rsvpOptions.out_reason === reason
                    ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: rsvpOptions.out_reason === reason
                    ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.08)',
                  color: rsvpOptions.out_reason === reason
                    ? '#ff6b6b' : 'rgba(255,255,255,0.4)'
                }}
              >
                {reason}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={
              ['😴', '💸', '🤒', '🏠', '💼', '🚗', '👨', '📚'].some(e => rsvpOptions.out_reason.startsWith(e))
                ? '' : rsvpOptions.out_reason
            }
            onChange={e => setRsvpOptions(p => ({ ...p, out_reason: e.target.value }))}
            placeholder="Or type your own reason..."
            maxLength={100}
            className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30 mb-5"
          />

          <button
            onClick={() => {
              submitRsvp({
                response: 'skip',
                out_reason: rsvpOptions.out_reason || null
              })
              setShowRsvpSheet(false)
            }}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95"
            style={{
              background: 'rgba(255,107,107,0.15)',
              color: '#ff6b6b',
              border: '1.5px solid rgba(255,107,107,0.3)'
            }}
          >
            Can't make it this time
          </button>
        </BottomSheet>
      )}

      {/* ── Invite Frens Modal ── */}
      {showInviteModal && (
        <BottomSheet onClose={() => setShowInviteModal(false)} title="Invite Frens 📨">
          <div className="space-y-4 pb-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 hover:bg-white/10 transition-all font-bold text-sm"
            >
              📋 Copy Hangout Link
            </button>

            <div className="text-center opacity-30 text-xs font-black uppercase tracking-widest">— OR —</div>

            <input
              type="text"
              placeholder="Search your frens..."
              value={inviteSearch}
              onChange={e => setInviteSearch(e.target.value)}
              className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30"
            />

            <div className="max-h-[40vh] overflow-y-auto no-scrollbar space-y-2">
              {frens
                .filter(f => f.name.toLowerCase().includes(inviteSearch.toLowerCase()))
                // Don't show frens who are already in the hangout rsvp list (going, invited, etc)
                .filter(f => !hangout.rsvps?.some(r => r.user_id === f.id))
                .map(f => {
                  const getClosenessLabel = (score) => {
                    if (score >= 10) return 'regular'
                    if (score >= 5) return 'often'
                    if (score >= 2) return 'sometimes'
                    return null
                  }

                  const isSelected = selectedInvites.includes(f.id)
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedInvites(prev =>
                          isSelected ? prev.filter(id => id !== f.id) : [...prev, f.id]
                        )
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border"
                      style={{
                        background: isSelected ? 'rgba(107,203,119,0.1)' : 'rgba(255,255,255,0.02)',
                        borderColor: isSelected ? 'rgba(107,203,119,0.3)' : 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3 text-left">
                        <Avatar name={f.name} config={f.avatar_config || {}} size={40} status={f.status} />
                        <div className="flex-1">
                          <p className="font-bold text-sm">{f.name}</p>
                          {getClosenessLabel(f.closeness) && (
                            <p className="text-[10px] text-white/30 mt-0.5 font-normal">
                              hang out {getClosenessLabel(f.closeness)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'border-primary-green bg-primary-green' : 'border-white/20'}`}>
                        {isSelected && <span className="text-background text-[10px] font-black">✓</span>}
                      </div>
                    </div>
                  )
                })}
              {frens.length > 0 && frens.filter(f => !hangout.rsvps?.some(r => r.user_id === f.id)).length === 0 && (
                <p className="text-center pt-8 text-xs font-bold opacity-30">All your frens are already invited!</p>
              )}
            </div>

            <button
              onClick={handleSendInvites}
              disabled={selectedInvites.length === 0 || actionLoading}
              className={`w-full py-4 rounded-2xl font-black text-sm transition-all ${selectedInvites.length > 0
                ? 'bg-primary-green text-background shadow-[0_4px_20px_rgba(107,203,119,0.3)] active:scale-95'
                : 'bg-white/10 text-white/30'
                }`}
            >
              {actionLoading ? 'Sending...' : `Send ${selectedInvites.length > 0 ? selectedInvites.length : ''} Invites`}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ── Edit Time Bottom Sheet ── */}
      {editingTime && (
        <BottomSheet title="Edit Time ⏰" onClose={() => setEditingTime(false)}>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 block">
            Start time
          </label>
          <div className="mb-4">
            <DateTimePicker
              initialValue={draftDatetime}
              onChange={val => setDraftDatetime(val)}
              defaultToNow={false}
            />
          </div>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 block">
            End time (optional)
          </label>
          <div className="mb-5">
            <DateTimePicker
              initialValue={draftEndDatetime}
              onChange={val => setDraftEndDatetime(val)}
              defaultToNow={false}
            />
          </div>
          <button
            onClick={async () => {
              setSavingDetails(true)
              try {
                await updateHangoutDetails(hangout.id, {
                  datetime: draftDatetime || null,
                  end_datetime: draftEndDatetime || null
                })
                setHangout(prev => ({
                  ...prev,
                  datetime: draftDatetime || null,
                  end_datetime: draftEndDatetime || null
                }))
                setEditingTime(false)
                setToast({ message: 'Time updated ✅', type: 'success' })
              } catch {
                setToast({ message: 'Failed to update', type: 'error' })
              } finally {
                setSavingDetails(false)
              }
            }}
            disabled={savingDetails}
            className="w-full py-4 rounded-2xl font-black text-sm disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(255,107,107,0.25)'
            }}
          >
            {savingDetails ? 'Saving...' : 'Save Time'}
          </button>
        </BottomSheet>
      )}

      {/* ── Suggest Time Proposal Bottom Sheet ── */}
      {showAddTimeProposal && (
        <BottomSheet title="Suggest a Time 🗳️" onClose={() => setShowAddTimeProposal(false)}>
          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 block">
            Proposed date & time *
          </label>

          <div className="mb-6">
            <DateTimePicker
              initialValue={newProposal.datetime}
              onChange={val => setNewProposal(p => ({ ...p, datetime: val }))}
              defaultToNow={true}
            />
          </div>

          <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1.5 block">
            Label (optional)
          </label>
          <input
            type="text"
            value={newProposal.label}
            onChange={e => setNewProposal(p => ({ ...p, label: e.target.value }))}
            placeholder="e.g. Saturday evening, after work..."
            maxLength={40}
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 
              text-sm text-white outline-none focus:border-white/30 mb-5"
          />

          <button
            onClick={async () => {
              if (!newProposal.datetime) return
              try {
                const res = await addTimeProposal(hangout.id, {
                  proposed_datetime: new Date(newProposal.datetime).toISOString(),
                  label: newProposal.label || null
                })
                setTimeProposals(prev => [...prev, {
                  ...res.data.proposal,
                  votes: []
                }])
                setShowAddTimeProposal(false)
                setNewProposal({ datetime: '', label: '' })
                setToast({ message: 'Time proposed! 🗳️', type: 'success' })
              } catch {
                setToast({ message: 'Failed to add proposal', type: 'error' })
              }
            }}
            disabled={!newProposal.datetime}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all"
            style={{
              background: newProposal.datetime
                ? 'linear-gradient(135deg, #ff6b6b, #ff8e53)'
                : 'rgba(255,107,107,0.15)',
              color: newProposal.datetime ? '#fff' : 'rgba(255,255,255,0.3)',
              boxShadow: newProposal.datetime ? '0 6px 20px rgba(255,107,107,0.25)' : 'none'
            }}
          >
            Suggest This Time
          </button>
        </BottomSheet>
      )}
    </div>
  )
}

export default HangoutDetail
