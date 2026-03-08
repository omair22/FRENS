import React, { useEffect, useState, useCallback } from 'react'
import { getFrends, searchFrens, addFren, removeFren } from '../lib/api'
import { useStore } from '../store/useStore'
import Skeleton from '../components/Skeleton'
import Avatar from '../components/Avatar'

const Frens = () => {
  const { frens, setFrens, setToast } = useStore()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [errorVisible, setErrorVisible] = useState(false)

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

  useEffect(() => {
    fetchFrens()
  }, [fetchFrens])

  // Debounced Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    setErrorVisible(false)
    
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await searchFrens(searchQuery)
        setSearchResults(res.data)
      } catch (err) {
        console.error(err)
        setErrorVisible(true)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleAddFren = async (targetUser) => {
    try {
      // Optimistic update
      setFrens([...frens, targetUser])
      setSearchResults(searchResults.filter(u => u.id !== targetUser.id))
      setSearchQuery('') // Clear search
      
      const res = await addFren(targetUser.id)
      if (res.data.success) {
        setToast({ message: '🎉 Fren added!', type: 'success' })
        fetchFrens() // Refresh full data to be safe
      }
    } catch (err) {
      setToast({ message: "Couldn't add fren, try again", type: 'error' })
      fetchFrens() // rollback
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


  return (
    <div className="p-6 space-y-8 pb-32 max-w-md mx-auto safe-top relative">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display font-black italic">YOUR CREW</h1>
        <div className="w-10 h-10 rounded-full glass flex items-center justify-center">👥</div>
      </div>

      {/* Search Container */}
      <div className="relative group">
        <div className="relative h-[48px] flex items-center">
          <span className="absolute left-4 opacity-30 group-focus-within:opacity-100 transition-opacity">
            🔍
          </span>
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
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-white/30 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute top-[56px] left-0 right-0 z-50 glass rounded-3xl p-2 shadow-2xl max-h-[300px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-300">
            {isSearching ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : errorVisible ? (
              <div className="p-8 text-center opacity-40 text-sm">
                Something went wrong, try again 😬
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-2xl transition-colors h-[52px]">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="md" />
                      <div>
                        <h4 className="text-sm font-bold leading-none">{user.name}</h4>
                        <p className="text-[10px] opacity-30 mt-1 uppercase font-black">
                          {user.email || 'no email'}
                        </p>
                      </div>
                    </div>
                    {user.isAlreadyFren ? (
                      <button className="bg-white/5 text-white/40 text-[10px] font-black uppercase px-4 py-2 rounded-full cursor-default">
                        ✓ Frens
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleAddFren(user)}
                        className="bg-[#6bcb77] text-background text-[10px] font-black uppercase px-4 py-2 rounded-full active:scale-90 transition-transform"
                      >
                        ＋ Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center opacity-40 text-sm">
                No one found with that name or email 🤔
              </div>
            )}
          </div>
        )}
      </div>

      {/* Frens List (Only visible when not searching or below results) */}
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
                  <Avatar user={fren} size="md" showStatus={true} />
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

            {frens.length === 0 && (
              <div className="text-center py-20 opacity-30 space-y-4">
                <span className="text-5xl block grayscale">💨</span>
                <p className="font-display font-black normal-case text-lg italic">No frens yet 😢</p>
                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">
                  Search for some frens <br/> to fill your circle!
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
