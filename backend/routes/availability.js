import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * Get availability for me + frens (14 days)
 */
router.get('/', authMiddleware, async (req, res) => {
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(startDate.getDate() + 14)

  try {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    const frenIds = friendships.map(f => f.fren_id)
    frenIds.push(req.user.id)

    const { data, error } = await supabase
      .from('availability')
      .select('*, user:users(*)')
      .in('user_id', frenIds)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Set availability for a date
 */
router.post('/', authMiddleware, async (req, res) => {
  const { date, status } = req.body
  try {
    const { data, error } = await supabase
      .from('availability')
      .upsert({ 
        user_id: req.user.id, 
        date, 
        status 
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Set bulk availability
 */
router.post('/bulk', authMiddleware, async (req, res) => {
  const { availabilities } = req.body // array of {date, status}
  const rows = availabilities.map(a => ({ ...a, user_id: req.user.id }))
  
  try {
    const { data, error } = await supabase
      .from('availability')
      .upsert(rows)
      .select()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
