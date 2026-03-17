import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNearby, pingFren, getNearbyVenues, createHangout, updateStatus } from '../lib/api'
import { useStore } from '../store/useStore'
import Avatar from '../components/Avatar'
import BottomSheet from '../components/BottomSheet'
import NearbyMap from '../components/NearbyMap'

const statusColor = (status) => {
  const map = {
    free: '#4caf7d',
    busy: '#ff4d4d',
    maybe: '#f5a623',
    ghost: '#9b7fff',
    inv: '#3a3a3a',
    offline: '#3a3a3a'
  }
  return map[status] || '#3a3a3a'
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
      await updateStatus(newStatus)
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
    <div style={{ minHeight: '100vh', paddingBottom: 120, maxWidth: 448, margin: '0 auto', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '56px 20px 12px' }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>Nearby</h1>
        <button
          onClick={() => setShowStatusPicker(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 9999,
            background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(currentUser?.status) }} />
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: '#666666', textTransform: 'capitalize' }}>
            {currentUser?.status === 'inv' ? 'Invisible' : currentUser?.status || 'Offline'}
          </span>
        </button>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: '0 20px 12px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', width: '100%', background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 4 }}>
          {['frens', 'places'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setSelectedVenue(null); setSelectedFren(null); setShowPingFlow(false) }}
              style={{
                flex: 1, height: 36, borderRadius: 8,
                background: mode === m ? '#f5f5f5' : 'transparent',
                color: mode === m ? '#0a0a0a' : '#666666',
                border: 'none',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize',
                transition: 'background 0.15s ease',
              }}
            >
              {m === 'frens' ? 'Frens' : 'Places'}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative', margin: '0 20px', borderRadius: 12, overflow: 'hidden', height: '50vh' }}>
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
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9b7fff' }} />
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#f5f5f5', margin: 0 }}>
              Ghost mode — you're invisible on the map
            </p>
          </div>
        )}
      </div>

      {/* Bottom panel — FRENS mode */}
      {mode === 'frens' && (
        <div style={{ padding: '20px 20px 0' }}>
          {loading ? (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', textAlign: 'center', padding: '16px 0' }}>Scanning...</p>
          ) : frens.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', margin: '0 0 4px' }}>No frens nearby</p>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a' }}>They need location sharing on</p>
            </div>
          ) : (
            <>
              <p className="section-label" style={{ marginBottom: 12 }}>
                {frens.length} fren{frens.length > 1 ? 's' : ''} nearby
              </p>
              <div style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 8px' }}>
                {frens.map(fren => (
                  <button
                    key={fren.id}
                    onClick={() => { setSelectedFren(fren); setShowPingFlow(true) }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Avatar name={fren.name} config={fren.avatar_config || {}} size={44} status={fren.status} />
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, fontWeight: 500, color: '#f5f5f5', margin: 0 }}>{fren.name.split(' ')[0]}</p>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 10, color: '#666666', margin: 0 }}>{fren.distance}</p>
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
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px 12px' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'food', label: 'Food' },
              { key: 'coffee', label: 'Coffee' },
              { key: 'drinks', label: 'Drinks' },
              { key: 'parks', label: 'Outside' },
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setVenueCategory(cat.key)}
                className={`pill ${venueCategory === cat.key ? 'pill-active' : 'pill-inactive'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {venuesLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
            </div>
          ) : venues.length === 0 ? (
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', textAlign: 'center', padding: '16px 0' }}>No places found nearby</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '30vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
              {venues.map(venue => (
                <button
                  key={venue.id}
                  onClick={() => setSelectedVenue(venue)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 12, borderRadius: 12, textAlign: 'left',
                    background: selectedVenue?.id === venue.id ? '#1a1a1a' : '#111111',
                    border: selectedVenue?.id === venue.id ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden' }}>
                    {venue.photo ? <img src={venue.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : venue.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#f5f5f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.name}</p>
                      {venue.isOpen === true && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf7d', flexShrink: 0 }} />}
                      {venue.isOpen === false && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d4d', flexShrink: 0 }} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      {venue.rating && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666' }}>★ {venue.rating}</span>}
                      <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{venue.address?.split(',')[0]}</span>
                    </div>
                  </div>
                  <span style={{ color: '#3a3a3a', fontSize: 16, flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ping Flow Bottom Sheet */}
      {showPingFlow && selectedFren && (
        <BottomSheet isOpen={true} onClose={() => { setShowPingFlow(false); setSelectedFren(null) }} title="">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Avatar name={selectedFren.name} config={selectedFren.avatar_config || {}} size={64} status={selectedFren.status} />
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
                {selectedFren.name.split(' ')[0]}
              </h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', marginTop: 2 }}>
                {selectedFren.distance} away
              </p>
            </div>
          </div>

          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>Meet when?</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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
                style={{
                  padding: '8px 16px', borderRadius: 9999,
                  background: pingTime === t.value ? '#f5f5f5' : '#1a1a1a',
                  color: pingTime === t.value ? '#0a0a0a' : '#666666',
                  border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease'
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
            className="btn-primary"
          style={{ width: '100%' }}
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
        <BottomSheet isOpen={true} onClose={() => setSelectedVenue(null)} title="">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {selectedVenue.photo ? <img src={selectedVenue.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selectedVenue.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedVenue.name}</h2>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedVenue.address}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                {selectedVenue.rating && <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666' }}>★ {selectedVenue.rating}</span>}
                {selectedVenue.isOpen !== null && (
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: selectedVenue.isOpen ? '#4caf7d' : '#ff4d4d' }}>
                    {selectedVenue.isOpen ? 'Open' : 'Closed'}
                  </span>
                )}
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

          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 600, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>When?</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
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
                style={{
                  padding: '8px 16px', borderRadius: 9999,
                  background: venuePingTime === t.value ? '#f5f5f5' : '#1a1a1a',
                  color: venuePingTime === t.value ? '#0a0a0a' : '#666666',
                  border: '1px solid rgba(255,255,255,0.07)',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleVenuePin}
            disabled={venuePingFrenIds.length === 0 || venuePinning}
            style={{
              width: '100%', height: 52,
              background: venuePingFrenIds.length > 0 ? '#f5f5f5' : '#1a1a1a',
              color: venuePingFrenIds.length > 0 ? '#0a0a0a' : '#3a3a3a',
              border: 'none', borderRadius: 12,
              fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15,
              cursor: venuePingFrenIds.length > 0 ? 'pointer' : 'default',
              transition: 'transform 0.1s ease',
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
        <BottomSheet isOpen={showStatusPicker} onClose={() => setShowStatusPicker(false)} title="What's your vibe?">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 32px' }}>
            {[
              { id: 'free', label: 'Free to hang', color: '#4caf7d' },
              { id: 'maybe', label: 'Maybe later', color: '#f5a623' },
              { id: 'busy', label: 'Busy', color: '#ff4d4d' },
              { id: 'ghost', label: 'Ghost mode', color: '#9b7fff' },
              { id: 'inv', label: 'Invisible', color: '#666666' },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => handleUpdateStatus(s.id)}
                className="btn-secondary"
                style={{
                  height: 56, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px',
                  background: currentUser?.status === s.id ? '#1a1a1a' : '#111111',
                  borderColor: currentUser?.status === s.id ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.07)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5' }}>{s.label}</span>
                </div>
                {currentUser?.status === s.id && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4caf7d', border: '2px solid #0a0a0a' }} />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  )
}

export default Nearby
