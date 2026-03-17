import express from 'express'
import { supabase } from '../lib/supabase.js'
import { createCanvas } from 'canvas'

const router = express.Router()

// OG meta tags page — crawlers land here
router.get('/hangout/:id', async (req, res) => {
  const { id } = req.params
  console.log(`[OG] Request for hangout: ${id}`)
  
  const { data: hangout, error } = await supabase
    .from('hangouts')
    .select('title, emoji, datetime, location, creator:users!created_by(name)')
    .eq('id', id)
    .single()

  const frontendUrl = process.env.FRONTEND_URL || 'https://frens-navy.vercel.app'
  const backendUrl = process.env.BACKEND_URL || req.protocol + '://' + req.get('host')

  if (!hangout) {
    return res.redirect(`${frontendUrl}/h/${id}`)
  }

  const date = hangout.datetime
    ? new Date(hangout.datetime).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit'
      })
    : 'Time TBD'

  const title = `${hangout.emoji || '🎉'} ${hangout.title}`
  const description = `${date}${hangout.location 
    ? ' · ' + hangout.location : ''} · Hosted by ${hangout.creator?.name}`
  const imageUrl = `${backendUrl}/api/og/image/${id}`
  const pageUrl = `${frontendUrl}/h/${id}`

  res.setHeader('Content-Type', 'text/html')
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:url" content="${pageUrl}" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta http-equiv="refresh" content="0;url=${pageUrl}" />
  </head>
  <body>
    <p>Redirecting to hangout...</p>
    <script>window.location.href = "${pageUrl}"</script>
  </body>
</html>`)
})

// OG image generation
router.get('/image/:id', async (req, res) => {
  const { id } = req.params

  const { data: hangout } = await supabase
    .from('hangouts')
    .select('title, emoji, datetime, location, creator:users!created_by(name)')
    .eq('id', id)
    .single()

  try {
    const canvas = createCanvas(1200, 630)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 1200, 630)

    // Card
    ctx.fillStyle = '#111111'
    roundRect(ctx, 48, 48, 1104, 534, 32)
    ctx.fill()

    // Card border
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'
    ctx.lineWidth = 1
    roundRect(ctx, 48, 48, 1104, 534, 32)
    ctx.stroke()

    // Emoji
    ctx.font = '96px serif'
    ctx.fillText(hangout?.emoji || '🎉', 96, 240)

    // Title
    ctx.fillStyle = '#f5f5f5'
    ctx.font = 'bold 64px sans-serif'
    ctx.fillText(
      truncate(hangout?.title || 'Hangout', 22), 
      96, 340
    )

    // Date
    ctx.fillStyle = '#666666'
    ctx.font = '36px sans-serif'
    const date = hangout?.datetime
      ? new Date(hangout.datetime).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit'
        })
      : 'Time TBD'
    ctx.fillText(date, 96, 400)

    // Location
    if (hangout?.location) {
      ctx.fillStyle = '#3a3a3a'
      ctx.font = '32px sans-serif'
      ctx.fillText('📍 ' + truncate(hangout.location, 40), 96, 450)
    }

    // Host
    ctx.fillStyle = '#3a3a3a'
    ctx.font = '28px sans-serif'
    ctx.fillText(
      'Hosted by ' + (hangout?.creator?.name || 'someone'), 
      96, 520
    )

    // Frens branding bottom right
    ctx.fillStyle = '#ff4d4d'
    ctx.font = 'bold 32px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('frens', 1104, 520)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    canvas.createPNGStream().pipe(res)
  } catch (err) {
    console.error('OG image error:', err)
    res.status(500).send('Image generation failed')
  }
})

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '...' : str
}

export default router
