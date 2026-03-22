import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarBlank,
  Lock,
  Trash,
  Globe,
  UserPlus,
  MapPin,
  CaretRight,
  Plus,
  Check,
  ShareNetwork,
  WhatsappLogo,
  InstagramLogo,
  ChatCircleText
} from 'phosphor-react'
import CountdownTimer from '../components/CountdownTimer'
import {
  getHangout, rsvpHangout, deleteHangout, toggleVisibility,
  addHost, removeHost, addIdea, voteOnIdea, getFrends,
  getStops, addStop, deleteStop, updateHangoutDetails,
  getTimeProposals, addTimeProposal, voteOnTime, deleteTimeProposal,
  acceptTime, acceptIdea
} from '../lib/api'
import { buildAvatarUrl } from '../lib/avatar'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import { FeedSkeleton as Skeleton } from '../components/Skeleton'
import BottomSheet from '../components/BottomSheet'
import TimeProposalCard from '../components/TimeProposalCard'
import DateTimePicker from '../components/DateTimePicker'

// ─── Helpers ─────────────────────────────────
const fmt = (iso) => {
  if (!iso) return 'TBD'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const StatusBadge = ({ status, isPublic }) => {
  const map = {
    planning: 'Planning',
    locked: 'Locked',
    happening: 'Happening'
  }
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '3px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#666666' }}>
          {map[status] || 'Planning'}
        </span>
      </div>
      {!isPublic && (
        <div style={{
          background: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '3px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <Lock size={12} color="#666666" />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#666666' }}>
            Private
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Avatar Row ───────────────────────────────
const AvatarRow = ({ rsvps, max = 5 }) => {
  const visible = rsvps.slice(0, max)
  const extra = rsvps.length - visible.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((r, i) => (
          <div key={r.id || r.user_id || i} style={{ marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i, border: '2px solid #0a0a0a', borderRadius: '50%' }}>
            <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={40} />
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#3a3a3a', marginLeft: 8 }}>
          +{extra}
        </span>
      )}
    </div>
  )
}

// ─── Idea Card ────────────────────────────────
const IdeaCard = ({ idea, hangoutId, currentUserId, onVoted }) => {
  const navigate = useNavigate()
  const inVotes = idea.votes?.filter(v => v.vote === 'in') || []
  const myVote = idea.votes?.find(v => v.user_id === currentUserId)?.vote

  const handleVote = async (vote) => {
    try { await voteOnIdea(hangoutId, idea.id, vote); onVoted() } catch (e) { console.error(e) }
  }

  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
        <div>
          <h4 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#f5f5f5', margin: 0 }}>{idea.title}</h4>
          {idea.location && (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3a3a3a', margin: '4px 0 0' }}>{idea.location}</p>
          )}
        </div>
        {idea.creator && (
          <div onClick={() => navigate(`/profile/${idea.creator?.id}`)} style={{ cursor: 'pointer' }}>
            <Avatar name={idea.creator?.name} config={idea.creator?.avatar_config || {}} size={32} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {['in', 'interested', 'out'].map(vid => {
          const labels = { in: 'In', interested: 'Maybe', out: 'Out' }
          const isActive = myVote === vid
          return (
            <button
              key={vid}
              onClick={() => handleVote(vid)}
              style={{
                flex: 1, height: 36, borderRadius: 10,
                background: isActive ? '#f5f5f5' : '#1a1a1a',
                color: isActive ? '#0a0a0a' : '#666666',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {labels[vid]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add Idea Form ────────────────────────────
const AddIdeaForm = ({ hangoutId, onAdded, onClose }) => {
  const [form, setForm] = useState({ title: '', description: '', location: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try { await addIdea(hangoutId, form); onAdded() } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Suggest</p>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#3a3a3a', fontSize: 16, cursor: 'pointer' }}>✕</button>
      </div>
      <input 
        required 
        placeholder="What should we do?" 
        className="input-frens" 
        value={form.title} 
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
        style={{ marginBottom: 12 }}
      />
      <button type="submit" disabled={loading || !form.title} className="btn-primary" style={{ width: '100%', height: 44 }}>
        {loading ? 'Adding...' : 'Post Idea'}
      </button>
    </form>
  )
}

// ─── Invite Sheet ─────────────────────────────
const InviteSheet = ({ hangoutId, currentRsvps, onClose, onInvited }) => {
  const [frens, setFrens] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToast } = useStore()

  useEffect(() => { getFrends().then(r => setFrens(r.data)).catch(() => { }) }, [])

  const rsvpIds = currentRsvps?.map(r => r.user_id) || []
  const filtered = frens.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()))

  const handleInvite = async (userId) => {
    setLoading(true)
    try { 
      await inviteToHangout(hangoutId, [userId])
      setToast({ message: 'Invite sent!', type: 'success' })
      onInvited() 
    } catch (e) { 
      setToast({ message: 'Failed to invite', type: 'error' })
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Invite Frens">
      <div style={{ padding: '0 20px 32px' }}>
        <input type="text" placeholder="Search frens..." className="input-frens" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>No frens found</p>
          ) : filtered.map(f => {
            const isInvited = rsvpIds.includes(f.id)
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={f.name} config={f.avatar_config || {}} size={36} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5' }}>{f.name}</span>
                </div>
                <button 
                  onClick={() => handleInvite(f.id)} 
                  disabled={loading || isInvited} 
                  style={{ 
                    background: isInvited ? 'none' : '#1a1a1a', 
                    border: isInvited ? 'none' : '1px solid rgba(255,255,255,0.08)', 
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: isInvited ? '#4caf7d' : '#f5f5f5', 
                    fontSize: 12, 
                    fontWeight: 600, 
                    cursor: isInvited ? 'default' : 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {isInvited ? 'Invited' : 'Invite'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Co-host Modal ────────────────────────────
const CoHostModal = ({ hangoutId, currentHosts, onClose, onAdded }) => {
  const [frens, setFrens] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getFrends().then(r => setFrens(r.data)).catch(() => { }) }, [])

  const hostIds = currentHosts?.map(h => h.user_id) || []
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 360, background: '#0a0a0a', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>Co-hosts</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666666', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <input type="text" placeholder="Search frens..." className="input-frens" value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 16 }} />
        <div style={{ maxHeight: '40vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map(f => {
            const isHost = hostIds.includes(f.id)
            return (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={f.name} config={f.avatar_config || {}} size={36} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5' }}>{f.name}</span>
                </div>
                {isHost ? (
                  <button onClick={() => handleRemove(f.id)} disabled={loading} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                ) : (
                  <button onClick={() => handleAdd(f.id)} disabled={loading} style={{ background: 'none', border: 'none', color: '#f5f5f5', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Add</button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
// ─── Share Sheet ──────────────────────────────
const ShareSheet = ({ hangout, onClose }) => {
  const { setToast } = useStore()
  
  // The 'pretty' link for copying and showing to users
  const prettyUrl = `${window.location.origin}/h/${hangout.id}`
  
  // The backend 'OG' link for social previews (WhatsApp, iMessage, etc)
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const previewUrl = `${backendUrl.replace('/api', '')}/api/og/hangout/${hangout.id}`

  const handleCopy = () => {
    navigator.clipboard.writeText(prettyUrl)
    setToast({ message: 'Link copied!', type: 'success' })
    onClose()
  }

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hangout.title,
        text: `Join me for ${hangout.title}!`,
        url: previewUrl, // Use preview URL for native shares to preserve card
      }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  const shareOptions = [
    { icon: <Plus size={20} />, label: 'Copy Link', onClick: handleCopy, color: '#f5f5f5' },
    { icon: <WhatsappLogo size={20} weight="fill" />, label: 'WhatsApp', onClick: () => {
      const text = encodeURIComponent(`Join me for ${hangout.title}! ${previewUrl}`)
      const waUrl = /Android|iPhone|iPad/i.test(navigator.userAgent) 
        ? `whatsapp://send?text=${text}` 
        : `https://api.whatsapp.com/send?text=${text}`
      window.open(waUrl)
    }, color: '#25D366' },
    { icon: <InstagramLogo size={20} weight="fill" />, label: 'Instagram', onClick: handleCopy, color: '#E4405F' },
    { icon: <ChatCircleText size={20} weight="fill" />, label: 'iMessage', onClick: () => window.open(`sms:?&body=${encodeURIComponent('Join me for ' + hangout.title + '! ' + previewUrl)}`), color: '#34C759' },
    { icon: <ShareNetwork size={20} />, label: 'More', onClick: handleNativeShare, color: '#666666' },
  ]

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Share Hangout">
      <div style={{ padding: '0 24px 40px' }}>
        <div style={{ 
          background: '#111111', border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: 16, padding: 16, marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ fontSize: 24 }}>{hangout.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hangout.title}</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prettyUrl}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {shareOptions.map(opt => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}
            >
              <div style={{ 
                width: 52, height: 52, borderRadius: 14, 
                background: '#111111', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: opt.color
              }}>
                {opt.icon}
              </div>
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 500, color: '#666666' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
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
  const [showRsvpSheet, setShowRsvpSheet] = useState(false)
  const [pendingResponse, setPendingResponse] = useState(null)
  const [rsvpOptions, setRsvpOptions] = useState({ full_hangout: true, out_reason: '' })
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [showCoHostModal, setShowCoHostModal] = useState(false)
  const [showAddTimeProposal, setShowAddTimeProposal] = useState(false)
  const [newProposal, setNewProposal] = useState({ datetime: null, label: '' })
  const [timeProposals, setTimeProposals] = useState([])
  const [myTimeVotes, setMyTimeVotes] = useState({})
  const [stops, setStops] = useState([])
  const [showAddStop, setShowAddStop] = useState(false)
  const [newStop, setNewStop] = useState({ title: '', location: '' })
  const [showInviteSheet, setShowInviteSheet] = useState(false)
  const [showShareSheet, setShowShareSheet] = useState(false)
  
  const fetchHangout = async () => {
    try {
      const [res, tpRes, sRes] = await Promise.all([
        getHangout(id),
        getTimeProposals(id).catch(() => ({ data: [] })),
        getStops(id).catch(() => ({ data: [] }))
      ])
      setHangout(res.data)
      setMyRsvp(res.data.rsvps?.find(r => r.user_id === user?.id) || null)
      setTimeProposals(tpRes.data || [])
      setStops(sRes.data || [])
      
      const votesMap = {}
      tpRes.data?.forEach(p => {
        const myVote = p.votes?.find(v => v.user_id === user?.id)
        if (myVote) votesMap[p.id] = myVote.interest
      })
      setMyTimeVotes(votesMap)
    } catch (err) {
      setToast({ message: 'Failed to load hangout', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHangout() }, [id])

  if (loading) return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#f5f5f5', animation: 'spin 1s linear infinite' }} /></div>
  if (!hangout) return <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3a3a3a' }}>Hangout not found</div>

  const isCreator = hangout.created_by === user?.id
  const hostIds = (hangout.hosts || []).map(h => h.user_id)
  const isAdmin = isCreator || hostIds.includes(user?.id)

  const going = hangout.rsvps?.filter(r => r.response === 'in' || r.response === 'going') || []
  const interested = hangout.rsvps?.filter(r => r.response === 'interested') || []

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
      fetchHangout()
      setToast({ message: 'RSVP Updated', type: 'success' })
    } catch (err) { setToast({ message: 'RSVP Failed', type: 'error' }) }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this hangout?')) return
    try { await deleteHangout(id); navigate('/') } catch (e) { }
  }

  const handleToggleVisibility = async () => {
    try { await toggleVisibility(id, !hangout.is_public); fetchHangout() } catch (e) { }
  }

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: 120, maxWidth: 448, margin: '0 auto' }}>
      
      {/* ── Header ── */}
      <div style={{ padding: '56px 20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#f5f5f5', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={24} weight="regular" />
          </button>
          <button 
            onClick={() => setShowShareSheet(true)}
            style={{ 
              background: '#111111', border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: 12, width: 40, height: 40, 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              color: '#f5f5f5', cursor: 'pointer' 
            }}
          >
            <ShareNetwork size={20} weight="regular" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1 }}>{hangout.emoji || '✨'}</div>
          
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#f5f5f5', margin: 0, lineHeight: 1.1 }}>{hangout.title}</h1>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, cursor: 'pointer' }}
              onClick={() => navigate(`/profile/${hangout.creator?.id}`)}
            >
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666' }}>by {hangout.creator?.name}</span>
              <Avatar name={hangout.creator?.name} config={hangout.creator?.avatar_config || {}} size={20} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <StatusBadge status={hangout.status} isPublic={hangout.is_public} />
              <CountdownTimer targetDate={hangout.datetime} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarBlank size={14} color="#666666" />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666' }}>
                {fmt(hangout.datetime)}
                {hangout.end_datetime && ` — ${new Date(hangout.end_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Admin Actions ── */}
      {isAdmin && (
        <div style={{ padding: '0 20px 32px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
           <button 
              onClick={handleToggleVisibility} 
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                height: 36,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#f5f5f5',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <Globe size={16} />
              {hangout.is_public ? 'Make Private' : 'Make Public'}
            </button>
            
            <button 
              onClick={() => setShowCoHostModal(true)} 
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                height: 36,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#f5f5f5',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <UserPlus size={16} />
              Co-host
            </button>

            <button 
              onClick={handleDelete} 
              style={{
                background: '#1a1a1a',
                border: '1px solid rgba(255,77,77,0.2)',
                borderRadius: 10,
                height: 36,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#ff4d4d',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              <Trash size={16} />
              Delete
            </button>
        </div>
      )}

      {/* ── Itinerary ── */}
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          cursor: 'pointer'
        }}>
          <MapPin size={18} color="#666666" />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500, color: '#f5f5f5', margin: 0 }}>Itinerary</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3a3a3a', margin: '2px 0 0' }}>
              {stops.length > 0 ? `${stops.length} stops planned` : 'No stops yet'}
            </p>
          </div>
          {isAdmin ? (
            <button onClick={(e) => { e.stopPropagation(); setShowAddStop(true) }} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add</button>
          ) : (
            stops.length > 0 && <CaretRight size={16} color="#3a3a3a" />
          )}
        </div>

        {showAddStop && (
          <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p className="section-label" style={{ margin: 0 }}>New Stop</p>
              <button onClick={() => setShowAddStop(false)} style={{ background: 'none', border: 'none', color: '#3a3a3a', fontSize: 16 }}>✕</button>
            </div>
            <input placeholder="Stop Name" className="input-frens" value={newStop.title} onChange={e => setNewStop(s => ({ ...s, title: e.target.value }))} style={{ marginBottom: 8 }} />
            <input placeholder="Location" className="input-frens" value={newStop.location} onChange={e => setNewStop(s => ({ ...s, location: e.target.value }))} style={{ marginBottom: 12 }} />
            <button
              onClick={async () => {
                if (!newStop.title) return
                try { await addStop(id, newStop); setShowAddStop(false); fetchHangout(); setNewStop({ title: '', location: '' }) } catch (e) { }
              }}
              className="btn-primary" style={{ width: '100%', height: 40 }}
            >
              Add Stop
            </button>
          </div>
        )}

        {stops.length > 0 ? (
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {stops.map((stop, i) => (
              <div key={stop.id} style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf7d', border: '2px solid #0a0a0a', zIndex: 2 }} />
                  {i < stops.length - 1 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h5 style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', margin: 0 }}>{stop.title}</h5>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', marginTop: 2 }}>{stop.location || 'Location TBD'}</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => deleteStop(id, stop.id).then(fetchHangout)} style={{ background: 'none', border: 'none', color: '#3a3a3a', cursor: 'pointer' }}>
                        <Trash size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !showAddStop && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0' }}>
            <img 
              src={buildAvatarUrl(user?.name || 'you', user?.avatar_config || {})} 
              alt="Empty state avatar" 
              style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 12 }} 
            />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', margin: 0 }}>No stops yet</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '4px 0 0' }}>{isAdmin ? 'Add a location for your hangout' : 'The host hasn\'t added stops yet'}</p>
          </div>
        )}
      </div>

      {showShareSheet && <ShareSheet hangout={hangout} onClose={() => setShowShareSheet(false)} />}

      {/* ── RSVPs ── */}
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
            Going ({going.length})
          </p>
          <button 
            onClick={() => setShowInviteSheet(true)}
            style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            height: 28,
            padding: '0 12px',
            color: '#f5f5f5',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer'
          }}>
            + Invite
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {going.map((r, i) => (
            <div key={r.id || r.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={40} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5' }}>{r.user?.name}</span>
                  {r.user?.id === user?.id && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a' }}>(me)</span>}
                  {(r.user?.id === hangout.created_by || hostIds.includes(r.user?.id)) && (
                    <div style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}>
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 600, color: '#666666', textTransform: 'uppercase' }}>Host</span>
                    </div>
                  )}
                </div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '2px 0 0' }}>FULL HANGOUT</p>
              </div>
            </div>
          ))}
        </div>

        {interested.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
              Interested ({interested.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {interested.map((r, i) => (
                <div key={r.id || r.user_id || i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={r.user?.name} config={r.user?.avatar_config || {}} size={40} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5' }}>{r.user?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Your RSVP ── */}
      <div style={{ padding: '0 20px 40px' }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
          Your RSVP
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'in', label: "I'M IN" },
            { id: 'interested', label: 'MAYBE' },
            { id: 'skip', label: 'SKIP' }
          ].map(opt => {
            const isActive = myRsvp?.response === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => handleRsvpTap(opt.id)}
                style={{
                  flex: 1,
                  height: 44,
                  background: isActive ? '#f5f5f5' : '#1a1a1a',
                  border: isActive ? '1px solid #f5f5f5' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  color: isActive ? '#0a0a0a' : '#666666',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer'
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Time Poll ── */}
        <div style={{ padding: '0 20px 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Time Proposals</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '2px 0 0' }}>Help pick a time</p>
            </div>
            <button 
              onClick={() => setShowAddTimeProposal(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                height: 28,
                padding: '0 12px',
                color: '#f5f5f5',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              + Propose
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {timeProposals.length > 0 ? (
              timeProposals.map(p => (
                <TimeProposalCard 
                  key={p.id} 
                  proposal={p} 
                  onVote={(interest) => voteOnTime(id, p.id, interest).then(fetchHangout)}
                  myVote={myTimeVotes[p.id]}
                  isHost={isAdmin}
                  onAccept={() => acceptTime(id, p.id).then(fetchHangout)}
                  onDelete={() => deleteTimeProposal(id, p.id).then(fetchHangout)}
                />
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0' }}>
                <img 
                  src={buildAvatarUrl(user?.name || 'you', user?.avatar_config || {})} 
                  alt="Empty state avatar" 
                  style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 12 }} 
                />
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', margin: 0 }}>No times proposed</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '4px 0 0' }}>Suggest a few slots to get started</p>
              </div>
            )}
          </div>
        </div>

      {/* ── Ideas ── */}
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Ideas</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '2px 0 0' }}>Vote on what to do</p>
          </div>
          <button 
            onClick={() => setShowAddIdea(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              height: 28,
              padding: '0 12px',
              color: '#f5f5f5',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            + Suggest
          </button>
        </div>

        {showAddIdea && <AddIdeaForm hangoutId={id} onAdded={() => { setShowAddIdea(false); fetchHangout() }} onClose={() => setShowAddIdea(false)} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {(hangout.ideas || []).length > 0 ? (
            (hangout.ideas || []).map(idea => <IdeaCard key={idea.id} idea={idea} hangoutId={id} currentUserId={user?.id} onVoted={fetchHangout} />)
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '32px 0' }}>
              <img 
                src={buildAvatarUrl(user?.name || 'you', user?.avatar_config || {})} 
                alt="Empty state avatar" 
                style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 12 }} 
              />
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', margin: 0 }}>No ideas yet</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', margin: '4px 0 0' }}>Be the first to suggest something</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <BottomSheet isOpen={showRsvpSheet} onClose={() => setShowRsvpSheet(false)} title="RSVP Details">
        <div style={{ padding: '0 20px 32px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', marginBottom: 20 }}>{pendingResponse === 'in' ? "Yay! Let us know if you're coming for the whole thing." : "Ah, sorry you can't make it. Any reason?"}</p>
          {pendingResponse === 'in' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: '#f5f5f5' }}>Coming for full hangout?</span>
                <input 
                  type="checkbox" 
                  checked={rsvpOptions.full_hangout} 
                  onChange={e => setRsvpOptions(o => ({ ...o, full_hangout: e.target.checked }))} 
                  style={{ width: 20, height: 20, accentColor: '#4caf7d' }}
                />
              </div>
              <button onClick={() => { submitRsvp({ response: 'in', ...rsvpOptions }); setShowRsvpSheet(false) }} className="btn-primary" style={{ width: '100%', height: 48 }}>Confirm</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input placeholder="Reason (Optional)" className="input-frens" value={rsvpOptions.out_reason} onChange={e => setRsvpOptions(o => ({ ...o, out_reason: e.target.value }))} style={{ height: 48 }} />
              <button onClick={() => { submitRsvp({ response: 'skip', ...rsvpOptions }); setShowRsvpSheet(false) }} className="btn-destructive" style={{ width: '100%', height: 48 }}>Confirm Skip</button>
            </div>
          )}
        </div>
      </BottomSheet>

      {showCoHostModal && <CoHostModal hangoutId={id} currentHosts={hangout.hosts} onClose={() => setShowCoHostModal(false)} onAdded={() => { setShowCoHostModal(false); fetchHangout() }} />}

      <BottomSheet isOpen={showAddTimeProposal} onClose={() => setShowAddTimeProposal(false)} title="Suggest another time">
        <div style={{ padding: '0 20px 32px' }}>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Select Date & Time</p>
          <DateTimePicker initialValue={newProposal.datetime} onChange={val => setNewProposal(p => ({ ...p, datetime: val }))} />
          <button onClick={() => { if (!newProposal.datetime) return; addTimeProposal(id, { proposed_datetime: newProposal.datetime, label: newProposal.label || '' }).then(() => { setShowAddTimeProposal(false); fetchHangout() }) }} className="btn-primary" style={{ width: '100%', marginTop: 24, height: 48 }}>Add Option</button>
        </div>
      </BottomSheet>
      
      {showInviteSheet && <InviteSheet hangoutId={id} currentRsvps={hangout.rsvps} onClose={() => setShowInviteSheet(false)} onInvited={fetchHangout} />}


    </div>
  )
}

export default HangoutDetail
