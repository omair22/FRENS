import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { supabase } from '../lib/supabase.js'
import { suggestBestTime, generateNudge } from '../lib/claude.js'

const router = express.Router()

/**
 * Get AI scheduling suggestion for the current user's friend group
 */
router.get('/suggest', authMiddleware, async (req, res) => {
  try {
    // Get frens
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    const frenIds = (friendships || []).map(f => f.fren_id)
    
    if (frenIds.length === 0) {
      return res.json({ 
        suggestion: null, 
        message: 'Add some frens first to get scheduling suggestions!' 
      })
    }

    // Get all users in the group (current user + frens)
    const allUserIds = [req.user.id, ...frenIds]
    
    const { data: users } = await supabase
      .from('users')
      .select('id, name')
      .in('id', allUserIds)

    // Get availability for next 14 days
    const { data: availability } = await supabase
      .from('availability')
      .select('user_id, date, status')
      .in('user_id', allUserIds)
      .gte('date', new Date().toISOString().split('T')[0])
      .lte('date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    const frens = users || []
    const availData = availability || []

    // Call Claude
    const suggestion = await suggestBestTime(frens, availData)
    res.json(suggestion)
  } catch (err) {
    console.error('[AI SUGGEST]', err)
    res.status(500).json({ error: 'AI Scheduling Error', details: err.message })
  }
})

/**
 * Generate a nudge message for a specific hangout
 */
router.post('/nudge/:hangoutId', authMiddleware, async (req, res) => {
  try {
    // 1. Get hangout and RSVP stats
    const { data: hangout } = await supabase
      .from('hangouts')
      .select('*')
      .eq('id', req.params.id)
      .single()

    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('response')
      .eq('hangout_id', req.params.id)

    const stats = {
      going: rsvps.filter(r => r.response === 'going').length,
      interested: rsvps.filter(r => r.response === 'interested').length
    }

    // 2. Call Claude
    const nudge = await generateNudge(hangout, stats)
    
    res.json({ nudge })
  } catch (err) {
    res.status(500).json({ error: 'AI Nudge Error', details: err.message })
  }
})

export default router
