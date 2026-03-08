import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getNearby, pingFren } from '../lib/api'
import { useStore } from '../store/useStore'
import { getAvatarUrl } from '../lib/avatar'
import Avatar from '../components/Avatar'
import Skeleton from '../components/Skeleton'

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// "You" pulse icon
const youIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;background:#4d96ff;border-radius:50%;border:3px solid white;box-shadow:0 0 0 6px rgba(77,150,255,0.3),0 0 0 14px rgba(77,150,255,0.1);"></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

// Snapchat-style cluster icon: stacked avatar rings
const clusterIcon = (frens) => {
  const visible = frens.slice(0, 3)
  const extra = frens.length - visible.length

  // Stacked avatar images — each offset slightly
  const imgs = visible.map((f, i) => {
    const url = getAvatarUrl(f, 80)
    const offset = i * 16
    return `<img src="${url}" style="
      position:absolute;
      left:${offset}px;
      top:0;
      width:44px;height:44px;
      border-radius:50%;
      border:3px solid #141020;
      background:#1a1428;
      object-fit:cover;
    " />`
  }).join('')

  const totalWidth = visible.length * 16 + 44
  const extraBadge = extra > 0
    ? `<div style="
        position:absolute;
        right:-8px;top:-8px;
        background:#ff4d6d;
        color:white;
        font-size:9px;
        font-weight:900;
        border-radius:50%;
        width:20px;height:20px;
        display:flex;align-items:center;justify-content:center;
        border:2px solid #141020;
      ">+${extra}</div>`
    : ''

  const nameLine = frens.length === 1
    ? `<div style="margin-top:6px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.7);text-align:center;white-space:nowrap;">${frens[0].name.split(' ')[0]}</div>`
    : `<div style="margin-top:6px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:rgba(255,255,255,.7);text-align:center;">${frens.length} frens</div>`

  return L.divIcon({
    html: `<div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;">
      <div style="position:relative;width:${totalWidth}px;height:44px;">${imgs}${extraBadge}</div>
      ${nameLine}
    </div>`,
    className: '',
    iconSize: [totalWidth + 16, 70],
    iconAnchor: [(totalWidth + 16) / 2, 52],
    popupAnchor: [0, -55],
  })
}

// Haversine distance in miles (client-side, for clustering only)
const dist = (a, b) => {
  const R = 3958.8
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

// Group frens within 0.1 miles into clusters (Snapchat-style)
const clusterFrens = (frens, radius = 0.1) => {
  const clusters = []
  const used = new Set()
  frens.forEach((f, i) => {
    if (used.has(i)) return
    const group = [f]
    used.add(i)
    frens.forEach((g, j) => {
      if (j !== i && !used.has(j) && dist(f, g) < radius) {
        group.push(g)
        used.add(j)
      }
    })
    // Cluster center = average lat/lng
    const lat = group.reduce((s, m) => s + m.lat, 0) / group.length
    const lng = group.reduce((s, m) => s + m.lng, 0) / group.length
    clusters.push({ lat, lng, frens: group })
  })
  return clusters
}

const FlyToLocation = ({ coords }) => {
  const map = useMap()
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 15, { duration: 1.5 })
  }, [coords, map])
  return null
}

const Nearby = () => {
  const { user, setToast } = useStore()
  const [frens, setFrens] = useState([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState(() => localStorage.getItem('location_mode') || 'out')
  const [coords, setCoords] = useState(null)
  const [locationError, setLocationError] = useState(false)

  // Initial geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(c)
          fetchNearby(c.lat, c.lng, mode)
        },
        (err) => {
          console.error(err)
          setLoading(false)
          setLocationError(true)
          setToast({ message: 'Location access required 📍', type: 'error' })
        }
      )
    }
  }, [])

  // Re-fetch whenever mode changes (if we already have coords)
  useEffect(() => {
    localStorage.setItem('location_mode', mode)
    if (coords) {
      setLoading(true)
      fetchNearby(coords.lat, coords.lng, mode)
    }
  }, [mode])

  const fetchNearby = async (lat, lng, currentMode) => {
    try {
      const res = await getNearby(lat, lng, currentMode)
      setFrens(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePing = async (id, name) => {
    try {
      await pingFren(id)
      setToast({ message: `Pinged ${name}! ⚡`, type: 'success' })
    } catch (err) {
      setToast({ message: 'Ping failed ❌', type: 'error' })
    }
  }

  const frensWithCoords = frens.filter(f => f.lat && f.lng)
  const clusters = clusterFrens(frensWithCoords)
  const defaultCenter = coords ? [coords.lat, coords.lng] : [37.7749, -122.4194]

  return (
    <div className="min-h-screen pb-32 max-w-md mx-auto relative flex flex-col safe-top">
      {/* Map */}
      <div className="h-[45vh] relative overflow-hidden rounded-b-[3rem] shadow-2xl z-0">
        {locationError ? (
          <div className="w-full h-full bg-card flex flex-col items-center justify-center gap-4 opacity-60">
            <span className="text-4xl">📍</span>
            <p className="text-[10px] font-black uppercase tracking-widest">Location access required</p>
            <p className="text-[9px] opacity-50">Enable location in your browser settings</p>
          </div>
        ) : (
          <MapContainer
            center={defaultCenter}
            zoom={14}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />

            {coords && (
              <>
                <FlyToLocation coords={coords} />
                <Marker position={[coords.lat, coords.lng]} icon={youIcon}>
                  <Popup>
                    <strong>{user?.name || 'You'}</strong> — You&rsquo;re here
                  </Popup>
                </Marker>
                <Circle
                  center={[coords.lat, coords.lng]}
                  radius={300}
                  pathOptions={{ color: '#4d96ff', fillColor: '#4d96ff', fillOpacity: 0.05, weight: 1 }}
                />
              </>
            )}

            {/* Snapchat-style cluster markers */}
            {clusters.map((cluster, i) => (
              <Marker
                key={i}
                position={[cluster.lat, cluster.lng]}
                icon={clusterIcon(cluster.frens)}
              >
                <Popup>
                  <div style={{ minWidth: 120 }}>
                    {cluster.frens.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <img
                          src={getAvatarUrl(f, 40)}
                          style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1428' }}
                          alt={f.name}
                        />
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{f.name}</span>
                        <span style={{ fontSize: 10, opacity: 0.5 }}>{f.distance}</span>
                      </div>
                    ))}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Overlay: title + mode toggle */}
        <div className="absolute bottom-5 left-4 right-4 flex items-end justify-between z-[999] pointer-events-none">
          <div>
            <h1 className="text-3xl font-display font-black italic drop-shadow-lg">NEARBY</h1>
            {mode === 'ghost' && (
              <span className="text-[9px] font-black uppercase tracking-widest text-primary-purple bg-primary-purple/20 px-2 py-0.5 rounded-full">
                👻 Hidden from others
              </span>
            )}
            {mode === 'inv' && (
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                🫥 Fully invisible
              </span>
            )}
          </div>
          <div className="bg-background/80 backdrop-blur rounded-2xl p-1 flex border border-white/5 pointer-events-auto">
            {[['out','🟢'],['ghost','👻'],['inv','🫥']].map(([m, icon]) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex items-center gap-1 ${mode === m ? 'bg-primary-blue text-background' : 'opacity-30'}`}
              >
                <span>{icon}</span> {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nearby List */}
      <div className="flex-1 p-6 space-y-6 bg-background rounded-t-[3rem] -translate-y-8 relative z-10 shadow-2xl">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Frens in Range</h3>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${coords ? 'text-primary-blue bg-primary-blue/10' : 'text-white/20 bg-white/5'}`}>
            {coords ? '● Radar Active' : '● Locating...'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {frens.map(f => (
              <div key={f.id} className="card-frens p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <Avatar user={f} size="md" showStatus={true} />
                  <div>
                    <h4 className="font-display font-bold leading-none">{f.name}</h4>
                    <p className="text-[10px] font-black uppercase opacity-20 mt-1">
                      {f.distance || '?'} away · {f.lastSeen || f.status || 'unknown'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePing(f.id, f.name)}
                  className="w-12 h-12 rounded-2xl bg-primary-blue/10 text-primary-blue flex items-center justify-center text-xl active:scale-90 transition-transform"
                >
                  ⚡
                </button>
              </div>
            ))}

            {frens.length === 0 && (
              <div className="text-center py-16 opacity-30 space-y-4">
                <span className="text-5xl block animate-pulse">🛰️</span>
                <p className="font-display font-black normal-case text-lg italic">Scanning for frens...</p>
                <p className="text-[10px] uppercase font-black tracking-widest leading-loose">No one is nearby right now.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Nearby
