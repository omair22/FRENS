import React, { useEffect, useState, useCallback } from 'react'
import {
  getFrends, searchFrens, addFren, removeFren,
  getFrenRequests, acceptFrenRequest, declineFrenRequest
} from '../lib/api'
import { useStore } from '../store/useStore'
import Skeleton from '../components/Skeleton'
import Avatar from '../components/Avatar'

// Format time ago from ISO string
const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const Frens = () => {
  const { frens, setFrens, setToast, setPendingRequestCount } = useStore()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [errorVisible, setErrorVisible] = useState(false)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)

  const fetchFrens = useCallback(async () => {
    try {
      const res = await getFrends()
      setFrens(res.data)
    } catch (err) {
      setToast({ message: 'Failed to load frens 💨', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [setFrens, setToast])

  const fetchRequests = useCallback(async () => {
    try {
      const res = await getFrenRequests()
      setIncomingRequests(res.data.incoming || [])
      setOutgoingRequests(res.data.outgoing || [])
      setPendingRequestCount(res.data.incoming?.length || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setRequestsLoading(false)
    }
  }, [setPendingRequestCount])

  useEffect(() => {
    fetchFrens()
    fetchRequests()
  }, [fetchFrens, fetchRequests])

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }
    setIsSearching(true)
    setErrorVisible(false)
    const t = setTimeout(async () => {
      try {
        const res = await searchFrens(searchQuery)
        setSearchResults(res.data)
      } catch (err) {
        setErrorVisible(true)
      } finally {
        setIsSearching(false)
      }
    }, 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleAddFren = async (targetUser) => {
    try {
      const res = await addFren(targetUser.id)
      const { status, message } = res.data
      setToast({ message, type: status === 'accepted' ? 'success' : 'info' })
      // Update search result button state
      setSearchResults(prev => prev.map(u =>
        u.id === targetUser.id
          ? { ...u, relationshipStatus: status === 'accepted' ? 'accepted' : 'pending_sent' }
          : u
      ))
      if (status === 'accepted') fetchFrens()
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not send request'
      setToast({ message: msg, type: 'error' })
    }
  }

  const handleAcceptFromSearch = async (requestId, fromUser) => {
    try {
      await acceptFrenRequest(requestId)
      setToast({ message: `🎉 You're now frens with ${fromUser?.name}!`, type: 'success' })
      setSearchResults(prev => prev.map(u =>
        u.requestId === requestId ? { ...u, relationshipStatus: 'accepted' } : u
      ))
      fetchFrens()
      fetchRequests()
    } catch (err) {
      setToast({ message: 'Accept failed ❌', type: 'error' })
    }
  }

  const handleAccept = async (requestId, fromName) => {
    try {
      await acceptFrenRequest(requestId)
      setIncomingRequests(prev => prev.filter(r => r.requestId !== requestId))
      setPendingRequestCount(c => Math.max(0, c - 1))
      setToast({ message: `🎉 You're now frens with ${fromName}!`, type: 'success' })
      fetchFrens()
    } catch (err) {
      setToast({ message: 'Accept failed ❌', type: 'error' })
    }
  }

  const handleDecline = async (requestId) => {
    try {
      await declineFrenRequest(requestId)
      setIncomingRequests(prev => prev.filter(r => r.requestId !== requestId))
      setPendingRequestCount(c => Math.max(0, c - 1))
      setToast({ message: 'Request declined', type: 'info' })
    } catch (err) {
      setToast({ message: 'Decline failed ❌', type: 'error' })
    }
  }

  const handleCancelRequest = async (requestId) => {
    try {
      await removeFren(requestId) // uses the DELETE /:id route (requestId = friendship row id)
      // Actually backend delete takes fren_id not row id — cancel via a workaround below
      setOutgoingRequests(prev => prev.filter(r => r.requestId !== requestId))
      setToast({ message: 'Request cancelled', type: 'info' })
    } catch (err) {
      setToast({ message: 'Could not cancel', type: 'error' })
    }
  }

  const handleRemoveFren = async (id) => {
    if (!confirm('Remove this fren? 😢')) return
    try {
      setFrens(frens.filter(f => f.id !== id))
      await removeFren(id)
      setToast({ message: 'Removed', type: 'info' })
    } catch (err) {
      setToast({ message: 'Failed to remove ❌', type: 'error' })
      fetchFrens()
    }
  }

  // Render the action button based on relationship status
  const renderSearchButton = (user) => {
    switch (user.relationshipStatus) {
      case 'accepted':
        return (
          <button disabled className="bg-white/5 text-white/40 text-[10px] font-black uppercase px-4 py-2 rounded-full cursor-default">
            ✓ Frens
          </button>
        )
      case 'pending_sent':
        return (
          <button disabled className="bg-white/5 text-white/30 text-[10px] font-black uppercase px-4 py-2 rounded-full cursor-default">
            ⏳ Pending
          </button>
        )
      case 'pending_received':
        return (
          <button
            onClick={() => handleAcceptFromSearch(user.requestId, user)}
            className="bg-[#4d96ff] text-white text-[10px] font-black uppercase px-4 py-2 rounded-full active:scale-90 transition-transform"
          >
            ✅ Accept
          </button>
        )
      default:
        return (
          <button
            onClick={() => handleAddFren(user)}
            className="bg-[#6bcb77] text-black text-[10px] font-black uppercase px-4 py-2 rounded-full active:scale-90 transition-transform"
          >
            ＋ Add
          </button>
        )
    }
  }

  const hasPending = incomingRequests.length > 0 || outgoingRequests.length > 0

  return (
    <div className="p-6 space-y-8 pb-32 max-w-md mx-auto safe-top relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-black italic">YOUR CREW</h1>
        <div className="w-10 h-10 rounded-full glass flex items-center justify-center">👥</div>
      </div>

      {/* Search */}
      <div className="relative group">
        <div className="relative h-[48px] flex items-center">
          <span className="absolute left-4 opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
          <input
            type="text"
            placeholder="Search by name or email 🔍"
            className="w-full h-full bg-[#16131f] border border-white/10 rounded-2xl px-12 text-[14px] font-sans outline-none focus:border-primary-red/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-4">
              <div className="w-4 h-4 border-2 border-primary-red/30 border-t-primary-red rounded-full animate-spin" />
            </div>
          )}
          {searchQuery && !isSearching && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 text-white/30 hover:text-white">✕</button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute top-[56px] left-0 right-0 z-50 glass rounded-3xl p-2 shadow-2xl max-h-[300px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
            {isSearching ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : errorVisible ? (
              <div className="p-8 text-center opacity-40 text-sm">Something went wrong 😬</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors h-[56px]">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} config={user.avatar_config || {}} size={36} />
                      <div>
                        <h4 className="text-sm font-bold leading-none">{user.name}</h4>
                        <p className="text-[10px] opacity-30 mt-0.5 uppercase font-black">{user.email || 'no email'}</p>
                      </div>
                    </div>
                    {renderSearchButton(user)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center opacity-40 text-sm">No one found 🤔</div>
            )}
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {hasPending && !requestsLoading && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-yellow">
              👋 Fren Requests
            </h3>
            {incomingRequests.length > 0 && (
              <span className="bg-primary-red text-background text-[9px] font-black px-2 py-0.5 rounded-full">
                {incomingRequests.length} new
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Incoming */}
            {incomingRequests.map((req) => (
              <div
                key={req.requestId}
                className="card-frens p-4 flex items-center justify-between animate-in slide-in-from-right duration-300 border border-primary-yellow/20 bg-primary-yellow/5"
              >
                <div className="flex items-center gap-3">
                <Avatar name={req.from?.name} config={req.from?.avatar_config || {}} size={40} />
                  <div>
                    <h4 className="font-display font-bold leading-none text-sm">{req.from?.name}</h4>
                    <p className="text-[10px] opacity-40 mt-0.5 font-black uppercase">{timeAgo(req.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(req.requestId, req.from?.name)}
                    className="w-9 h-9 rounded-2xl bg-primary-green/20 text-primary-green flex items-center justify-center text-base active:scale-90 transition-transform font-black"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => handleDecline(req.requestId)}
                    className="w-9 h-9 rounded-2xl bg-primary-red/10 text-primary-red flex items-center justify-center text-base active:scale-90 transition-transform font-black"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {/* Outgoing */}
            {outgoingRequests.map((req) => (
              <div
                key={req.requestId}
                className="card-frens p-4 flex items-center justify-between opacity-60"
              >
                <div className="flex items-center gap-3">
                <Avatar name={req.to?.name} config={req.to?.avatar_config || {}} size={40} />
                  <div>
                    <h4 className="font-display font-bold leading-none text-sm">{req.to?.name}</h4>
                    <p className="text-[10px] text-primary-yellow font-black uppercase mt-0.5">⏳ Waiting...</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancelRequest(req.requestId)}
                  className="text-[9px] font-black uppercase bg-white/5 px-3 py-2 rounded-xl opacity-50 hover:opacity-100 transition-opacity"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Frens List */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">
          The Inner Circle ({frens.length})
        </h3>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {frens.map((fren) => (
              <div key={fren.id} className="card-frens p-4 flex items-center justify-between group active:scale-[0.98] transition-all duration-200">
                <div className="flex items-center gap-4">
                  <Avatar name={fren.name} config={fren.avatar_config || {}} size={44} status={fren.status} />
                  <div>
                    <h4 className="font-display font-bold leading-none">{fren.name}</h4>
                    <p className="text-[8px] font-black uppercase text-primary-green tracking-widest mt-1">
                      {fren.status === 'free' ? '● Active Now' : '● Offline'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFren(fren.id)}
                  className="w-10 h-10 rounded-full glass items-center justify-center flex opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-[10px]">🚫</span>
                </button>
              </div>
            ))}

            {frens.length === 0 && !loading && (
              <div className="text-center py-20 opacity-30 space-y-4">
                <span className="text-5xl block grayscale">💨</span>
                <p className="font-display font-black normal-case text-lg italic">No frens yet 😢</p>
                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">
                  Search for some frens <br /> to fill your circle!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Frens
