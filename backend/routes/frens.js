import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { notify } from '../lib/notify.js'

const router = express.Router()

/**
 * GET /api/frens/search?q=VALUE
 * Returns users with relationship status for each result
 */
router.get('/search', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json([])
  try {
    const q = String(req.query.q || '')
    if (!q || q.length < 2) return res.json([])

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, status, avatar_style, avatar_config')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', req.user.id)
      .limit(10)

    if (error) throw error

    // Get all relationships with these users (both directions)
    const userIds = data.map(u => u.id)
    if (userIds.length === 0) return res.json([])

    const { data: relationships } = await supabase
      .from('friendships')
      .select('id, user_id, fren_id, status')
      .or(
        userIds.map(id =>
          `and(user_id.eq.${req.user.id},fren_id.eq.${id}),and(user_id.eq.${id},fren_id.eq.${req.user.id})`
        ).join(',')
      )

    const results = data.map(user => {
      const rel = (relationships || []).find(
        r => (r.user_id === req.user.id && r.fren_id === user.id) ||
          (r.user_id === user.id && r.fren_id === req.user.id)
      )

      let relationshipStatus = 'none'
      let requestId = null
      if (rel) {
        if (rel.status === 'accepted') {
          relationshipStatus = 'accepted'
        } else if (rel.status === 'pending' && rel.user_id === req.user.id) {
          relationshipStatus = 'pending_sent'
          requestId = rel.id
        } else if (rel.status === 'pending' && rel.fren_id === req.user.id) {
          relationshipStatus = 'pending_received'
          requestId = rel.id
        }
      }

      return { ...user, relationshipStatus, requestId }
    })

    res.json(results)
  } catch (err) {
    console.error('[SEARCH]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/frens/requests
 * Get incoming + outgoing pending requests
 */
router.get('/requests', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json({ incoming: [], outgoing: [] })
  try {
    const [{ data: incoming }, { data: outgoing }] = await Promise.all([
      supabase.from('friendships').select('id, user_id, created_at').eq('fren_id', req.user.id).eq('status', 'pending'),
      supabase.from('friendships').select('id, fren_id, created_at').eq('user_id', req.user.id).eq('status', 'pending'),
    ])

    const incomingUserIds = (incoming || []).map(r => r.user_id)
    const outgoingUserIds = (outgoing || []).map(r => r.fren_id)
    const allIds = [...new Set([...incomingUserIds, ...outgoingUserIds])]

    let users = []
    if (allIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, name, email, status, avatar_style, avatar_config')
        .in('id', allIds)
      users = data || []
    }

    const byId = (id) => users.find(u => u.id === id)

    res.json({
      incoming: (incoming || []).map(r => ({ requestId: r.id, from: byId(r.user_id), created_at: r.created_at, type: 'incoming' })),
      outgoing: (outgoing || []).map(r => ({ requestId: r.id, to: byId(r.fren_id), created_at: r.created_at, type: 'outgoing' })),
    })
  } catch (err) {
    console.error('[REQUESTS]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/frens/
 * Returns ACCEPTED frens, sorted by closeness (shared hangouts)
 */
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.json([])
  try {
    // Step 1: get fren IDs
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)
      .eq('status', 'accepted')

    const frenIds = (friendships || []).map(f => f.fren_id)
    if (frenIds.length === 0) return res.json([])

    // Step 2: get fren user objects
    const { data: frens } = await supabase
      .from('users')
      .select('id, name, emoji, status, avatar_style, avatar_config, email')
      .in('id', frenIds)

    // Step 3: get current user's 'in' hangouts
    const { data: myRsvps } = await supabase
      .from('rsvps')
      .select('hangout_id')
      .eq('user_id', req.user.id)
      .eq('response', 'in')

    const myHangoutIds = new Set((myRsvps || []).map(r => r.hangout_id))

    // Step 4: for each fren, count shared hangouts
    if (myHangoutIds.size > 0) {
      const { data: frenRsvps } = await supabase
        .from('rsvps')
        .select('user_id, hangout_id')
        .in('user_id', frenIds)
        .eq('response', 'in')
        .in('hangout_id', [...myHangoutIds])

      // Build closeness map
      const closeness = {}
      frenIds.forEach(id => { closeness[id] = 0 })
        ; (frenRsvps || []).forEach(r => {
          if (closeness[r.user_id] !== undefined) {
            closeness[r.user_id]++
          }
        })

      // Attach closeness to each fren
      const frensWithScore = (frens || []).map(f => ({
        ...f,
        closeness: closeness[f.id] || 0
      }))

      // Sort: highest closeness first, then alphabetically
      frensWithScore.sort((a, b) => {
        if (b.closeness !== a.closeness) return b.closeness - a.closeness
        return a.name.localeCompare(b.name)
      })

      return res.json(frensWithScore)
    }

    // No hangouts yet — just return alphabetically with 0 closeness
    const frensWithScore = (frens || [])
      .map(f => ({ ...f, closeness: 0 }))
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json(frensWithScore)
  } catch (err) {
    console.error('[FRENS]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/frens/add — Send a fren request
 */
router.post('/add', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.status(403).json({ error: 'Guests cannot add frens' })
  try {
    const { frenId } = req.body
    if (!frenId) return res.status(400).json({ error: 'frenId required' })
    if (frenId === req.user.id) return res.status(400).json({ error: 'Cannot add yourself' })

    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status, user_id, fren_id')
      .or(
        `and(user_id.eq.${req.user.id},fren_id.eq.${frenId}),` +
        `and(user_id.eq.${frenId},fren_id.eq.${req.user.id})`
      )

    if (existing && existing.length > 0) {
      const rel = existing[0]
      if (rel.status === 'accepted') return res.status(400).json({ error: 'Already frens' })
      if (rel.status === 'pending' && rel.user_id === req.user.id) return res.status(400).json({ error: 'Request already sent' })

      // They already sent YOU a request — auto accept
      if (rel.status === 'pending' && rel.fren_id === req.user.id) {
        await supabase.from('friendships').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', rel.id)
        await supabase.from('friendships').insert({ user_id: req.user.id, fren_id: frenId, status: 'accepted', requested_by: req.user.id, responded_at: new Date().toISOString() })
        return res.json({ success: true, status: 'accepted', message: 'Auto-accepted! You both added each other 🎉' })
      }
    }

    const { data: targetUser } = await supabase.from('users').select('id, name').eq('id', frenId).single()
    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    const { error: insertError } = await supabase.from('friendships').insert({
      user_id: req.user.id, fren_id: frenId, status: 'pending', requested_by: req.user.id
    })

    if (insertError) throw insertError

    // Notify target user
    const { data: sender } = await supabase.from('users').select('name').eq('id', req.user.id).single()
    await notify(frenId, {
      type: 'fren_request',
      title: '👋 New fren request',
      body: `${sender?.name || 'Someone'} wants to be your fren`,
      data: { fromUserId: req.user.id },
    })

    res.json({ success: true, status: 'pending', message: `Fren request sent to ${targetUser.name}! ⏳` })
  } catch (err) {
    console.error('[ADD FREN]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/frens/accept
 */
router.post('/accept', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.status(403).json({ error: 'Guests cannot accept frens' })
  try {
    const { requestId } = req.body
    if (!requestId) return res.status(400).json({ error: 'requestId required' })

    const { data: request, error: findError } = await supabase
      .from('friendships').select('*').eq('id', requestId).eq('fren_id', req.user.id).eq('status', 'pending').single()

    if (findError || !request) return res.status(404).json({ error: 'Request not found' })

    await supabase.from('friendships').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', requestId)
    await supabase.from('friendships').insert({ user_id: req.user.id, fren_id: request.user_id, status: 'accepted', requested_by: request.user_id, responded_at: new Date().toISOString() })

    // Notify the requester
    const { data: acceptor } = await supabase.from('users').select('name').eq('id', req.user.id).single()
    await notify(request.user_id, {
      type: 'fren_accepted',
      title: '🎉 Fren request accepted!',
      body: `${acceptor?.name || 'Someone'} accepted your fren request`,
      data: { frenId: req.user.id },
    })

    const { data: newFren } = await supabase.from('users').select('id, name, email, status, avatar_style, avatar_config').eq('id', request.user_id).single()
    res.json({ success: true, fren: newFren })
  } catch (err) {
    console.error('[ACCEPT]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * DELETE /api/frens/:id — Remove a fren (both directions)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  if (req.user.isGuest) return res.status(403).json({ error: 'Guests cannot remove frens' })
  try {
    const { error } = await supabase.from('friendships').delete()
      .or(`and(user_id.eq.${req.user.id},fren_id.eq.${req.params.id}),and(user_id.eq.${req.params.id},fren_id.eq.${req.user.id})`)
    if (error) throw error
    res.json({ message: 'Removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
