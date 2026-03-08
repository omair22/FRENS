import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getHangout, rsvpHangout, addVibeOption, voteVibeOption, getNudge } from '../lib/api'
import { useStore } from '../store/useStore'
import RsvpButtons from '../components/RsvpButtons'
import Skeleton from '../components/Skeleton'
import Avatar from '../components/Avatar'

const HangoutDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, setToast } = useStore()
  const [hangout, setHangout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newVibe, setNewVibe] = useState('')
  const [addingVibe, setAddingVibe] = useState(false)

  const fetchDetail = async () => {
    try {
      const res = await getHangout(id)
      setHangout(res.data)
    } catch (err) {
      setToast({ message: 'Failed to load hangout 💨', type: 'error' })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [id])

  const handleRsvp = async (response) => {
    try {
      await rsvpHangout(id, response)
      setToast({ message: 'RSVP updated! ✅', type: 'success' })
      fetchDetail()
    } catch (err) {
      setToast({ message: 'Update failed ❌', type: 'error' })
    }
  }

  const handleAddVibe = async (e) => {
    e.preventDefault()
    if (!newVibe.trim()) return
    setAddingVibe(true)
    try {
      await addVibeOption(id, { label: newVibe })
      setNewVibe('')
      fetchDetail()
      setToast({ message: 'Option added! ✨', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to add option ❌', type: 'error' })
    } finally {
      setAddingVibe(false)
    }
  }

  const handleVote = async (optionId) => {
    try {
      await voteVibeOption(id, optionId)
      fetchDetail()
    } catch (err) {
      setToast({ message: 'Vote failed ❌', type: 'error' })
    }
  }

  if (loading) return (
    <div className="p-6 space-y-8 max-w-md mx-auto">
      <Skeleton className="h-64 rounded-[3rem]" variant="rect" />
      <Skeleton variant="text" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  )

  const going = hangout.rsvps?.filter(r => r.response === 'going') || []
  const interestedCount = hangout.rsvps?.filter(r => r.response === 'interested').length || 0
  const myRsvp = hangout.rsvps?.find(r => r.user_id === user.id)?.response

  const totalVotes = hangout.vibe_options?.reduce((acc, opt) => acc + (opt.vibe_votes?.length || 0), 0) || 0

  return (
    <div className="pb-32 max-w-md mx-auto animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="relative h-80 bg-card rounded-b-[4rem] overflow-hidden flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary-red/20 to-transparent pointer-events-none" />
        <button onClick={() => navigate(-1)} className="absolute top-6 left-6 w-10 h-10 rounded-full glass flex items-center justify-center z-20">🔙</button>
        
        <span className="text-8xl drop-shadow-glow animate-bounce duration-slow relative z-10">{hangout.emoji}</span>
        <div className="relative z-10">
          <h1 className="text-4xl font-display font-black normal-case mb-2 italic">{hangout.title}</h1>
          <div className="flex gap-2 justify-center">
            <span className="px-3 py-1 bg-primary-red text-background text-[8px] font-black uppercase rounded-full">PLANNING</span>
            <span className="px-3 py-1 glass text-[8px] font-black uppercase rounded-full">{hangout.location || 'Location TBD'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-10 -translate-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card-frens p-4 flex flex-col gap-1 items-center">
            <span className="text-[8px] font-black uppercase opacity-30">Date</span>
            <span className="font-display font-bold text-primary-yellow">
              {hangout.datetime ? new Date(hangout.datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'TBD'}
            </span>
          </div>
          <div className="card-frens p-4 flex flex-col gap-1 items-center">
            <span className="text-[8px] font-black uppercase opacity-30">Time</span>
            <span className="font-display font-bold text-primary-yellow">
              {hangout.datetime ? new Date(hangout.datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD'}
            </span>
          </div>
        </div>

        {/* Going List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Going ({going.length})</h3>
            <span className="text-[10px] font-bold text-primary-yellow uppercase tracking-tighter">{interestedCount} interested</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {going.map(rsvp => (
              <div key={rsvp.user_id} className="flex flex-col items-center gap-1 group">
                <Avatar user={rsvp.user} size="md" showStatus={true} className="group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase opacity-40">{rsvp.user?.name?.split(' ')[0]}</span>
              </div>
            ))}
            {going.length === 0 && <p className="text-[10px] font-bold opacity-20 py-4">Checking for responses...</p>}
          </div>
        </div>

        {/* RSVP Section */}
        <div className="space-y-3 card-frens p-6 relative overflow-hidden bg-primary-red/5">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Your Response</h3>
            {hangout.created_by === user.id && (
              <button 
                onClick={async () => {
                  try {
                    const res = await getNudge(id)
                    setToast({ message: `AI Nudge: "${res.data.nudge}"`, type: 'info' })
                  } catch (err) {
                    setToast({ message: 'Nudge failed ❌', type: 'error' })
                  }
                }}
                className="text-[8px] font-black uppercase tracking-widest text-primary-purple bg-primary-purple/10 px-3 py-1 rounded-full active:scale-95 transition-transform"
              >
                AI Nudge 🤖
              </button>
            )}
          </div>
          <RsvpButtons currentRsvp={myRsvp} onRsvp={handleRsvp} />
        </div>

        {/* Vibes Voting */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Vibe Check / Vote</h3>
          <div className="space-y-3">
            {hangout.vibe_options?.map(opt => {
              const votes = opt.vibe_votes?.length || 0
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0
              const hasVoted = opt.vibe_votes?.some(v => v.user_id === user.id)
              
              return (
                <button 
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  className={`w-full relative group card-frens p-0 overflow-hidden active:scale-[0.98] transition-all`}
                >
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ${hasVoted ? 'bg-primary-purple/30' : 'bg-white/5'}`} 
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="relative p-4 flex justify-between items-center z-10">
                    <span className="font-display font-bold leading-none">{opt.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {opt.vibe_votes?.slice(0, 3).map((v, i) => (
                          <span key={i} className="text-[12px] opacity-60 grayscale-[0.5]">{v.user?.emoji}</span>
                        ))}
                      </div>
                      <span className="text-[10px] font-black opacity-30">{votes}</span>
                    </div>
                  </div>
                </button>
              )
            })}

            {/* Add Option Form */}
            <form onSubmit={handleAddVibe} className="flex gap-2">
              <input
                type="text"
                placeholder="Suggest another vibe..."
                className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-sm outline-none focus:border-primary-purple transition-colors"
                value={newVibe}
                onChange={e => setNewVibe(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={addingVibe || !newVibe.trim()}
                className="bg-primary-purple text-background font-black text-px font-black uppercase px-6 rounded-2xl disabled:opacity-30 active:scale-90 transition-transform"
              >
                +
              </button>
            </form>
          </div>
        </div>

        {/* Link to Album */}
        <Link 
          to={`/album/${id}`}
          className="block card-frens p-6 bg-gradient-to-br from-primary-blue/20 to-primary-purple/20 text-center space-y-2 group active:scale-95 transition-transform"
        >
          <span className="text-3xl block transition-transform group-hover:scale-125 duration-500">📸</span>
          <h4 className="font-display font-black italic">The Photo Album</h4>
          <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Capture the memories</p>
        </Link>
      </div>
    </div>
  )
}

export default HangoutDetail
