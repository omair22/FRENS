import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

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
    // 1. Get frens count
    const { count: frensCount } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    // 2. Get hangouts this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    
    const { count: hangoutsThisMonth } = await supabase
      .from('hangouts')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', req.user.id)
      .gte('datetime', startOfMonth.toISOString())

    // 3. Mock Top Frens
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren:users(*)')
      .eq('user_id', req.user.id)
      .limit(3)

    const topFrens = (friendships || []).map((f, i) => ({
      ...f.fren,
      count: Math.floor(Math.random() * 10) + 1
    })).sort((a,b) => b.count - a.count)

    res.json({
      frensCount: frensCount || 0,
      hangoutsThisMonth: hangoutsThisMonth || 0,
      streak: 5,
      topFrens
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
