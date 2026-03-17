import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFrends, getFrenRequests, searchFrens, addFren, acceptFrenRequest, declineFrenRequest, removeFren } from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'

const SearchIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const Frens = () => {
  const { user, setToast, setAuthPrompt } = useStore()
  const navigate = useNavigate()

  const [frens, setFrens] = useState([])
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] })
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.isGuest) {
      setAuthPrompt('add-fren')
      return
    }
    loadData()
  }, [user?.isGuest])

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchFrens(searchQuery)
        setSearchResults(res.data)
      } catch { setSearchResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadData = async () => {
    try {
      const [frensRes, reqRes] = await Promise.all([getFrends(), getFrenRequests()])
      setFrens(frensRes.data)
      setRequests(reqRes.data)
    } catch { setToast({ message: 'Failed to load', type: 'error' }) }
    finally { setLoading(false) }
  }

  const handleSendRequest = async (toId) => {
    try {
      await addFren(toId)
      setToast({ message: 'Request sent', type: 'success' })
      setSearchResults(prev => prev.map(u => u.id === toId ? { ...u, requestSent: true } : u))
    } catch { setToast({ message: 'Failed to send request', type: 'error' }) }
  }

  const handleAccept = async (fromId) => {
    try {
      await acceptFrenRequest(fromId)
      await loadData()
      setToast({ message: 'Friend added', type: 'success' })
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const handleDecline = async (fromId) => {
    try {
      await declineFrenRequest(fromId)
      setRequests(prev => ({ ...prev, incoming: prev.incoming.filter(r => r.id !== fromId) }))
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const handleRemove = async (frenId) => {
    try {
      await removeFren(frenId)
      setFrens(prev => prev.filter(f => f.id !== frenId))
      setToast({ message: 'Removed', type: 'info' })
    } catch { setToast({ message: 'Failed', type: 'error' }) }
  }

  const showSearch = searchQuery.length >= 2

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{
        padding: '56px 20px 12px',
        position: 'sticky', top: 0, zIndex: 30, background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: '#f5f5f5', margin: '0 0 12px' }}>
          Frens
        </h1>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#3a3a3a', display: 'flex' }}>
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: '#3a3a3a',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 20px' }}>

        {/* ── Search Results ── */}
        {showSearch && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Results</p>
            {searching ? (
              <div className="skeleton" style={{ height: 56, borderRadius: 12 }} />
            ) : searchResults.length === 0 ? (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', padding: '16px 0' }}>No users found</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map(u => {
                  const isSelf = u.id === user?.id
                  const isFren = frens.some(f => f.id === u.id)
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px',
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12,
                      }}
                    >
                      <Avatar name={u.name} config={u.avatar_config || {}} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>{u.name}</p>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: 0 }}>{u.email}</p>
                      </div>
                      {!isSelf && (
                        isFren ? (
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#4caf7d' }}>Frens</span>
                        ) : u.requestSent ? (
                          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a' }}>Sent</span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(u.id)}
                            style={{
                              padding: '6px 14px', borderRadius: 8,
                              background: '#f5f5f5', color: '#0a0a0a',
                              border: 'none',
                              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            Add
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Incoming Requests ── */}
        {!showSearch && requests.incoming?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 8 }}>Requests · {requests.incoming.length}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {requests.incoming.map(r => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    background: '#111111',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12,
                  }}
                >
                  <Avatar name={r.name} config={r.avatar_config || {}} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>{r.name}</p>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: 0 }}>Wants to be frens</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                      onClick={() => handleDecline(r.id)}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#666666', fontFamily: 'DM Sans, sans-serif', fontSize: 16, cursor: 'pointer',
                      }}
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => handleAccept(r.id)}
                      style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#f5f5f5', border: 'none',
                        color: '#0a0a0a', fontFamily: 'DM Sans, sans-serif', fontSize: 16, cursor: 'pointer',
                      }}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Frens List ── */}
        {!showSearch && (
          <div>
            <p className="section-label" style={{ marginBottom: 8 }}>
              Your Crew · {frens.length}
            </p>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
              </div>
            ) : frens.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', marginBottom: 8 }}>No frens yet</p>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666' }}>Search to add someone</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {frens.map(f => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      background: '#111111',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/profile/${f.id}`)}
                  >
                    <Avatar name={f.name} config={f.avatar_config || {}} size={40} status={f.status} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>{f.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: f.status === 'free' ? '#4caf7d' : f.status === 'busy' ? '#ff4d4d' : '#3a3a3a'
                        }} />
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: 0, textTransform: 'capitalize' }}>
                          {f.status || 'offline'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(f.id) }}
                      style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: 'none', border: '1px solid rgba(255,255,255,0.07)',
                        color: '#3a3a3a', fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ···
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Frens
