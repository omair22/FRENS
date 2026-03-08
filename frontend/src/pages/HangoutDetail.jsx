import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getHangout, rsvpHangout, addVibeOption, voteVibeOption,
  deleteHangout, toggleVisibility, updateHangoutStatus,
  addHost, removeHost, addIdea, voteOnIdea, getFrends
} from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'

// ─── Helpers ─────────────────────────────────
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
          <Avatar user={r.user} size={size} />
        </div>
      ))}
      {extra > 0 && <div className="w-7 h-7 rounded-full border-2 border-background bg-white/10 flex items-center justify-center text-[9px] font-black ml-1">+{extra}</div>}
    </div>
  )
}

// ─── Idea Card ────────────────────────────────
const IdeaCard = ({ idea, hangoutId, currentUserId, onVoted }) => {
  const inVotes         = idea.votes?.filter(v => v.vote === 'in')         || []
  const interestedVotes = idea.votes?.filter(v => v.vote === 'interested') || []
  const outVotes        = idea.votes?.filter(v => v.vote === 'out')        || []
  const total           = idea.votes?.length || 0
  const myVote          = idea.votes?.find(v => v.user_id === currentUserId)?.vote

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
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Avatar user={idea.creator} size="xs" />
            <span className="text-[8px] opacity-30 font-black uppercase">{idea.creator.name?.split(' ')[0]}</span>
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

  useEffect(() => { getFrends().then(r => setFrens(r.data)).catch(() => {}) }, [])

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
            const isHost = hostIds.includes(f.id)
            return (
              <div key={f.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Avatar user={f} size="md" />
                  <span className="font-bold text-sm">{f.name}</span>
                  {isHost && <span className="text-[8px] bg-primary-yellow/20 text-primary-yellow font-black uppercase px-2 py-0.5 rounded-full">👑 Host</span>}
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
  const { user, setToast } = useStore()
  const [hangout, setHangout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [myRsvp, setMyRsvp] = useState(null)
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [showCoHostModal, setShowCoHostModal] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchHangout = async () => {
    try {
      const res = await getHangout(id)
      setHangout(res.data)
      const found = res.data.rsvps?.find(r => r.user_id === user?.id)
      setMyRsvp(found?.response || null)
    } catch (err) {
      setToast({ message: 'Failed to load hangout ❌', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHangout() }, [id])

  if (loading) return <div className="p-6 space-y-6 pb-32 max-w-md mx-auto"><Skeleton className="h-40" /><Skeleton className="h-32" /><Skeleton className="h-48" /></div>
  if (!hangout) return <div className="p-6 text-center opacity-30 pt-20"><span className="text-4xl block">🤷</span><p className="mt-4 font-black">Hangout not found</p></div>

  const isCreator = hangout.created_by === user?.id
  const hostIds   = (hangout.hosts || []).map(h => h.user_id)
  const isHost    = hostIds.includes(user?.id)
  const isAdmin   = isCreator || isHost

  const going      = hangout.rsvps?.filter(r => r.response === 'in'          || r.response === 'going')      || []
  const interested = hangout.rsvps?.filter(r => r.response === 'interested')                                 || []
  const notGoing   = hangout.rsvps?.filter(r => r.response === 'out'         || r.response === 'skip')       || []

  const handleRsvp = async (response) => {
    const prev = myRsvp
    setMyRsvp(response)
    try {
      await rsvpHangout(id, response)
      fetchHangout()
    } catch (err) {
      setMyRsvp(prev)
      setToast({ message: 'RSVP failed ❌', type: 'error' })
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

  const handleStatusChange = async (status) => {
    try {
      await updateHangoutStatus(id, status)
      setHangout(h => ({ ...h, status }))
      setToast({ message: `Status: ${status} ✅`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to update status', type: 'error' })
    }
  }

  return (
    <div className="pb-32 max-w-md mx-auto safe-top animate-in fade-in duration-500">

      {/* ── Hero Header ── */}
      <div className="relative bg-gradient-to-b from-card to-background px-6 pt-6 pb-8 space-y-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full glass flex items-center justify-center mb-2">🔙</button>

        <div className="flex items-start gap-4">
          <span className="text-6xl drop-shadow-2xl">{hangout.emoji || '✨'}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-display font-black italic leading-tight">{hangout.title}</h1>
            {/* Creator row */}
            {hangout.creator && (
              <div className="flex items-center gap-1.5 mt-2">
                <Avatar user={hangout.creator} size="xs" />
                <span className="text-[10px] font-black uppercase opacity-40">by {hangout.creator.name}</span>
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
          <p>🕐 {fmt(hangout.datetime)}</p>
          {hangout.location && <p>📍 {hangout.location}</p>}
        </div>

        {/* Co-hosts row */}
        {hangout.hosts?.length > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase opacity-30">Hosted by</span>
            <div className="flex -space-x-2">
              {hangout.hosts.map((h, i) => (
                <div key={i} className="relative">
                  <div className="border-2 border-background rounded-full overflow-hidden">
                    <Avatar user={h.user} size="sm" />
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

      <div className="px-6 space-y-8">

        {/* ── RSVP Groups ── */}
        <div className="space-y-4">
          {/* Going */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-green">✅ Going ({going.length})</h3>
            </div>
            {going.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {going.map((r, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <Avatar user={r.user} size="md" showStatus />
                    <span className="text-[8px] font-black uppercase opacity-40">{r.user?.name?.split(' ')[0]}</span>
                  </div>
                ))}
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
                  <div key={i} className="flex flex-col items-center gap-1 opacity-70">
                    <Avatar user={r.user} size="sm" />
                    <span className="text-[8px] font-black uppercase opacity-40">{r.user?.name?.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[10px] opacity-20 font-black italic">No one yet</p>}
          </div>

          {/* Not Going */}
          {notGoing.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-2">❌ Not Going ({notGoing.length})</h3>
              <div className="flex flex-wrap gap-2">
                {notGoing.map((r, i) => (
                  <div key={i} className="opacity-30">
                    <Avatar user={r.user} size="xs" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RSVP Buttons ── */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest opacity-30">Your RSVP</h3>
          <div className="flex gap-2">
            {[
              ['in',          '✅ I\'m In',    'bg-primary-green text-background shadow-primary-green/20'],
              ['interested',  '👀 Interested', 'bg-primary-yellow text-background shadow-primary-yellow/20'],
              ['out',         '❌ Out',        'bg-white/5 text-white/40'],
            ].map(([val, label, activeClass]) => (
              <button
                key={val}
                onClick={() => handleRsvp(val)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 ${myRsvp === val ? `${activeClass} scale-95 shadow-lg` : 'bg-card border border-white/5 opacity-50 hover:opacity-100'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
              idea={idea}
              hangoutId={id}
              currentUserId={user?.id}
              onVoted={fetchHangout}
            />
          ))}
        </div>

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
    </div>
  )
}

export default HangoutDetail
