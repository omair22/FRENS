import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * 1. Search users (STATIC ROUTE FIRST)
 * GET /api/frens/search?q=VALUE
 */
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query

    if (!q || q.length < 2) {
      return res.json([])
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, name, emoji, email, status')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%`)
      .neq('id', req.user.id)
      .limit(10)

    if (error) throw error

    // Check which ones are already frens
    const { data: existingFrens } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    const frenIds = existingFrens?.map(f => f.fren_id) || []

    const results = data.map(user => ({
      ...user,
      isAlreadyFren: frenIds.includes(user.id)
    }))

    res.json(results)
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * 2. Get all frens
 * GET /api/frens/
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Step 1: get fren IDs
    const { data: friendships, error: fError } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    if (fError) throw fError
    if (!friendships || friendships.length === 0) return res.json([])

    // Step 2: get user data for those IDs
    const frenIds = friendships.map(f => f.fren_id)

    const { data: frens, error: uError } = await supabase
      .from('users')
      .select('id, name, emoji, status, email')
      .in('id', frenIds)

    if (uError) throw uError
    res.json(frens || [])
  } catch (err) {
    console.error('[FRENS GET]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * 3. Add a fren (Bidirectional)
 * POST /api/frens/add
 */
router.post('/add', authMiddleware, async (req, res) => {
  const { frenId } = req.body
  if (!frenId) return res.status(400).json({ error: 'frenId is required' })

  try {
    // Check if users exist and are not already frens
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('fren_id', frenId)
      .single()

    if (existing) return res.status(400).json({ error: 'Already frens' })

    // Insert both directions
    const { error: insertError } = await supabase
      .from('friendships')
      .insert([
        { user_id: req.user.id, fren_id: frenId },
        { user_id: frenId, fren_id: req.user.id }
      ])

    if (insertError) throw insertError

    // Fetch the target user to return in the response
    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', frenId)
      .single()

    res.status(201).json({ 
      success: true, 
      fren: targetUser
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * 4. Ping a fren (Parameterized route AFTER static routes)
 * POST /api/frens/:id/ping
 */
router.post('/:id/ping', authMiddleware, async (req, res) => {
  res.json({ message: 'Ping sent! ⚡' })
})

/**
 * 5. Remove a fren (Parameterized route AFTER static routes)
 * DELETE /api/frens/:id
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .or(`and(user_id.eq.${req.user.id},fren_id.eq.${req.params.id}),and(user_id.eq.${req.params.id},fren_id.eq.${req.user.id})`)

    if (error) throw error
    res.json({ message: 'Removed' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
