import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

/**
 * Signup with Email/Password
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Login with Email/Password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Complete Onboarding (Profile setup)
 */
const saveProfile = async (req, res) => {
  const { name, avatar_style } = req.body
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ 
        id: req.user.id, 
        name, 
        avatar_style: avatar_style || 'adventurer',
        email: req.user.email,
      })
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Both /onboarding and /profile point to the same handler
router.post('/onboarding', authMiddleware, saveProfile)
router.post('/profile', authMiddleware, saveProfile)

/**
 * Get My Profile
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle()  // Returns null instead of 406 when no row found

    if (error) throw error
    // data is null for brand-new users who haven't completed onboarding
    res.json(data || { id: req.user.id, name: null, emoji: null, status: null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
