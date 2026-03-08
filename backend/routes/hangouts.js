import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/** Helper: check if user is creator or host */
const isCreatorOrHost = async (hangoutId, userId) => {
  const { data: hangout } = await supabase.from('hangouts').select('created_by').eq('id', hangoutId).single()
  if (!hangout) return { allowed: false, hangout: null }
  if (hangout.created_by === userId) return { allowed: true, hangout, isCreator: true }
  const { data: hostRow } = await supabase.from('hangout_hosts').select('id').eq('hangout_id', hangoutId).eq('user_id', userId).single()
  return { allowed: !!hostRow, hangout, isCreator: false }
}

/** GET / — feed */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: friendships } = await supabase.from('friendships').select('fren_id').eq('user_id', req.user.id).eq('status', 'accepted')
    const frenIds = (friendships || []).map(f => f.fren_id)
    frenIds.push(req.user.id)

    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        creator:users!created_by(id, name, avatar_style),
        rsvps(response, user_id, user:users(id, name, avatar_style, status)),
        vibe_options(*, vibe_votes(*))
      `)
      .in('created_by', frenIds)
      .order('datetime', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST / — create hangout */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, emoji, location, datetime, notes, is_public = false } = req.body
    const { data, error } = await supabase
      .from('hangouts')
      .insert({ title, emoji, location, datetime, notes, is_public, created_by: req.user.id, status: 'planning' })
      .select()
      .single()
    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /:id — full hangout detail */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        creator:users!created_by(id, name, avatar_style),
        rsvps(response, user_id, user:users(id, name, avatar_style, status)),
        vibe_options(*, vibe_votes(*, user:users(*)))
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    // Hosts — separate query so missing table doesn't break the page
    let hosts = []
    try {
      const { data: hostsData } = await supabase
        .from('hangout_hosts')
        .select('user_id, user:users(id, name, avatar_style)')
        .eq('hangout_id', req.params.id)
      hosts = hostsData || []
    } catch (_) {}

    // Ideas — same pattern
    let ideas = []
    try {
      const { data: ideasData } = await supabase
        .from('hangout_ideas')
        .select('*, creator:users(id, name, avatar_style), votes:hangout_idea_votes(user_id, vote)')
        .eq('hangout_id', req.params.id)
        .order('created_at', { ascending: true })
      ideas = ideasData || []
    } catch (_) {}

    res.json({ ...data, hosts, ideas })
  } catch (err) {
    console.error('[HANGOUT GET]', err)
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /:id — creator or host only */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { allowed, hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Hangout not found' })
    if (!allowed) return res.status(403).json({ error: 'Only the creator or a host can delete this' })

    const { error } = await supabase.from('hangouts').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /:id/visibility — toggle public/private */
router.patch('/:id/visibility', authMiddleware, async (req, res) => {
  try {
    const { is_public } = req.body
    const { allowed, hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Not found' })
    if (!allowed) return res.status(403).json({ error: 'Not authorized' })

    const { error } = await supabase.from('hangouts').update({ is_public }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, is_public })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /:id/status — change status (planning/locked/happening) */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body
    if (!['planning', 'locked', 'happening'].includes(status)) return res.status(400).json({ error: 'Invalid status' })
    const { allowed, hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Not found' })
    if (!allowed) return res.status(403).json({ error: 'Not authorized' })

    const { error } = await supabase.from('hangouts').update({ status }).eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, status })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/rsvp */
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { response } = req.body
    if (!response) return res.status(400).json({ error: 'response required' })
    const { data, error } = await supabase
      .from('rsvps')
      .upsert({ hangout_id: req.params.id, user_id: req.user.id, response }, { onConflict: 'hangout_id,user_id' })
      .select().single()
    if (error) throw error
    res.json({ success: true, rsvp: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/hosts — add co-host (creator only) */
router.post('/:id/hosts', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body
    const { hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Not found' })
    if (hangout.created_by !== req.user.id) return res.status(403).json({ error: 'Only the creator can add hosts' })

    const { error } = await supabase.from('hangout_hosts').insert({ hangout_id: req.params.id, user_id: userId, added_by: req.user.id })
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /:id/hosts/:userId — remove co-host (creator only) */
router.delete('/:id/hosts/:userId', authMiddleware, async (req, res) => {
  try {
    const { hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Not found' })
    if (hangout.created_by !== req.user.id) return res.status(403).json({ error: 'Only the creator can remove hosts' })

    const { error } = await supabase.from('hangout_hosts').delete().eq('hangout_id', req.params.id).eq('user_id', req.params.userId)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/ideas — add an idea */
router.post('/:id/ideas', authMiddleware, async (req, res) => {
  try {
    const { title, emoji, description, location, proposed_datetime } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })

    const { data, error } = await supabase
      .from('hangout_ideas')
      .insert({ hangout_id: req.params.id, created_by: req.user.id, title, emoji, description, location, proposed_datetime })
      .select().single()
    if (error) throw error
    res.json({ success: true, idea: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/ideas/:ideaId/vote */
router.post('/:id/ideas/:ideaId/vote', authMiddleware, async (req, res) => {
  try {
    const { vote } = req.body
    if (!['in', 'interested', 'out'].includes(vote)) return res.status(400).json({ error: 'vote must be in, interested, or out' })

    const { data, error } = await supabase
      .from('hangout_idea_votes')
      .upsert({ idea_id: req.params.ideaId, user_id: req.user.id, vote }, { onConflict: 'idea_id,user_id' })
      .select().single()
    if (error) throw error
    res.json({ success: true, vote: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/vibe-options */
router.post('/:id/vibe-options', authMiddleware, async (req, res) => {
  const { label } = req.body
  try {
    const { data, error } = await supabase.from('vibe_options').insert({ hangout_id: req.params.id, label, created_by: req.user.id }).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/vibe-votes */
router.post('/:id/vibe-votes', authMiddleware, async (req, res) => {
  const { option_id } = req.body
  try {
    const { data, error } = await supabase.from('vibe_votes').upsert({ option_id, user_id: req.user.id }).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** Photo upload */
router.post('/:id/photos', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo provided' })
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${req.params.id}/${req.user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, req.file.buffer, { contentType: req.file.mimetype, upsert: false })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)
    const { data: photo, error: dbError } = await supabase.from('photos').insert({ hangout_id: req.params.id, uploaded_by: req.user.id, url: urlData.publicUrl }).select().single()
    if (dbError) throw dbError
    res.json({ success: true, photo })
  } catch (err) {
    console.error('[PHOTO UPLOAD]', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/photos', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('photos').select('*, user:users(*)').eq('hangout_id', req.params.id).order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
