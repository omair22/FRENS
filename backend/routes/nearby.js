import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/** Haversine formula — returns distance in miles */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * GET /api/nearby?lat=X&lng=Y
 * 1. Saves the caller's current coordinates
 * 2. Returns nearby frens with real distances
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    // 1. Save this user's current location
    await supabase
      .from('users')
      .update({ lat, lng, location_updated_at: new Date().toISOString() })
      .eq('id', req.user.id)

    // 2. Get fren IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    const frenIds = (friendships || []).map(f => f.fren_id)
    if (frenIds.length === 0) return res.json([])

    // 3. Get frens with their stored coordinates
    const { data: frens, error } = await supabase
      .from('users')
      .select('id, name, emoji, status, lat, lng, location_updated_at')
      .in('id', frenIds)
      .neq('status', 'invisible')

    if (error) throw error

    // 4. Calculate real distances, filter out frens with no location
    const result = (frens || [])
      .filter(f => f.lat !== null && f.lng !== null)
      .map(f => {
        const dist = haversine(lat, lng, f.lat, f.lng)
        // How stale is their location?
        const minutesAgo = f.location_updated_at
          ? Math.floor((Date.now() - new Date(f.location_updated_at)) / 60000)
          : null

        return {
          id: f.id,
          name: f.name,
          emoji: f.emoji,
          status: f.status,
          lat: f.lat,
          lng: f.lng,
          distance: dist < 0.1
            ? `${Math.round(dist * 5280)} ft`
            : `${dist.toFixed(1)} mi`,
          distanceMiles: dist,
          lastSeen: minutesAgo !== null
            ? minutesAgo < 1 ? 'Just now'
            : minutesAgo < 60 ? `${minutesAgo}m ago`
            : `${Math.floor(minutesAgo / 60)}h ago`
            : 'Unknown',
        }
      })
      .sort((a, b) => a.distanceMiles - b.distanceMiles)

    res.json(result)
  } catch (err) {
    console.error('[NEARBY]', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
