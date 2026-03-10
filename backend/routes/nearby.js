import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/** Haversine — returns miles */
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
 * GET /api/nearby?lat=X&lng=Y&mode=out|ghost|inv
 *
 * out       — share location, appear to others, see others
 * ghost     — see others, hidden from all EXCEPT mutual frens
 * inv       — completely offline: location cleared, see nobody
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lat  = parseFloat(req.query.lat)
    const lng  = parseFloat(req.query.lng)
    const mode = req.query.mode || 'out'

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng are required' })
    }

    // --- Invisible: clear location, return empty ---
    if (mode === 'inv' || mode === 'invisible') {
      await supabase
        .from('users')
        .update({ lat: null, lng: null, location_mode: 'invisible' })
        .eq('id', req.user.id)
      return res.json([])
    }

    // --- Ghost: save location (so others know you're ghost) but see nobody ---
    if (mode === 'ghost') {
      await supabase
        .from('users')
        .update({ lat, lng, location_updated_at: new Date().toISOString(), location_mode: 'ghost' })
        .eq('id', req.user.id)
      return res.json([])
    }

    // --- Out: save location, see others ---
    await supabase
      .from('users')
      .update({ lat, lng, location_updated_at: new Date().toISOString(), location_mode: 'out' })
      .eq('id', req.user.id)

    // 1. Get accepted fren IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')

    const frenIds = (friendships || []).map(f => f.fren_id)
    if (frenIds.length === 0) return res.json([])

    // 2. Fetch frens with location (exclude invisible)
    const { data: frens, error } = await supabase
      .from('users')
      .select('id, name, avatar_style, avatar_config, status, lat, lng, location_updated_at, location_mode')
      .in('id', frenIds)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .neq('location_mode', 'invisible')

    if (error) throw error

    // 3. For ghost frens: only show them if they're a MUTUAL fren
    //    (friendship exists in both directions)
    const ghostFrenIds = (frens || []).filter(f => f.location_mode === 'ghost').map(f => f.id)
    let mutualFrenIds = new Set()

    if (ghostFrenIds.length > 0) {
      const { data: reverseFriendships } = await supabase
        .from('friendships')
        .select('user_id')
        .in('user_id', ghostFrenIds)
        .eq('fren_id', req.user.id)
        .eq('status', 'accepted')

      mutualFrenIds = new Set((reverseFriendships || []).map(f => f.user_id))
    }

    const visibleFrens = (frens || []).filter(f => {
      if (f.location_mode === 'ghost') return mutualFrenIds.has(f.id)
      return true // out mode → always visible
    })

    // 4. Compute distances
    const result = visibleFrens
      .map(f => {
        const dist = haversine(lat, lng, f.lat, f.lng)
        const minutesAgo = f.location_updated_at
          ? Math.floor((Date.now() - new Date(f.location_updated_at)) / 60000)
          : null

        return {
          id: f.id,
          name: f.name,
          avatar_style: f.avatar_style,
          avatar_config: f.avatar_config,
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
          isGhost: f.location_mode === 'ghost',
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
