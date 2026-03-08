import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/** Haversine formula — returns distance in miles */
const haversine = (lat1, lng1, lat2, lng2) => {
  const R = 3958.8
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
 * GET /api/nearby?lat=X&lng=Y&mode=out|ghost|invisible
 *
 * Modes:
 *  out       — share your location, appear to others, see others ✅
 *  ghost     — still see others, but YOU are hidden from theirs 👻
 *  invisible — completely offline: location cleared, see no one   🫥
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lat  = parseFloat(req.query.lat)
    const lng  = parseFloat(req.query.lng)
    const mode = req.query.mode || 'out'  // 'out' | 'ghost' | 'invisible'

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    // 1. Update the user's location + mode in the DB
    if (mode === 'invisible') {
      // Clear coordinates so they vanish from everyone else's radar
      await supabase
        .from('users')
        .update({ lat: null, lng: null, location_mode: 'invisible' })
        .eq('id', req.user.id)

      // Invisible users see nobody
      return res.json([])
    }

    // For 'out' and 'ghost': save location, save mode
    await supabase
      .from('users')
      .update({ lat, lng, location_updated_at: new Date().toISOString(), location_mode: mode })
      .eq('id', req.user.id)

    // 2. Get accepted fren IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')

    const frenIds = (friendships || []).map(f => f.fren_id)
    if (frenIds.length === 0) return res.json([])

    // 3. Fetch frens — only those in 'out' mode (ghost + invisible are hidden from your list)
    const { data: frens, error } = await supabase
      .from('users')
      .select('id, name, avatar_style, status, lat, lng, location_updated_at, location_mode')
      .in('id', frenIds)
      .eq('location_mode', 'out')   // hidden users don't appear
      .not('lat', 'is', null)
      .not('lng', 'is', null)

    if (error) throw error

    // 4. Compute real distances
    const result = (frens || [])
      .map(f => {
        const dist = haversine(lat, lng, f.lat, f.lng)
        const minutesAgo = f.location_updated_at
          ? Math.floor((Date.now() - new Date(f.location_updated_at)) / 60000)
          : null

        return {
          id: f.id,
          name: f.name,
          avatar_style: f.avatar_style,
          status: f.status,
          lat: f.lat,
          lng: f.lng,
          distance: dist < 0.1
            ? `${Math.round(dist * 5280)} ft`
            : `${dist.toFixed(1)} mi`,
          distanceMiles: dist,
          lastSeen: minutesAgo !== null
            ? minutesAgo < 1  ? 'Just now'
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
