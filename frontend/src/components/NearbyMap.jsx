import React, { useEffect, useState, useMemo } from 'react'
import { APIProvider, Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps'
import { buildAvatarUrl } from '../lib/avatar'

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

// Custom hook to draw a Google Maps Circle
const MapCircle = ({ center, radius }) => {
    const map = useMap()
    const maps = useMapsLibrary('maps')
    const [circle, setCircle] = useState(null)

    useEffect(() => {
        if (!map || !maps) return
        const c = new maps.Circle({
            strokeColor: '#4d96ff',
            strokeOpacity: 0.8,
            strokeWeight: 1,
            fillColor: '#4d96ff',
            fillOpacity: 0.05,
            map,
            center,
            radius,
            clickable: false
        })
        setCircle(c)
        return () => c.setMap(null)
    }, [map, maps])

    useEffect(() => {
        if (circle && center && radius != null) {
            circle.setCenter(center)
            circle.setRadius(radius)
        }
    }, [circle, center, radius])

    return null
}

const FlyToLocation = ({ coords }) => {
    const map = useMap()
    useEffect(() => {
        if (coords && map) {
            map.panTo({ lat: coords.lat, lng: coords.lng })
        }
    }, [coords, map])
    return null
}

const NearbyMap = ({ frens, venues, venuesLoading, userLocation, onFrenTap, onVenueTap, radius = 300 }) => {
    const defaultCenter = useMemo(() => userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : { lat: 37.7749, lng: -122.4194 }, [])
    const frensWithCoords = useMemo(() => frens.filter(f => f.lat && f.lng), [frens])
    const clusters = useMemo(() => clusterFrens(frensWithCoords), [frensWithCoords])

    return (
        <div className="w-full h-full relative z-0">
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
                <Map
                    defaultCenter={defaultCenter}
                    defaultZoom={15}
                    mapId={import.meta.env.VITE_GOOGLE_MAP_ID || 'DEMO_MAP_ID'}
                    disableDefaultUI={true}
                    gestureHandling={'greedy'}
                    tilt={45} // Applies the 3D tilt
                    heading={0}
                    colorScheme={'DARK'}
                >
                    {userLocation && (
                        <>
                            <FlyToLocation coords={userLocation} />
                            <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }}>
                                <div style={{
                                    width: 14, height: 14, background: '#f5f5f5', borderRadius: '50%',
                                    border: '4px solid #0a0a0a', boxShadow: '0 0 0 4px rgba(255,255,255,0.05), 0 0 0 10px rgba(255,255,255,0.02)'
                                }} />
                            </AdvancedMarker>
                            <MapCircle center={{ lat: userLocation.lat, lng: userLocation.lng }} radius={radius} />
                        </>
                    )}

                    {/* Frens Layer */}
                    {clusters.map((cluster, i) => {
                        const visible = cluster.frens.slice(0, 3)
                        const extra = cluster.frens.length - visible.length
                        const totalWidth = visible.length * 16 + 44

                        return (
                            <AdvancedMarker
                                key={`cluster-${i}`}
                                position={{ lat: cluster.lat, lng: cluster.lng }}
                                onClick={() => {
                                    if (cluster.frens.length === 1 && onFrenTap) onFrenTap(cluster.frens[0])
                                }}
                                style={{ transform: 'translate(0, -50%)', zIndex: 100 }}
                            >
                                <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', width: totalWidth, height: 44 }}>
                                        {visible.map((f, i) => (
                                            <img
                                                key={f.id}
                                                src={buildAvatarUrl(f.name, f.avatar_config || {})}
                                                style={{
                                                    position: 'absolute', left: i * 16, top: 0,
                                                    width: 44, height: 44, borderRadius: '50%',
                                                    border: '3px solid #0a0a0a', background: '#111111', objectFit: 'cover'
                                                }}
                                                alt=""
                                            />
                                        ))}
                                        {extra > 0 && (
                                            <div style={{
                                                position: 'absolute', right: -8, top: -8,
                                                background: '#ff4d4d', color: 'white', fontFamily: '"DM Sans", sans-serif',
                                                fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 20, height: 20,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0a0a0a'
                                            }}>+{extra}</div>
                                        )}
                                    </div>
                                    <div style={{
                                        fontFamily: '"DM Sans", sans-serif', marginTop: 6, fontSize: 9, fontWeight: 600,
                                        textTransform: 'uppercase', letterSpacing: '.05em', color: '#666666', textAlign: 'center', whiteSpace: 'nowrap',
                                        background: 'rgba(10,10,10,0.8)', padding: '2px 6px', borderRadius: 4
                                    }}>
                                        {cluster.frens.length === 1 ? cluster.frens[0].name.split(' ')[0] : `${cluster.frens.length} frens`}
                                    </div>
                                </div>
                            </AdvancedMarker>
                        )
                    })}

                    {/* Venues Layer */}
                    {venues.map(venue => (
                        <AdvancedMarker
                            key={`venue-${venue.id}`}
                            position={{ lat: venue.lat, lng: venue.lng }}
                            onClick={() => onVenueTap && onVenueTap(venue)}
                            style={{ transform: 'translate(0, -100%)' }}
                        >
                            <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 12,
                                    background: '#111111', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 8px 16px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'
                                }}>
                                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 11, fontWeight: 600, color: '#f5f5f5', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {venue.name}
                                    </span>
                                    {venue.isOpen === true && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf7d', flexShrink: 0 }} />}
                                    {venue.isOpen === false && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff4d4d', flexShrink: 0 }} />}
                                </div>
                                <div style={{
                                    width: 8, height: 8, background: '#111111',
                                    borderRight: '1px solid rgba(255,255,255,0.07)',
                                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                                    transform: 'rotate(45deg)', marginTop: -5
                                }} />
                            </div>
                        </AdvancedMarker>
                    ))}
                </Map>
            </APIProvider>

            {/* Loading overlay */}
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
