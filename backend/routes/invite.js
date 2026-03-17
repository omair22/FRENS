import express from 'express'
import { supabase } from '../lib/supabase.js'
import crypto from 'crypto'

const router = express.Router()

// GET public hangout data — no auth required
router.get('/:hangoutId/public', async (req, res) => {
  const { hangoutId } = req.params

  const { data: hangout, error } = await supabase
    .from('hangouts')
    .select(`
      id, title, emoji, datetime, end_datetime,
      location, notes, status, is_public,
      creator:users!created_by(id, name, avatar_config),
      rsvps(
        response, 
        user:users(id, name, avatar_config)
      ),
      hangout_time_proposals(
        id, proposed_datetime, label,
        votes:hangout_time_votes(interest, user_id)
      ),
      hangout_ideas(
        id, title, emoji, description,
        votes:hangout_idea_votes(vote, user_id)
      )
    `)
    .eq('id', hangoutId)
    .single()

  if (error || !hangout) {
    return res.status(404).json({ error: 'Hangout not found' })
  }

  // Also get guests
  const { data: guests } = await supabase
    .from('hangout_guests')
    .select('id, name, response, created_at')
    .eq('hangout_id', hangoutId)

  res.json({ hangout, guests: guests || [] })
})

// POST guest RSVP — no auth required
router.post('/:hangoutId/rsvp', async (req, res) => {
  const { hangoutId } = req.params
  const { name, response, token } = req.body

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Name required' })
  }

  const validResponses = ['going', 'maybe', 'out']
  if (!validResponses.includes(response)) {
    return res.status(400).json({ error: 'Invalid response' })
  }

  // If token provided, update existing
  if (token) {
    const { data, error } = await supabase
      .from('hangout_guests')
      .update({ response })
      .eq('token', token)
      .eq('hangout_id', hangoutId)
      .select()
      .single()

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ guest: data, token })
  }

  // New guest RSVP
  const newToken = crypto.randomBytes(32).toString('hex')

  const { data, error } = await supabase
    .from('hangout_guests')
    .insert({
      hangout_id: hangoutId,
      name: name.trim(),
      response,
      token: newToken
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ guest: data, token: newToken })
})

// POST guest time vote
router.post('/:hangoutId/time-vote', async (req, res) => {
  const { hangoutId } = req.params
  const { proposalId, interest, token } = req.body

  if (!token) return res.status(401).json({ error: 'Token required' })

  // Verify token belongs to this hangout
  const { data: guest } = await supabase
    .from('hangout_guests')
    .select('id')
    .eq('token', token)
    .eq('hangout_id', hangoutId)
    .single()

  if (!guest) return res.status(401).json({ error: 'Invalid token' })

  const { data, error } = await supabase
    .from('hangout_time_votes')
    .upsert({
      proposal_id: proposalId,
      user_id: guest.id,
      interest: Math.min(100, Math.max(0, interest))
    }, { onConflict: 'proposal_id,user_id' })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ vote: data })
})

// POST guest idea vote
router.post('/:hangoutId/idea-vote', async (req, res) => {
  const { hangoutId } = req.params
  const { ideaId, vote, token } = req.body

  if (!token) return res.status(401).json({ error: 'Token required' })

  const { data: guest } = await supabase
    .from('hangout_guests')
    .select('id')
    .eq('token', token)
    .eq('hangout_id', hangoutId)
    .single()

  if (!guest) return res.status(401).json({ error: 'Invalid token' })

  const { data, error } = await supabase
    .from('hangout_idea_votes')
    .upsert({
      idea_id: ideaId,
      user_id: guest.id,
      vote
    }, { onConflict: 'idea_id,user_id' })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ vote: data })
})

// POST guest idea suggestion
router.post('/:hangoutId/suggest-idea', async (req, res) => {
  const { hangoutId } = req.params
  const { title, emoji, token } = req.body

  if (!token) return res.status(401).json({ error: 'Token required' })
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' })

  const { data: guest } = await supabase
    .from('hangout_guests')
    .select('id')
    .eq('token', token)
    .eq('hangout_id', hangoutId)
    .single()

  if (!guest) return res.status(401).json({ error: 'Invalid token' })

  const { data, error } = await supabase
    .from('hangout_ideas')
    .insert({
      hangout_id: hangoutId,
      created_by: guest.id,
      title: title.trim(),
      emoji: emoji || '💡'
    })
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ idea: data })
})

// PATCH link guest RSVPs to real account after signup
router.patch('/link-guest-rsvps', async (req, res) => {
  const { userId, tokens } = req.body
  if (!userId || !tokens?.length) return res.json({ linked: 0 })

  const { data, error } = await supabase
    .from('hangout_guests')
    .update({ user_id: userId })
    .in('token', tokens)
    .select()

  if (error) return res.status(400).json({ error: error.message })
  res.json({ linked: data?.length || 0 })
})

export default router
