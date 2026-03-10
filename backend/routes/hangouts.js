import express from 'express'
import { supabase } from '../lib/supabase.js'
import { authMiddleware } from '../middleware/auth.js'
import { notify } from '../lib/notify.js'
import { archivePassedHangouts } from '../lib/archiveHangouts.js'
import multer from 'multer'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

/** Helper: check if user is creator or host */
const isCreatorOrHost = async (hangoutId, userId) => {
  const { data: hangout } = await supabase.from('hangouts').select('created_by, title').eq('id', hangoutId).single()
  if (!hangout) return { allowed: false, hangout: null }
  if (hangout.created_by === userId) return { allowed: true, hangout, isCreator: true }
  const { data: hostRow } = await supabase.from('hangout_hosts').select('id').eq('hangout_id', hangoutId).eq('user_id', userId).single()
  return { allowed: !!hostRow, hangout, isCreator: false }
}

/** GET / — feed */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Auto-archive before fetching — keeps list fresh
    await archivePassedHangouts()

    const { data: friendships } = await supabase.from('friendships').select('fren_id').eq('user_id', req.user.id).eq('status', 'accepted')
    const frenIds = (friendships || []).map(f => f.fren_id)
    frenIds.push(req.user.id)

    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        creator:users!created_by(id, name, avatar_style, avatar_config),
        rsvps(response, user_id, user:users(id, name, avatar_style, avatar_config, status)),
        vibe_options(*, vibe_votes(*)),
        stops_count:hangout_stops(count)
      `)
      .in('created_by', frenIds)
      .order('datetime', { ascending: true, nullsFirst: false })

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST / — create hangout */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, emoji, location, datetime, end_datetime, notes, is_public = false, invited_frens = [] } = req.body
    const invitedFrenIds = invited_frens // Map the prop from frontend
    const { data, error } = await supabase
      .from('hangouts')
      .insert({ title, emoji, location, datetime, end_datetime, notes, is_public, created_by: req.user.id, status: 'planning' })
      .select()
      .single()
    if (error) throw error

    // Auto-RSVP creator as 'in'
    await supabase.from('rsvps').insert({ hangout_id: data.id, user_id: req.user.id, response: 'in' }).select()

    // Invite frens: create RSVPs + notify
    if (invitedFrenIds.length > 0) {
      const rsvpRows = invitedFrenIds.map(uid => ({ hangout_id: data.id, user_id: uid, response: 'invited' }))
      await supabase.from('rsvps').upsert(rsvpRows, { onConflict: 'hangout_id,user_id' })

      const isPinned = location && !datetime

      if (isPinned) {
        const { data: pinner } = await supabase.from('users').select('name').eq('id', req.user.id).single()
        await notify(invitedFrenIds, {
          type: 'hangout_invite',
          title: `${pinner?.name || 'A fren'} pinned you`,
          body: `Meet at ${location}?`,
          data: { hangoutId: data.id, isPinned: true },
        })
      } else {
        const { data: creator } = await supabase.from('users').select('name').eq('id', req.user.id).single()
        await notify(invitedFrenIds, {
          type: 'hangout_invite',
          title: '📅 New hangout!',
          body: `${creator?.name || 'A fren'} invited you to ${title}`,
          data: { hangoutId: data.id },
        })
      }
    }

    res.status(201).json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** GET /:id — full hangout detail */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Archive any stale hangouts silently
    await archivePassedHangouts()

    const { data, error } = await supabase
      .from('hangouts')
      .select(`
        *,
        creator:users!created_by(id, name, avatar_style, avatar_config),
        rsvps(user_id, response, full_hangout, arriving_at, leaving_at, out_reason, user:users(id, name, avatar_style, avatar_config, status)),
        vibe_options(*, vibe_votes(*, user:users(*)))
      `)
      .eq('id', req.params.id)
      .single()

    if (error) throw error

    // Hosts — separate query so missing table doesn't break the page
    let hosts = []
    try {
      const { data: hostsData, error } = await supabase
        .from('hangout_hosts')
        .select('user_id, user:users!hangout_hosts_user_id_fkey(id, name, avatar_style, avatar_config)')
        .eq('hangout_id', req.params.id)

      if (error) console.error('[HOSTS FETCH ERROR]', error)
      hosts = hostsData || []
    } catch (_) { }

    // Ideas — same pattern
    let ideas = []
    try {
      const { data: ideasData } = await supabase
        .from('hangout_ideas')
        .select('*, creator:users(id, name, avatar_style, avatar_config), votes:hangout_idea_votes(user_id, vote)')
        .eq('hangout_id', req.params.id)
        .order('created_at', { ascending: true })
      ideas = ideasData || []
    } catch (_) { }

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

    // Notify all RSVPs about cancellation
    const { data: allRsvps } = await supabase.from('rsvps').select('user_id').eq('hangout_id', req.params.id)
    const rsvpIds = (allRsvps || []).filter(r => r.user_id !== req.user.id).map(r => r.user_id)
    if (rsvpIds.length > 0) {
      await notify(rsvpIds, {
        type: 'hangout_cancelled',
        title: '❌ Hangout cancelled',
        body: `A hangout has been cancelled`,
        data: {},
      })
    }

    // Delete related records manually to bypass missing ON DELETE CASCADE
    await supabase.from('rsvps').delete().eq('hangout_id', req.params.id)
    await supabase.from('hangout_hosts').delete().eq('hangout_id', req.params.id)
    await supabase.from('hangout_stops').delete().eq('hangout_id', req.params.id)
    await supabase.from('hangout_ideas').delete().eq('hangout_id', req.params.id)

    // Finally delete hangout
    const { error: delError } = await supabase.from('hangouts').delete().eq('id', req.params.id)
    if (delError) throw delError

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
    const {
      response,
      full_hangout,
      arriving_at,
      leaving_at,
      out_reason
    } = req.body

    if (!response || !['in', 'interested', 'skip'].includes(response)) {
      return res.status(400).json({ error: 'response must be in, interested, or skip' })
    }

    const rsvpData = {
      hangout_id: req.params.id,
      user_id: req.user.id,
      response,
      full_hangout: response === 'in' ? (full_hangout !== false) : null,
      arriving_at: response === 'in' && arriving_at ? arriving_at : null,
      leaving_at: response === 'in' && leaving_at ? leaving_at : null,
      out_reason: response === 'skip' && out_reason ? out_reason.trim() : null,
    }

    const { data: rsvp, error: rsvpErr } = await supabase
      .from('rsvps')
      .upsert(rsvpData, { onConflict: 'hangout_id,user_id' })
      .select().single()

    if (rsvpErr) throw rsvpErr

    // Notify hangout creator
    const { data: hangout } = await supabase.from('hangouts').select('created_by, title').eq('id', req.params.id).single()
    if (hangout && hangout.created_by !== req.user.id) {
      const { data: rsvpUser } = await supabase.from('users').select('name').eq('id', req.user.id).single()
      const emoji = { in: '✅', interested: '👀', skip: '❌' }
      const label = { in: 'going', interested: 'interested', skip: 'not going' }
      await notify(hangout.created_by, {
        type: 'rsvp_update',
        title: `${emoji[response] || '✅'} RSVP update`,
        body: `${rsvpUser?.name || 'Someone'} is ${label[response] || response} to ${hangout.title}`,
        data: { hangoutId: req.params.id, userId: req.user.id, response },
      })
    }

    res.json({ success: true, rsvp })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/invites — invite more frens */
router.post('/:id/invites', authMiddleware, async (req, res) => {
  try {
    const { userIds } = req.body
    const { allowed, hangout } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!hangout) return res.status(404).json({ error: 'Not found' })
    if (!allowed) return res.status(403).json({ error: 'Only creator or host can invite' })

    if (userIds && userIds.length > 0) {
      const rsvpRows = userIds.map(uid => ({ hangout_id: req.params.id, user_id: uid, response: 'invited' }))
      await supabase.from('rsvps').upsert(rsvpRows, { onConflict: 'hangout_id,user_id' })

      const { data: inviter } = await supabase.from('users').select('name').eq('id', req.user.id).single()
      await notify(userIds, {
        type: 'hangout_invite',
        title: '📅 New invite!',
        body: `${inviter?.name || 'A fren'} invited you to ${hangout.title}`,
        data: { hangoutId: req.params.id },
      })
    }
    res.json({ success: true })
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

    const { data: existing } = await supabase.from('hangout_hosts').select('id').eq('hangout_id', req.params.id).eq('user_id', userId).maybeSingle()
    if (existing) return res.json({ success: true, message: 'Already a host' })

    const { error } = await supabase.from('hangout_hosts').insert({ hangout_id: req.params.id, user_id: userId, added_by: req.user.id })
    if (error) throw error

    // Notify the new co-host
    await notify(userId, {
      type: 'co_host_added',
      title: '👑 You\'re a co-host!',
      body: `You've been made a co-host`,
      data: { hangoutId: req.params.id },
    })

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

/** ===================== ITINERARY STOPS ===================== */

/** GET /:id/stops */
router.get('/:id/stops', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hangout_stops')
      .select('*, creator:users(id, name)')
      .eq('hangout_id', req.params.id)
      .order('order_index', { ascending: true })
    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/stops */
router.post('/:id/stops', authMiddleware, async (req, res) => {
  try {
    const { title, emoji, location, address, notes, start_time, end_time } = req.body
    if (!title) return res.status(400).json({ error: 'title required' })

    const { allowed } = await isCreatorOrHost(req.params.id, req.user.id)
    if (!allowed) return res.status(403).json({ error: 'Only creator or host can add stops' })

    // Auto-increment order_index
    const { data: existing } = await supabase
      .from('hangout_stops')
      .select('order_index')
      .eq('hangout_id', req.params.id)
      .order('order_index', { ascending: false })
      .limit(1)
    const nextIndex = existing?.[0] ? existing[0].order_index + 1 : 0

    const { data, error } = await supabase
      .from('hangout_stops')
      .insert({
        hangout_id: req.params.id,
        created_by: req.user.id,
        title,
        emoji: emoji || '📍',
        location: location || null,
        address: address || null,
        notes: notes || null,
        start_time: start_time || null,
        end_time: end_time || null,
        order_index: nextIndex,
      })
      .select()
      .single()
    if (error) throw error
    res.json({ success: true, stop: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /:id/stops/:stopId */
router.patch('/:id/stops/:stopId', authMiddleware, async (req, res) => {
  try {
    const allowed_keys = ['title', 'emoji', 'location', 'address', 'notes', 'start_time', 'end_time', 'order_index']
    const updates = {}
    allowed_keys.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const { error } = await supabase
      .from('hangout_stops')
      .update(updates)
      .eq('id', req.params.stopId)
      .eq('hangout_id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /:id/stops/:stopId */
router.delete('/:id/stops/:stopId', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase
      .from('hangout_stops')
      .delete()
      .eq('id', req.params.stopId)
      .eq('hangout_id', req.params.id)
    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** PATCH /:id — host edits basic details (title, datetime, etc.) */
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { data: hangout } = await supabase
      .from('hangouts')
      .select('created_by, title')
      .eq('id', req.params.id)
      .single()

    if (!hangout) return res.status(404).json({ error: 'Not found' })

    const { data: isHost } = await supabase
      .from('hangout_hosts')
      .select('id')
      .eq('hangout_id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle()

    if (hangout.created_by !== req.user.id && !isHost) {
      return res.status(403).json({ error: 'Only creator or host can edit' })
    }

    // Allow updating: title, datetime, end_datetime, location, notes, emoji
    const allowed = ['title', 'datetime', 'end_datetime', 'location', 'notes', 'emoji']
    const updates = {}
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

    const { data, error } = await supabase
      .from('hangouts')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error

    // Notify all 'in' RSVPs about the change
    const { data: goingRsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('hangout_id', req.params.id)
      .eq('response', 'in')
      .neq('user_id', req.user.id)

    const goingIds = (goingRsvps || []).map(r => r.user_id)
    if (goingIds.length > 0) {
      await notify(goingIds, {
        type: 'hangout_updated',
        title: '✏️ Hangout updated',
        body: `Details changed for ${data.title}`,
        data: { hangoutId: req.params.id }
      })
    }

    res.json({ success: true, hangout: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** ===================== TIME PROPOSALS ===================== */

/** GET /:id/time-proposals */
router.get('/:id/time-proposals', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hangout_time_proposals')
      .select(`
        *,
        proposer:users!hangout_time_proposals_created_by_fkey(id, name, emoji, avatar_config),
        votes:hangout_time_votes(id, user_id, interest, 
          voter:users!hangout_time_votes_user_id_fkey(id, name, emoji, avatar_config))
      `)
      .eq('hangout_id', req.params.id)
      .order('created_at', { ascending: true })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/time-proposals */
router.post('/:id/time-proposals', authMiddleware, async (req, res) => {
  try {
    const { proposed_datetime, label } = req.body
    if (!proposed_datetime) {
      return res.status(400).json({ error: 'proposed_datetime required' })
    }

    const { data, error } = await supabase
      .from('hangout_time_proposals')
      .insert({
        hangout_id: req.params.id,
        created_by: req.user.id,
        proposed_datetime,
        label: label || null
      })
      .select()
      .single()

    if (error) throw error

    // Fetch proposer separately since insert nested select sometimes fails
    const { data: proposerData } = await supabase
      .from('users')
      .select('id, name, emoji, avatar_config')
      .eq('id', req.user.id)
      .single()

    const fullProposal = { ...data, proposer: proposerData }

    // Notify all hangout attendees about the new time proposal
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('hangout_id', req.params.id)
      .neq('user_id', req.user.id)

    const attendeeIds = (rsvps || []).map(r => r.user_id)
    if (attendeeIds.length > 0) {
      await notify(attendeeIds, {
        type: 'vibe_vote',
        title: '🗳️ New time proposed',
        body: `${proposerData?.name || 'A fren'} suggested a time — vote now!`,
        data: { hangoutId: req.params.id }
      })
    }

    res.json({ success: true, proposal: fullProposal })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/time-proposals/:proposalId/vote */
router.post('/:id/time-proposals/:proposalId/vote', authMiddleware, async (req, res) => {
  try {
    const { interest } = req.body
    if (interest === undefined || interest < 0 || interest > 100) {
      return res.status(400).json({ error: 'interest must be 0–100' })
    }

    const { data, error } = await supabase
      .from('hangout_time_votes')
      .upsert({
        proposal_id: req.params.proposalId,
        user_id: req.user.id,
        interest
      }, { onConflict: 'proposal_id,user_id' })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, vote: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** DELETE /:id/time-proposals/:proposalId */
router.delete('/:id/time-proposals/:proposalId', authMiddleware, async (req, res) => {
  try {
    const { allowed, hangout } = await isCreatorOrHost(req.params.id, req.user.id)

    // Check if user is proposer
    let isProposer = false
    try {
      const { data: prop } = await supabase.from('hangout_time_proposals').select('created_by').eq('id', req.params.proposalId).single()
      if (prop && prop.created_by === req.user.id) isProposer = true
    } catch (_) { }

    if (!allowed && !isProposer) {
      return res.status(403).json({ error: 'Only proposer or host can delete' })
    }

    const { error } = await supabase
      .from('hangout_time_proposals')
      .delete()
      .eq('id', req.params.proposalId)
      .eq('hangout_id', req.params.id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/accept-time — host accepts a winning time */
router.post('/:id/accept-time', authMiddleware, async (req, res) => {
  try {
    const { proposal_id } = req.body
    if (!proposal_id) return res.status(400).json({ error: 'proposal_id required' })

    const { data: hangout } = await supabase
      .from('hangouts').select('created_by, title').eq('id', req.params.id).single()

    if (!hangout) return res.status(404).json({ error: 'Hangout not found' })

    const { data: isHost } = await supabase
      .from('hangout_hosts').select('id')
      .eq('hangout_id', req.params.id).eq('user_id', req.user.id).maybeSingle()

    if (hangout.created_by !== req.user.id && !isHost) {
      return res.status(403).json({ error: 'Only host can accept a time' })
    }

    // Get the proposal
    const { data: proposal } = await supabase
      .from('hangout_time_proposals')
      .select('*')
      .eq('id', proposal_id)
      .single()

    if (!proposal) return res.status(404).json({ error: 'Proposal not found' })

    // Update hangout datetime with the accepted proposal
    const { data: updated, error: updErr } = await supabase
      .from('hangouts')
      .update({ datetime: proposal.proposed_datetime })
      .eq('id', req.params.id)
      .select()
      .single()

    if (updErr) throw updErr

    // Notify all attendees
    const { data: rsvps } = await supabase
      .from('rsvps').select('user_id')
      .eq('hangout_id', req.params.id).neq('user_id', req.user.id)

    const attendeeIds = (rsvps || []).map(r => r.user_id)
    if (attendeeIds.length > 0) {
      await notify(attendeeIds, {
        type: 'hangout_updated',
        title: '📅 Time locked in!',
        body: `The time for ${hangout.title} has been set`,
        data: { hangoutId: req.params.id }
      })
    }

    // Auto-interest users who voted positively on this time
    const { data: positiveVoters } = await supabase
      .from('hangout_time_votes')
      .select('user_id')
      .eq('proposal_id', proposal_id)
      .gte('interest', 50)

    const voterIds = (positiveVoters || []).map(v => v.user_id)

    if (voterIds.length > 0) {
      // Get existing RSVPs for this hangout
      const { data: existingRsvps } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('hangout_id', req.params.id)
        .in('user_id', voterIds)

      const alreadyRsvpd = new Set((existingRsvps || []).map(r => r.user_id))
      const newInterested = voterIds.filter(id => !alreadyRsvpd.has(id))

      if (newInterested.length > 0) {
        await supabase.from('rsvps').insert(
          newInterested.map(user_id => ({
            hangout_id: req.params.id,
            user_id,
            response: 'interested',
            full_hangout: null
          }))
        )

        // Notify them
        const { data: acceptedHangout } = await supabase
          .from('hangouts').select('title').eq('id', req.params.id).single()

        await notify(newInterested, {
          type: 'hangout_invite',
          title: '📅 Time confirmed!',
          body: `You've been marked as interested in ${acceptedHangout.title}`,
          data: { hangoutId: req.params.id }
        })
      }
    }

    // Optionally delete all time proposals if time is accepted
    // await supabase.from('hangout_time_proposals').delete().eq('hangout_id', req.params.id)

    res.json({ success: true, hangout: updated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/** POST /:id/accept-idea — host accepts winning idea */
router.post('/:id/accept-idea', authMiddleware, async (req, res) => {
  try {
    const { idea_id } = req.body
    if (!idea_id) return res.status(400).json({ error: 'idea_id required' })

    const { data: hangout } = await supabase
      .from('hangouts').select('created_by, title').eq('id', req.params.id).single()

    if (!hangout) return res.status(404).json({ error: 'Hangout not found' })

    const { data: isHost } = await supabase
      .from('hangout_hosts').select('id')
      .eq('hangout_id', req.params.id).eq('user_id', req.user.id).maybeSingle()

    if (hangout.created_by !== req.user.id && !isHost) {
      return res.status(403).json({ error: 'Only host can accept an idea' })
    }

    const { data: idea } = await supabase
      .from('hangout_ideas').select('*').eq('id', idea_id).single()
    if (!idea) return res.status(404).json({ error: 'Idea not found' })

    // Apply idea to hangout: update title, location, datetime if set
    const updates = {}
    if (idea.title) updates.title = idea.title
    if (idea.location) updates.location = idea.location
    if (idea.proposed_datetime) updates.datetime = idea.proposed_datetime
    if (idea.emoji) updates.emoji = idea.emoji

    if (Object.keys(updates).length > 0) {
      await supabase.from('hangouts').update(updates).eq('id', req.params.id)
    }

    // Notify attendees
    const { data: rsvps } = await supabase
      .from('rsvps').select('user_id')
      .eq('hangout_id', req.params.id).neq('user_id', req.user.id)

    const attendeeIds = (rsvps || []).map(r => r.user_id)
    if (attendeeIds.length > 0) {
      await notify(attendeeIds, {
        type: 'hangout_updated',
        title: '💡 Idea locked in!',
        body: `"${idea.title}" was chosen for ${hangout.title}`,
        data: { hangoutId: req.params.id }
      })
    }

    // Auto-interest users who voted positively on this idea
    const { data: ideaVotes } = await supabase
      .from('hangout_idea_votes')
      .select('user_id, vote')
      .eq('idea_id', idea_id)
      .in('vote', ['in', 'interested'])

    const ideaVoterIds = [...new Set((ideaVotes || []).map(v => v.user_id))]

    if (ideaVoterIds.length > 0) {
      const { data: existingRsvps } = await supabase
        .from('rsvps')
        .select('user_id')
        .eq('hangout_id', req.params.id)
        .in('user_id', ideaVoterIds)

      const alreadyRsvpd = new Set((existingRsvps || []).map(r => r.user_id))
      const newInterested = ideaVoterIds.filter(id => !alreadyRsvpd.has(id))

      if (newInterested.length > 0) {
        await supabase.from('rsvps').insert(
          newInterested.map(user_id => ({
            hangout_id: req.params.id,
            user_id,
            response: 'interested',
            full_hangout: null
          }))
        )

        await notify(newInterested, {
          type: 'hangout_invite',
          title: '💡 Plan confirmed!',
          body: `"${idea.title}" was chosen — you're marked as interested`,
          data: { hangoutId: req.params.id }
        })
      }
    }

    // Optionally delete accepted idea
    // await supabase.from('hangout_ideas').delete().eq('id', idea_id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
