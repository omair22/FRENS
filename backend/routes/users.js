import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * GET /api/users/:id/profile
 * Returns public profile and shared stats if frens
 */
router.get('/:id/profile', authMiddleware, async (req, res) => {
  try {
    const targetId = req.params.id
    const viewerId = req.user.id

    // Get target user's public info
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, emoji, status, avatar_style, avatar_config, created_at')
      .eq('id', targetId)
      .single()

    if (error || !user) return res.status(404).json({ error: 'User not found' })

    // Check friendship status
    const { data: friendship } = await supabase
      .from('friendships')
      .select('status, created_at')
      .eq('user_id', viewerId)
      .eq('fren_id', targetId)
      .single()

    const isFren = friendship?.status === 'accepted'
    const isMe = viewerId === targetId

    // Shared stats — only if frens or viewing own profile
    let sharedStats = null
    if (isFren || isMe) {

      // Hangouts together — hangouts where BOTH users have 'in' RSVP
      const { data: myRsvps } = await supabase
        .from('rsvps')
        .select('hangout_id')
        .eq('user_id', viewerId)
        .eq('response', 'in')

      const { data: theirRsvps } = await supabase
        .from('rsvps')
        .select('hangout_id')
        .eq('user_id', targetId)
        .eq('response', 'in')

      const myHangoutIds = new Set((myRsvps || []).map(r => r.hangout_id))
      const theirHangoutIds = new Set((theirRsvps || []).map(r => r.hangout_id))
      const sharedHangoutIds = [...myHangoutIds].filter(id => theirHangoutIds.has(id))

      // Also include hangouts where one created and other attended
      const { data: createdByThem } = await supabase
        .from('hangouts')
        .select('id')
        .eq('created_by', targetId)
        .in('id', [...myHangoutIds])

      const { data: createdByMe } = await supabase
        .from('hangouts')
        .select('id')
        .eq('created_by', viewerId)
        .in('id', [...theirHangoutIds])

      const allSharedIds = new Set([
        ...sharedHangoutIds,
        ...(createdByThem || []).map(h => h.id),
        ...(createdByMe || []).map(h => h.id)
      ])

      // Get those hangouts with details
      const { data: sharedHangouts } = allSharedIds.size > 0
        ? await supabase
          .from('hangouts')
          .select('id, title, emoji, datetime, status')
          .in('id', [...allSharedIds])
          .order('datetime', { ascending: false })
          .limit(10)
        : { data: [] }

      // Frens since date
      const frensSince = friendship?.created_at || null

      // Their total hangout count (public stat)
      const { count: totalHangouts } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetId)
        .eq('response', 'in')

      // Their created hangouts count
      const { count: createdCount } = await supabase
        .from('hangouts')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', targetId)

      sharedStats = {
        hangoutsTogether: allSharedIds.size,
        recentTogether: sharedHangouts || [],
        frensSince,
        theirTotalHangouts: totalHangouts || 0,
        theirCreatedHangouts: createdCount || 0,
      }
    }

    res.json({
      user,
      isFren,
      isMe,
      friendshipStatus: friendship?.status || null,
      sharedStats
    })
  } catch (err) {
    console.error('[USER PROFILE]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Update current status
 */
router.patch('/status', authMiddleware, async (req, res) => {
  const { status } = req.body
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get user stats and top frens
 */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Get confirmed frens count
    const { count: frensCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'accepted')

    // 2. Get hangouts participated in this month (RSVP 'in')
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: myRsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('hangout_id, hangouts(datetime)')
      .eq('user_id', userId)
      .eq('response', 'in')

    if (rsvpError) throw rsvpError

    const attendedHangouts = (myRsvps || [])
      .map(r => r.hangouts)
      .filter(h => h && h.datetime)
      .map(h => ({ ...h, date: h.datetime.split('T')[0] }))

    const hangoutsThisMonth = attendedHangouts.filter(h => new Date(h.datetime) >= startOfMonth).length

    // 3. Calculate Streak (Consecutive days with at least one hangout)
    const uniqueDates = [...new Set(attendedHangouts.map(h => h.date))].sort().reverse()
    let streak = 0
    if (uniqueDates.length > 0) {
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      // Only start counting if the most recent hangout was today or yesterday
      if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
        streak = 1
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = new Date(uniqueDates[i])
          const prev = new Date(uniqueDates[i + 1])
          const diffInDays = (current - prev) / (1000 * 60 * 60 * 24)
          if (diffInDays === 1) {
            streak++
          } else {
            break
          }
        }
      }
    }

    // 4. Real Top Frens (closeness = shared hangouts)
    // Get all accepted fren IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id, fren:users(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted')

    const topFrens = []
    if (friendships && friendships.length > 0 && myRsvps && myRsvps.length > 0) {
      const myHangoutIds = new Set(myRsvps.map(r => r.hangout_id))
      const frenIds = friendships.map(f => f.fren_id)

      const { data: frenRsvps } = await supabase
        .from('rsvps')
        .select('user_id, hangout_id')
        .in('user_id', frenIds)
        .eq('response', 'in')
        .in('hangout_id', [...myHangoutIds])

      const closeness = {}
      frenIds.forEach(id => { closeness[id] = 0 })
      ;(frenRsvps || []).forEach(r => { closeness[r.user_id]++ })

      friendships.forEach(f => {
        topFrens.push({
          ...f.fren,
          count: closeness[f.fren_id] || 0
        })
      })
      topFrens.sort((a, b) => b.count - a.count)
    }

    res.json({
      frensCount: frensCount || 0,
      hangoutsThisMonth,
      streak,
      topFrens: topFrens.slice(0, 5) // Top 5
    })
  } catch (err) {
    console.error('[STATS ERROR]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Update avatar config (customisation JSON)
 */
router.patch('/avatar-config', authMiddleware, async (req, res) => {
  try {
    const { config } = req.body
    if (!config) return res.status(400).json({ error: 'config required' })
    const { error } = await supabase.from('users').update({ avatar_config: config }).eq('id', req.user.id)
    if (error) throw error
    res.json({ success: true, avatar_config: config })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** Update display name */
router.patch('/name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Name required' })
    if (name.length > 30) return res.status(400).json({ error: 'Max 30 characters' })
    const { error } = await supabase.from('users').update({ name: name.trim() }).eq('id', req.user.id)
    if (error) throw error
    res.json({ success: true, name: name.trim() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** Update notification preferences */
router.patch('/notifications', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body
    const { error } = await supabase.from('users').update({ notification_prefs: preferences }).eq('id', req.user.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** Update privacy preferences */
router.patch('/privacy', authMiddleware, async (req, res) => {
  try {
    const { preferences } = req.body
    const { error } = await supabase.from('users').update({ privacy_prefs: preferences }).eq('id', req.user.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** Delete account and all associated data */
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    // Cascade delete user data
    await supabase.from('vibe_votes').delete().eq('user_id', userId)
    await supabase.from('rsvps').delete().eq('user_id', userId)
    await supabase.from('photos').delete().eq('uploaded_by', userId)
    await supabase.from('friendships').delete().or(`user_id.eq.${userId},fren_id.eq.${userId}`)
    await supabase.from('hangout_stops').delete().eq('created_by', userId)
    await supabase.from('hangouts').delete().eq('created_by', userId)
    await supabase.from('availability').delete().eq('user_id', userId)
    await supabase.from('users').delete().eq('id', userId)
    // Delete from Supabase Auth (requires service role key)
    try { await supabase.auth.admin.deleteUser(userId) } catch { }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
