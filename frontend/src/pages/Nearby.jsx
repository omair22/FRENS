import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNearby, pingFren, getNearbyVenues, createHangout, updateProfile } from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import BottomSheet from '../components/BottomSheet'
import NearbyMap from '../components/NearbyMap'

const statusColor = (status) => {
  const map = {
    free: '#6bcb77',
    busy: '#ff6b6b',
    maybe: '#ffd93d',
    ghost: '#c77dff',
    inv: '#666',
    offline: '#444'
  }
  return map[status] || '#444'
}

const Nearby = () => {
  const navigate = useNavigate()
  const { user: currentUser, setToast, setUser } = useStore()

  // App state
  const [frens, setFrens] = useState([]) // Was nearbyFrens
  const [coords, setCoords] = useState(null) // Was userLocation
  const [loading, setLoading] = useState(true)

  // UI State
  const [mode, setMode] = useState('frens') // 'frens' | 'places'
  const [venueCategory, setVenueCategory] = useState('all')
  const [venues, setVenues] = useState([])
  const [venuesLoading, setVenuesLoading] = useState(false)
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedFren, setSelectedFren] = useState(null)
  const [showPingFlow, setShowPingFlow] = useState(false)
  const [showStatusPicker, setShowStatusPicker] = useState(false)

  // Ping/Pin flows
  const [pingTime, setPingTime] = useState(null)
  const [venuePingFrenIds, setVenuePingFrenIds] = useState([])
  const [venuePingTime, setVenuePingTime] = useState(null)
  const [venuePinning, setVenuePinning] = useState(false)

  const lastVenueFetchLocation = useRef(null)

  const hasMoved = (newLoc, oldLoc, thresholdMeters = 100) => {
    if (!oldLoc) return true
    const R = 6371000
    const dLat = (newLoc.lat - oldLoc.lat) * Math.PI / 180
    const dLng = (newLoc.lng - oldLoc.lng) * Math.PI / 180
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(oldLoc.lat * Math.PI / 180) *
      Math.cos(newLoc.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return d > thresholdMeters
  }

  // Geolocation & Frens Fetching
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          fetchNearby(c.lat, c.lng)
        },
        (err) => {
          console.error('[LOCATION ERROR]', err)
          setLoading(false)
          setToast({ message: 'Location access required 📍', type: 'error' })
        }
      )
    } else {
      setLoading(false)
    }
  }, [])

  const fetchNearby = async (lat, lng) => {
    try {
      const effectiveMode = currentUser?.status || 'free'
      const res = await getNearby(lat, lng, effectiveMode)
      setFrens(res.data)
    } catch (err) {
      console.error('[GET NEARBY ERROR]', err)
    } finally {
      setLoading(false)
    }
  }

  // Refetch frens periodically or on status change
  useEffect(() => {
    if (coords) {
      fetchNearby(coords.lat, coords.lng)
    }
  }, [currentUser?.status])

  // Fetch Venues when Places mode is active
  useEffect(() => {
    if (mode !== 'places' || !coords) return

    if (!hasMoved(coords, lastVenueFetchLocation.current)) {
      return
    }

    const load = async () => {
      setVenuesLoading(true)
      lastVenueFetchLocation.current = coords
      try {
        const res = await getNearbyVenues(coords.lat, coords.lng, venueCategory)
        setVenues(res.data.venues || res.data)
      } catch (err) {
        console.error('[VENUES ERROR]', err)
        setVenues([])
      } finally {
        setVenuesLoading(false)
      }
    }

    load()
  }, [mode, venueCategory, coords])

  // Handlers
  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateProfile({ status: newStatus })
      setUser({ ...currentUser, status: newStatus })
      setToast({ message: 'Status updated', type: 'success' })
      setShowStatusPicker(false)
    } catch {
      setToast({ message: 'Failed to update status', type: 'error' })
    }
  }

  const handleVenuePin = async () => {
    if (!selectedVenue || venuePingFrenIds.length === 0) return
    setVenuePinning(true)

    try {
      let datetime = null
      if (venuePingTime !== null && venuePingTime >= 0) {
        const d = new Date()
        d.setMinutes(d.getMinutes() + venuePingTime)
        datetime = d.toISOString()
      }

      const res = await createHangout({
        title: selectedVenue.name,
        emoji: selectedVenue.icon || '📍',
        location: selectedVenue.address,
        datetime,
        notes: null,
        is_public: false,
        invited_frens: venuePingFrenIds
      })

      setToast({ message: 'Hangout created', type: 'success' })
      setSelectedVenue(null)
      setVenuePingFrenIds([])
      setVenuePingTime(null)
      navigate(`/hangout/${res.data.id}`)
    } catch (err) {
      console.error('[CREATE HANGOUT ERROR]', err)
      setToast({ message: 'Could not create hangout', type: 'error' })
    } finally {
      setVenuePinning(false)
    }
  }

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto flex flex-col pt-safe bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3">
        <h1 className="font-display font-black text-2xl pl-1">Nearby</h1>
        {/* Own status indicator — tap to change */}
        <button
          onClick={() => setShowStatusPicker(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="w-2 h-2 rounded-full"
            style={{ background: statusColor(currentUser?.status) }} />
          <span className="text-xs font-bold text-white/60 capitalize">
            {currentUser?.status === 'inv' ? 'invisible' : currentUser?.status || 'offline'}
          </span>
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center mb-3 px-5">
        <div className="flex p-1 rounded-2xl w-full"
          style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
          {['frens', 'places'].map(m => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                // Clear selections when switching
                setSelectedVenue(null)
                setSelectedFren(null)
                setShowPingFlow(false)
              }}
              className="flex-1 py-2 rounded-xl text-sm font-black capitalize transition-all"
              style={{
                background: mode === m ? '#ff6b6b' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.35)',
                boxShadow: mode === m ? '0 4px 12px rgba(255,107,107,0.3)' : 'none'
              }}
            >
              {m === 'frens' ? '👥 Frens' : '📍 Places'}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="relative mx-4 rounded-3xl overflow-hidden shadow-2xl z-0" style={{ height: '52vh' }}>
        <NearbyMap
          frens={mode === 'frens' ? frens : []}
          venues={mode === 'places' ? venues : []}
          venuesLoading={venuesLoading}
          userLocation={coords}
          onFrenTap={(fren) => {
            setSelectedFren(fren)
            setShowPingFlow(true)
          }}
          onVenueTap={(venue) => setSelectedVenue(venue)}
        />

        {/* Ghost mode banner — only in frens mode, if active */}
        {mode === 'frens' && currentUser?.status === 'ghost' && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 px-3 py-2 rounded-2xl pointer-events-none z-10"
            style={{ background: 'rgba(199,125,255,0.12)', border: '1px solid rgba(199,125,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <span className="text-sm">👻</span>
            <p className="text-xs font-bold" style={{ color: '#c77dff' }}>
              Ghost mode — you're hidden, frens are visible
            </p>
          </div>
        )}
      </div>

      {/* Bottom panel — FRENS mode */}
      {mode === 'frens' && (
        <div className="px-4 mt-6">
          {loading ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-white/30">Scanning...</p>
            </div>
          ) : frens.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-white/30">No frens nearby</p>
              <p className="text-xs text-white/20 mt-1">They need location sharing on</p>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-3 pl-1">
                {frens.length} fren{frens.length > 1 ? 's' : ''} nearby
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-1">
                {frens.map(fren => (
                  <button
                    key={fren.id}
                    onClick={() => {
                      setSelectedFren(fren)
                      setShowPingFlow(true)
                    }}
                    className="flex flex-col items-center gap-2 flex-shrink-0 transition-all active:scale-95"
                  >
                    <div className="relative hover:scale-105 active:scale-95 transition-transform">
                      <Avatar
                        name={fren.name}
                        config={fren.avatar_config || {}}
                        size={56}
                        status={fren.status}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-white/80">{fren.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{fren.distance}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom panel — PLACES mode */}
      {mode === 'places' && (
        <div className="px-4 mt-6">
          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-3">
            {[
              { key: 'all', label: 'All', emoji: '🗺️' },
              { key: 'food', label: 'Food', emoji: '🍽️' },
              { key: 'coffee', label: 'Coffee', emoji: '☕' },
              { key: 'drinks', label: 'Drinks', emoji: '🍺' },
              { key: 'parks', label: 'Outside', emoji: '🌳' },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setVenueCategory(cat.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex-shrink-0 whitespace-nowrap"
                style={{
                  background: venueCategory === cat.key ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: venueCategory === cat.key ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.07)',
                  color: venueCategory === cat.key ? '#ff6b6b' : 'rgba(255,255,255,0.35)'
                }}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Venue list */}
          {venuesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#16131f' }} />
              ))}
            </div>
          ) : venues.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-white/30">No places found nearby</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto no-scrollbar" style={{ maxHeight: '28vh' }}>
              {venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                  style={{
                    background: selectedVenue?.id === venue.id ? 'rgba(255,107,107,0.1)' : '#16131f',
                    border: selectedVenue?.id === venue.id ? '1px solid rgba(255,107,107,0.3)' : '1px solid rgba(255,255,255,0.07)'
                  }}
                >
                  <div className="w-11 h-11 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center text-xl"
                    style={{ background: '#1d1928' }}>
                    {venue.photo ? <img src={venue.photo} alt="" className="w-full h-full object-cover" /> : venue.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{venue.name}</p>
                      {venue.isOpen === true && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6bcb77' }} />}
                      {venue.isOpen === false && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ff6b6b' }} />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {venue.rating && <span className="text-[11px] text-white/40">★ {venue.rating}</span>}
                      {venue.priceLevel > 0 && <span className="text-[11px] text-white/25">{'£'.repeat(venue.priceLevel)}</span>}
                      <span className="text-[11px] text-white/25 truncate">{venue.address?.split(',')[0]}</span>
                    </div>
                  </div>

                  <span className="text-white/20 text-sm flex-shrink-0">›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ping Flow Bottom Sheet */}
      {showPingFlow && selectedFren && (
        <BottomSheet onClose={() => { setShowPingFlow(false); setSelectedFren(null) }} title="">
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={selectedFren.name} config={selectedFren.avatar_config || {}} size={64} status={selectedFren.status} />
            <div>
              <h2 className="font-display font-black text-2xl">{selectedFren.name.split(' ')[0]}</h2>
              <p className="text-sm text-white/40 mt-0.5">{selectedFren.distance} away</p>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Meet when?</p>

          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: 'Just ping', value: null },
              { label: 'Now', value: 0 },
              { label: '5 min', value: 5 },
              { label: '10 min', value: 10 },
              { label: '15 min', value: 15 },
              { label: '20 min', value: 20 },
              { label: '30 min', value: 30 },
              { label: '1 hour', value: 60 },
            ].map(t => (
              <button
                key={String(t.value)}
                onClick={() => setPingTime(t.value)}
                className="px-4 py-2 rounded-full text-sm font-bold border transition-all"
                style={{
                  background: pingTime === t.value ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: pingTime === t.value ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.08)',
                  color: pingTime === t.value ? '#ff6b6b' : 'rgba(255,255,255,0.35)',
                  boxShadow: pingTime === t.value ? '0 0 12px rgba(255,107,107,0.15)' : 'none'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              try {
                await pingFren(selectedFren.id, {
                  timeOffsetMinutes: pingTime,
                  timeLabel: pingTime === null ? null : pingTime === 0 ? 'right now' : pingTime < 60 ? `in ${pingTime} min` : 'in an hour'
                })
                setToast({ message: 'Ping sent!', type: 'success' })
                setShowPingFlow(false)
                setSelectedFren(null)
                setPingTime(null)
              } catch {
                setToast({ message: 'Ping failed', type: 'error' })
              }
            }}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
              color: '#fff',
              boxShadow: '0 6px 20px rgba(255,107,107,0.3)'
            }}
          >
            {pingTime === null
              ? `Ping ${selectedFren.name.split(' ')[0]}`
              : pingTime === 0
                ? `Ping — meet right now`
                : pingTime < 60
                  ? `Ping — meet in ${pingTime} min`
                  : `Ping — meet in an hour`}
          </button>
        </BottomSheet>
      )}

      {/* Venue Pin Bottom Sheet */}
      {selectedVenue && mode === 'places' && (
        <BottomSheet onClose={() => setSelectedVenue(null)} title="">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: '#1d1928' }}>
              {selectedVenue.photo ? <img src={selectedVenue.photo} alt="" className="w-full h-full object-cover" /> : selectedVenue.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-black text-xl leading-tight truncate">{selectedVenue.name}</h2>
              <p className="text-xs text-white/35 mt-0.5 truncate">{selectedVenue.address}</p>
              <div className="flex items-center gap-3 mt-1">
                {selectedVenue.rating && <span className="text-xs text-white/40">★ {selectedVenue.rating}</span>}
                {selectedVenue.isOpen !== null && (
                  <span className="text-xs font-bold" style={{ color: selectedVenue.isOpen ? '#6bcb77' : '#ff6b6b' }}>
                    {selectedVenue.isOpen ? 'Open' : 'Closed'}
                  </span>
                )}
                {selectedVenue.priceLevel > 0 && <span className="text-xs text-white/25">{'£'.repeat(selectedVenue.priceLevel)}</span>}
              </div>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">Bring who?</p>

          {frens.length === 0 ? (
            <p className="text-sm text-white/25 mb-4">No frens nearby right now</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 mb-5 px-1">
              {frens
                .sort((a, b) => (b.closeness || 0) - (a.closeness || 0))
                .map(fren => {
                  const selected = venuePingFrenIds.includes(fren.id)
                  return (
                    <button
                      key={fren.id}
                      onClick={() => setVenuePingFrenIds(prev =>
                        prev.includes(fren.id)
                          ? prev.filter(id => id !== fren.id)
                          : [...prev, fren.id]
                      )}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 transition-all hover:scale-105 active:scale-95"
                      style={{ opacity: selected ? 1 : 0.45 }}
                    >
                      <div className="relative">
                        <Avatar name={fren.name} config={fren.avatar_config || {}} size={52} status={fren.status} />
                        {selected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                            style={{ background: '#ff6b6b', color: '#fff', border: '2px solid #0e0c14' }}>
                            ✓
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/55 font-semibold max-w-[52px] truncate">
                        {fren.name.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">When?</p>

          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { label: 'TBD', value: null },
              { label: 'Now', value: 0 },
              { label: '5 min', value: 5 },
              { label: '10 min', value: 10 },
              { label: '15 min', value: 15 },
              { label: '20 min', value: 20 },
              { label: '30 min', value: 30 },
              { label: '1 hour', value: 60 },
            ].map(t => (
              <button
                key={String(t.value)}
                onClick={() => setVenuePingTime(t.value)}
                className="px-4 py-2 rounded-full text-sm font-bold border transition-all"
                style={{
                  background: venuePingTime === t.value ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.04)',
                  borderColor: venuePingTime === t.value ? 'rgba(255,107,107,0.5)' : 'rgba(255,255,255,0.08)',
                  color: venuePingTime === t.value ? '#ff6b6b' : 'rgba(255,255,255,0.35)',
                  boxShadow: venuePingTime === t.value ? '0 0 12px rgba(255,107,107,0.15)' : 'none'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleVenuePin}
            disabled={venuePingFrenIds.length === 0 || venuePinning}
            className="w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-[0.98]"
            style={{
              background: venuePingFrenIds.length > 0
                ? 'linear-gradient(135deg, #ff6b6b, #ff8e53)'
                : 'rgba(255,107,107,0.1)',
              color: venuePingFrenIds.length > 0 ? '#fff' : 'rgba(255,107,107,0.3)',
              boxShadow: venuePingFrenIds.length > 0 ? '0 6px 20px rgba(255,107,107,0.3)' : 'none'
            }}
          >
            {venuePinning ? 'Creating...'
              : venuePingFrenIds.length === 0 ? 'Select frens first'
                : venuePingTime === null
                  ? `Pin ${venuePingFrenIds.length} fren${venuePingFrenIds.length > 1 ? 's' : ''} here`
                  : venuePingTime === 0
                    ? `Head to ${selectedVenue.name} now`
                    : `Meet at ${selectedVenue.name} in ${venuePingTime < 60 ? venuePingTime + ' min' : '1 hour'}`
            }
          </button>
        </BottomSheet>
      )}

      {/* Status Picker Bottom Sheet */}
      {showStatusPicker && (
        <BottomSheet onClose={() => setShowStatusPicker(false)} title="What's your vibe?">
          <div className="space-y-2 mt-2">
            {[
              { id: 'free', label: 'Free to hang', icon: '🟢' },
              { id: 'busy', label: 'Busy', icon: '🔴' },
              { id: 'maybe', label: 'Maybe later', icon: '🟡' },
              { id: 'ghost', label: 'Ghost mode (Hide on map)', icon: '👻' },
              { id: 'inv', label: 'Invisible (Fully hidden)', icon: '🫥' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => handleUpdateStatus(s.id)}
                className="w-full p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-white/5 active:scale-[0.98]"
                style={{
                  background: currentUser?.status === s.id ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                  border: currentUser?.status === s.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="font-bold">{s.label}</span>
                </div>
                {currentUser?.status === s.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

export default Nearby
