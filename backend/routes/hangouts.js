import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import multer from 'multer'

const router = express.Router()
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

/**
 * Get hangouts for my friend group
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('fren_id')
      .eq('user_id', req.user.id)

    const frenIds = friendships.map(f => f.fren_id)
    frenIds.push(req.user.id)

    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        created_by_user:users!created_by(*),
        rsvps(*, user:users(*)),
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

/**
 * Create hangout
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hangouts')
      .insert({ 
        ...req.body, 
        created_by: req.user.id,
        status: 'planning'
      })
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Get hangout detail
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        created_by_user:users!created_by(*),
        rsvps(*, user:users(*)),
        vibe_options(*, vibe_votes(*, user:users(*)))
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Upsert RSVP
 */
router.post('/:id/rsvp', authMiddleware, async (req, res) => {
  try {
    const { response } = req.body
    if (!response) return res.status(400).json({ error: 'response required' })

    const { data, error } = await supabase
      .from('rsvps')
      .upsert(
        {
          hangout_id: req.params.id,
          user_id: req.user.id,
          response
        },
        { onConflict: 'hangout_id,user_id' }
      )
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, rsvp: data })
  } catch (err) {
    console.error('[RSVP]', err)
    res.status(500).json({ error: err.message })
  }
})

/**
 * Add Vibe Option
 */
router.post('/:id/vibe-options', authMiddleware, async (req, res) => {
  const { label } = req.body
  try {
    const { data, error } = await supabase
      .from('vibe_options')
      .insert({ 
        hangout_id: req.params.id, 
        label, 
        created_by: req.user.id 
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
 * Vote on Vibe
 */
router.post('/:id/vibe-votes', authMiddleware, async (req, res) => {
  const { option_id } = req.body
  try {
    const { data, error } = await supabase
      .from('vibe_votes')
      .upsert({ 
        option_id, 
        user_id: req.user.id 
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
 * Photos
 */
router.post('/:id/photos', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo provided' })

    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${req.params.id}/${req.user.id}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('photos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from('photos')
      .getPublicUrl(fileName)

    // Save to photos table
    const { data: photo, error: dbError } = await supabase
      .from('photos')
      .insert({
        hangout_id: req.params.id,
        uploaded_by: req.user.id,
        url: urlData.publicUrl
      })
      .select()
      .single()

    if (dbError) throw dbError
    res.json({ success: true, photo })
  } catch (err) {
    console.error('[PHOTO UPLOAD]', err)
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/photos', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('*, user:users(*)')
      .eq('hangout_id', req.params.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
