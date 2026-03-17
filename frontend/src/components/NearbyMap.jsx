import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { buildAvatarUrl } from '../lib/avatar'

// Fix leaflet icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// "You" pulse icon
const youIcon = L.divIcon({
    html: `<div style="width:14px;height:14px;background:#f5f5f5;border-radius:50%;border:4px solid #0a0a0a;box-shadow:0 0 0 4px rgba(255,255,255,0.05),0 0 0 10px rgba(255,255,255,0.02);"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
})

const clusterIcon = (frens) => {
    const visible = frens.slice(0, 3)
    const extra = frens.length - visible.length

    const imgs = visible.map((f, i) => {
        const url = buildAvatarUrl(f.name, f.avatar_config || {})
        const offset = i * 16
        return `<img src="${url}" style="
      position:absolute;
      left:${offset}px;
      top:0;
      width:44px;height:44px;
      border-radius:50%;
      border:3px solid #0a0a0a;
      background:#111111;
      object-fit:cover;
    " />`
    }).join('')

    const totalWidth = visible.length * 16 + 44
    const extraBadge = extra > 0
        ? `<div style="
        position:absolute;
        right:-8px;top:-8px;
        background:#ff4d4d;
        color:white;
        font-family: 'DM Sans', sans-serif;
        font-size:9px;
        font-weight:700;
        border-radius:50%;
        width:20px;height:20px;
        display:flex;align-items:center;justify-content:center;
        border:2px solid #0a0a0a;
      ">+${extra}</div>`
        : ''

    const nameLine = frens.length === 1
        ? `<div style="font-family: 'DM Sans', sans-serif; margin-top:6px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#666666;text-align:center;white-space:nowrap;">${frens[0].name.split(' ')[0]}</div>`
        : `<div style="font-family: 'DM Sans', sans-serif; margin-top:6px;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#666666;text-align:center;">${frens.length} frens</div>`

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

const dist = (a, b) => {
    const R = 3958.8
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const x = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

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

const NearbyMap = ({ frens, venues, venuesLoading, userLocation, onFrenTap, onVenueTap }) => {
    const defaultCenter = userLocation ? [userLocation.lat, userLocation.lng] : [37.7749, -122.4194]
    const frensWithCoords = frens.filter(f => f.lat && f.lng)
    const clusters = clusterFrens(frensWithCoords)

    return (
        <div className="w-full h-full relative z-0">
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

                {userLocation && (
                    <>
                        <FlyToLocation coords={userLocation} />
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={youIcon}>
                            <Popup>
                                <strong>You</strong> — You&rsquo;re here
                            </Popup>
                        </Marker>
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={300}
                            pathOptions={{ color: '#4d96ff', fillColor: '#4d96ff', fillOpacity: 0.05, weight: 1 }}
                        />
                    </>
                )}

                {/* Frens Layer */}
                {clusters.map((cluster, i) => (
                    <Marker
                        key={i}
                        position={[cluster.lat, cluster.lng]}
                        icon={clusterIcon(cluster.frens)}
                        eventHandlers={{
                            click: () => {
                                if (cluster.frens.length === 1 && onFrenTap) {
                                    onFrenTap(cluster.frens[0])
                                }
                            }
                        }}
                    >
                        {cluster.frens.length > 1 && (
                            <Popup>
                                <div style={{ minWidth: 120 }}>
                                    {cluster.frens.map(f => (
                                        <div
                                            key={f.id}
                                            onClick={() => onFrenTap && onFrenTap(f)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer' }}
                                        >
                                            <img
                                                src={buildAvatarUrl(f.name, f.avatar_config || {})}
                                                style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1428' }}
                                                alt={f.name}
                                            />
                                            <span style={{ fontWeight: 700, fontSize: 12, color: 'black' }}>{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </Popup>
                        )}
                    </Marker>
                ))}

                {/* Venues Layer */}
                {venues.map(venue => {
                    const venuePin = L.divIcon({
                        html: `
              <div style="position:relative; display:inline-flex; flex-direction:column; align-items:center;">
                <div style="
                  display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:12px;
                  background:#111111; border:1px solid rgba(255,255,255,0.07);
                  box-shadow:0 8px 16px rgba(0,0,0,0.4); white-space:nowrap;
                ">
                  <span style="font-family: 'DM Sans', sans-serif; font-size:11px; font-weight:600; color:#f5f5f5; max-width:100px; overflow:hidden; text-overflow:ellipsis;">
                    ${venue.name}
                  </span>
                  ${venue.isOpen === true ? '<div style="width:6px;height:6px;border-radius:50%;background:#4caf7d;flex-shrink:0;"></div>' : ''}
                  ${venue.isOpen === false ? '<div style="width:6px;height:6px;border-radius:50%;background:#ff4d4d;flex-shrink:0;"></div>' : ''}
                </div>
                <div style="
                  width:8px; height:8px; background:#111111;
                  border-right:1px solid rgba(255,255,255,0.07);
                  border-bottom:1px solid rgba(255,255,255,0.07);
                  transform:rotate(45deg); margin-top:-5px;
                "></div>
              </div>
            `,
                        className: '',
                        iconSize: [0, 0],
                        iconAnchor: [0, 32],
                    })

                    return (
                        <Marker
                            key={venue.id}
                            position={[venue.lat, venue.lng]}
                            icon={venuePin}
                            eventHandlers={{ click: () => onVenueTap && onVenueTap(venue) }}
                            zIndexOffset={-50}
                        />
                    )
                })}
            </MapContainer>

            {/* Loading overlay for venues */}
            {venuesLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full text-xs font-bold text-white shadow-xl pointer-events-none animate-pulse"
                    style={{ background: 'rgba(22,19,31,0.85)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                    Finding places...
                </div>
            )}
        </div>
    )
}

export default NearbyMap
