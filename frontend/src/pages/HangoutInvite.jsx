import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  getPublicHangout, guestRsvp, guestTimeVote, 
  guestIdeaVote, guestSuggestIdea 
} from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import { buildAvatarUrl } from '../lib/avatar'
import { Clock, MapPin, Users, Check, ChatTeardropText, Plus, ArrowRight } from 'phosphor-react'

const HangoutInvite = () => {
  const { id: hangoutId } = useParams()
  const navigate = useNavigate()
  const { user, setToast } = useStore()

  const [hangout, setHangout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [guestToken, setGuestToken] = useState(localStorage.getItem(`frens_guest_token_${hangoutId}`))
  const [myRsvp, setMyRsvp] = useState(null)
  
  // Guest Name Prompt State
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [guestNameInput, setGuestNameInput] = useState('')
  const [pendingRsvp, setPendingRsvp] = useState(null)
  
  // Suggestion state
  const [showSuggest, setShowSuggest] = useState(false)
  const [suggestion, setSuggestion] = useState('')

  useEffect(() => {
    fetchHangout()
  }, [hangoutId])

  const fetchHangout = async () => {
    try {
      setLoading(true)
      const res = await getPublicHangout(hangoutId)
      const mappedHangout = {
        ...res.data.hangout,
        guest_rsvps: res.data.guests
      }
      setHangout(mappedHangout)
      
      // If user is logged in, find their RSVP
      if (user && !user.isGuest) {
        const found = mappedHangout.rsvps?.find(r => r.user_id === user.id)
        if (found) setMyRsvp(found.response)
      } else if (guestToken) {
        // Find guest RSVP by token
        const found = mappedHangout.guest_rsvps?.find(g => g.token === guestToken)
        if (found) setMyRsvp(found.response)
      }
    } catch (err) {
      setError(err.message || 'Could not find hangout')
    } finally {
      setLoading(false)
    }
  }

  const handleRsvp = async (response, submittedName = null) => {
    // Determine if we need to ask for a name
    const hasName = user?.name || guestToken
    if (!hasName && !submittedName) {
      setPendingRsvp(response)
      setShowNamePrompt(true)
      return
    }

    if (user && !user.isGuest) {
      // Logic for logged in users (already handled by existing rsvpHangout but we use guest endpoint for simplicity if needed, or just standard)
      // Actually, for consistency, let's use the guest endpoint if we want them to stay on this page
      // But the guest endpoint requires a token for guests.
    }

    try {
      const data = {
        name: submittedName || user?.name || 'Guest',
        response,
        token: guestToken
      }
      const res = await guestRsvp(hangoutId, data)
      
      if (res.data.token) {
        localStorage.setItem(`frens_guest_token_${hangoutId}`, res.data.token)
        setGuestToken(res.data.token)
        
        // Save to global list for linking later
        const allTokens = JSON.parse(localStorage.getItem('frens_all_guest_tokens') || '[]')
        if (!allTokens.includes(res.data.token)) {
          localStorage.setItem('frens_all_guest_tokens', JSON.stringify([...allTokens, res.data.token]))
        }
      }
      
      setMyRsvp(response)
      setToast({ message: 'RSVP updated!', type: 'success' })
      fetchHangout()
    } catch (err) {
      setToast({ message: 'RSVP failed', type: 'error' })
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-6 h-6 rounded-full border-2 border-white/10 border-t-white/80 animate-spin" />
    </div>
  )

  if (error || !hangout) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Syne' }}>
        Hangout not found
      </h2>
      <p className="text-gray-500 mb-8 font-['DM_Sans']">
        This link might be expired or the hangout was deleted.
      </p>
      <button 
        onClick={() => navigate('/onboarding')}
        className="px-6 py-3 bg-[#111111] rounded-xl text-white font-semibold flex items-center gap-2 border border-white/10"
      >
        Go to Frens
      </button>
    </div>
  )

  const isGoing = myRsvp === 'going'
  const isMaybe = myRsvp === 'maybe'
  const isOut = myRsvp === 'out'

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white/10">
      
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#9b7fff] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff4d4d] blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-32">
        
        {/* ── Mini Logo ── */}
        <div className="flex justify-center mb-12">
          <h1 
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: 'Syne' }}
            onClick={() => navigate('/onboarding')}
          >
            frens
          </h1>
        </div>

        {/* ── Main Invite Card ── */}
        <div 
          className="rounded-[32px] p-8 mb-8 overflow-hidden relative"
          style={{ 
            background: '#111111', 
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}
        >
          {/* Emoji Badge */}
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] flex items-center justify-center text-3xl mb-6 border border-white/5">
            {hangout.emoji || '📅'}
          </div>

          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#666666] mb-3">
            Invitation
          </p>

          <h2 className="text-3xl font-bold leading-tight mb-6" style={{ fontFamily: 'Syne' }}>
            {hangout.title}
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4 text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-wider text-[10px]">When</span>
                <span className="text-[15px] font-['DM_Sans']">
                  {hangout.datetime 
                    ? new Date(hangout.datetime).toLocaleDateString('en-US', { 
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                      })
                    : 'Time TBD'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-wider text-[10px]">Where</span>
                <span className="text-[15px] font-['DM_Sans'] truncate max-w-[240px]">
                  {hangout.location || 'Location TBD'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                <Users size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-wider text-[10px]">RSVPs</span>
                <span className="text-[15px] font-['DM_Sans']">
                  {(hangout.rsvps?.length || 0) + (hangout.guest_rsvps?.length || 0)} frens going
                </span>
              </div>
            </div>
          </div>

          {/* ── RSVP Buttons ── */}
          <div className="flex gap-2">
            <button
              onClick={() => handleRsvp('going')}
              className={`flex-[2] h-14 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2
                ${isGoing ? 'bg-[#f5f5f5] text-[#0a0a0a]' : 'bg-white/10 text-white hover:bg-white/15'}`}
            >
              {isGoing && <Check weight="bold" />}
              {isGoing ? "You're in" : 'I\'m in'}
            </button>
            <button
              onClick={() => handleRsvp('maybe')}
              className={`flex-1 h-14 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2
                ${isMaybe ? 'bg-[#f5f5f5] text-[#0a0a0a]' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRsvp('out')}
              className={`flex-1 h-14 rounded-2xl font-bold text-[15px] transition-all flex items-center justify-center gap-2
                ${isOut ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
            >
              No
            </button>
          </div>
        </div>

        {/* ── Proposals Section (If TBD) ── */}
        {!hangout.datetime && hangout.time_proposals?.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3a3a3a]">
                When works best?
              </h3>
            </div>
            <div className="space-y-3">
              {hangout.time_proposals.map(p => (
                <div key={p.id} className="p-4 bg-[#111111] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[15px]">
                      {new Date(p.proposed_datetime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-500 font-medium">
                      {new Date(p.proposed_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <button 
                    onClick={() => guestTimeVote(hangoutId, p.id, 1, guestToken)}
                    className="w-12 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold border border-white/5"
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Ideas Section ── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#3a3a3a]">
              The Plan
            </h3>
            <button 
              onClick={() => setShowSuggest(true)}
              className="text-xs font-bold text-[#666666] flex items-center gap-1.5"
            >
              <Plus size={14} /> Suggest thing
            </button>
          </div>

          <div className="space-y-4">
            {hangout.ideas?.length > 0 ? (
              hangout.ideas.map(idea => (
                <div 
                  key={idea.id} 
                  className={`p-5 rounded-2xl border transition-all
                    ${idea.status === 'accepted' ? 'bg-[#f5f5f5]/5 border-[#f5f5f5]/10' : 'bg-[#111111] border-white/5'}`}
                >
                  <p className="text-[15px] font-bold leading-relaxed mb-1">
                    {idea.title}
                  </p>
                  {idea.description && (
                    <p className="text-sm text-gray-500 mb-3">
                      {idea.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => guestIdeaVote(hangoutId, idea.id, 1, guestToken)}
                      className="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-bold border border-white/5"
                    >
                      +1
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-600 italic text-sm font-['DM_Sans']">
                No ideas yet. Be the first to suggest something!
              </p>
            )}
          </div>
        </div>

        {/* ── Conversion Card ── */}
        {myRsvp && (
          <div className="p-8 rounded-[32px] bg-gradient-to-br from-[#1a1a1a] to-[#111111] border border-white/10 text-center">
            <h4 className="text-xl font-bold mb-3" style={{ fontFamily: 'Syne' }}>
              Want to see who's free?
            </h4>
            <p className="text-sm text-gray-500 mb-6 font-['DM_Sans'] leading-relaxed">
              Create a free account to join the crew, pick an avatar, and see where frens are right now.
            </p>
            <button
              onClick={() => navigate('/onboarding?signup=true')}
              className="w-full h-14 rounded-2xl bg-[#f5f5f5] text-[#0a0a0a] font-bold flex items-center justify-center gap-2 group"
            >
              Join Frens <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

      </div>

      {/* ── Suggestion Modal ── */}
      {showSuggest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111111] rounded-[32px] p-8 border border-white/10">
            <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'Syne' }}>
              Suggest something
            </h3>
            <textarea
              autoFocus
              className="w-full min-h-[120px] bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 text-[#f5f5f5] mb-6 focus:outline-none focus:border-white/20"
              placeholder="What should we do?"
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSuggest(false)}
                className="flex-1 h-12 rounded-xl text-gray-500 font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    await guestSuggestIdea(hangoutId, { content: suggestion, name: user?.name, token: guestToken })
                    setToast({ message: 'Idea sent!', type: 'success' })
                    setShowSuggest(false)
                    setSuggestion('')
                    fetchHangout()
                  } catch {
                    setToast({ message: 'Failed to send', type: 'error' })
                  }
                }}
                disabled={!suggestion.trim()}
                className="flex-1 h-12 rounded-xl bg-[#f5f5f5] text-[#0a0a0a] font-bold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Guest Name Prompt Modal ── */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#111111] border border-white/10 w-full max-w-sm p-6 rounded-[24px] shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Syne' }}>
              What's your name?
            </h3>
            <p className="text-sm font-['DM_Sans'] text-gray-400 mb-6">
              Let the host know who is RSVPing.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              if (guestNameInput.trim()) {
                setShowNamePrompt(false)
                handleRsvp(pendingRsvp, guestNameInput.trim())
              }
            }}>
              <input 
                type="text" 
                autoFocus
                placeholder="e.g. John Doe" 
                value={guestNameInput}
                onChange={e => setGuestNameInput(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white font-['DM_Sans'] mb-6 outline-none focus:border-white/30 transition-colors"
                style={{ fontFamily: 'DM Sans, sans-serif' }}
              />
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNamePrompt(false)}
                  className="flex-1 h-14 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!guestNameInput.trim()}
                  className="flex-1 h-14 rounded-2xl bg-white text-black font-bold disabled:opacity-50"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}

export default HangoutInvite
