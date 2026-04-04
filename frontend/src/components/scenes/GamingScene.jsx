import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildAvatarUrlForPixi } from '../../lib/avatar'

// ── Texture cache — persists across re-renders ──────────────────
const textureCache = new Map()

const loadTexture = async (url) => {
  if (textureCache.has(url)) return textureCache.get(url)
  try {
    const texture = await PIXI.Assets.load(url)
    textureCache.set(url, texture)
    return texture
  } catch (err) {
    console.warn('[GamingScene] Failed to load avatar texture:', url, err)
    return null
  }
}

// ── Avatar layout positions ─────────────────────────────────────
// Returns array of {x, y, scale} for n avatars within scene width
const getPositions = (count, sceneWidth, sceneHeight) => {
  const avatarSize = 72
  const deskY = sceneHeight - 55 // avatars sit at desk level
  
  if (count === 1) {
    return [{ x: sceneWidth / 2, y: deskY }]
  }
  
  if (count === 2) {
    return [
      { x: sceneWidth * 0.35, y: deskY },
      { x: sceneWidth * 0.65, y: deskY },
    ]
  }
  
  if (count === 3) {
    return [
      { x: sceneWidth * 0.25, y: deskY },
      { x: sceneWidth * 0.50, y: deskY - 4 }, // middle slightly forward
      { x: sceneWidth * 0.75, y: deskY },
    ]
  }
  
  if (count === 4) {
    return [
      { x: sceneWidth * 0.2,  y: deskY },
      { x: sceneWidth * 0.4,  y: deskY },
      { x: sceneWidth * 0.6,  y: deskY },
      { x: sceneWidth * 0.8,  y: deskY },
    ]
  }
  
  // 5+ — back row + front row
  return [
    { x: sceneWidth * 0.15, y: deskY - 20, scale: 0.8 },
    { x: sceneWidth * 0.35, y: deskY - 20, scale: 0.8 },
    { x: sceneWidth * 0.55, y: deskY - 20, scale: 0.8 },
    { x: sceneWidth * 0.3,  y: deskY },
    { x: sceneWidth * 0.7,  y: deskY },
  ]
}

// ── Per-frame animation functions ───────────────────────────────
// These run inside the Pixi ticker. t = elapsed time in seconds.

const animateIn = (sprite, t, baseX, baseY, index) => {
  const offset = index * 0.7 // phase offset so avatars aren't in sync
  sprite.rotation = Math.sin((t + offset) * 2.5) * 0.06
  sprite.y = baseY + Math.sin((t + offset) * 1.8) * 2.5
}

const animateMaybe = (sprite, t, baseX, baseY, index) => {
  sprite.alpha = 0.55 + Math.sin(t * 1.5) * 0.08
  sprite.rotation = Math.sin(t * 1.2) * 0.03
  sprite.y = baseY + Math.sin(t * 1) * 1.5
}

const animateOut = (sprite, t, baseX, baseY) => {
  sprite.alpha = 0.2
  sprite.rotation = Math.sin(t * 2) * 0.02
}

const animatePending = (sprite, t) => {
  sprite.alpha = 0.15 + Math.sin(t * 2.2) * 0.08
}

// ── Reaction particle ───────────────────────────────────────────
const spawnParticle = (app, x, y) => {
  const texts = ['GG', '!', 'LFG', '🎯', 'ez']
  const text = texts[Math.floor(Math.random() * texts.length)]
  
  const label = new PIXI.Text({
    text,
    style: new PIXI.TextStyle({
      fontFamily: 'DM Sans',
      fontSize: 11,
      fontWeight: '700',
      fill: '#ffffff',
    })
  })
  
  label.x = x + (Math.random() - 0.5) * 30
  label.y = y - 20
  label.alpha = 0.9
  app.stage.addChild(label)
  
  gsap.to(label, {
    y: label.y - 40,
    alpha: 0,
    duration: 1.2,
    ease: 'power1.out',
    onComplete: () => app.stage.removeChild(label)
  })
}

// ── Main component ──────────────────────────────────────────────
const GamingScene = ({ rsvps = [], width = 400, height = 200 }) => {
  const canvasRef = useRef(null)
  const appRef = useRef(null)
  const spritesRef = useRef([])

  useEffect(() => {
    if (!canvasRef.current) return

    const init = async () => {
      // ── Init Pixi ──
      const app = new PIXI.Application()
      await app.init({
        canvas: canvasRef.current,
        width,
        height,
        backgroundAlpha: 0, // transparent — SVG layers sit behind
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      })
      appRef.current = app

      // ── Sort RSVPs ──
      const going    = rsvps.filter(r => r.response === 'in').slice(0, 5)
      const maybe    = rsvps.filter(r => r.response === 'interested').slice(0, 2)
      const out      = rsvps.filter(r => r.response === 'skip').slice(0, 1)
      const pending  = rsvps.filter(r => !r.response).slice(0, 1)
      
      const allRsvps = [...going, ...maybe, ...out, ...pending]
      const positions = getPositions(allRsvps.length, width, height)

      // ── Load textures + create sprites ──
      const spriteData = []
      
      await Promise.all(
        allRsvps.map(async (rsvp, i) => {
          const url = buildAvatarUrlForPixi(
            rsvp.user?.name || 'user',
            rsvp.user?.avatar_config || {}
          )
          
          const texture = await loadTexture(url)
          if (!texture) return

          const sprite = new PIXI.Sprite(texture)
          const pos = positions[i] || positions[positions.length - 1]
          const avatarScale = pos.scale || 1
          const avatarSize = 72 * avatarScale

          sprite.width = avatarSize
          sprite.height = avatarSize
          sprite.anchor.set(0.5, 1) // anchor at bottom center — sits on desk
          sprite.x = pos.x
          sprite.y = pos.y

          // Initial state setup
          if (rsvp.response === 'interested') {
            sprite.scale.set(0.8 * avatarScale)
            sprite.x = pos.x - 15
            sprite.alpha = 0.55
          } else if (rsvp.response === 'skip') {
            sprite.scale.set(0.65 * avatarScale)
            sprite.x = pos.x + 25
            sprite.alpha = 0.2
            sprite.tint = 0x888888
          } else if (!rsvp.response) {
            sprite.alpha = 0.15
            sprite.tint = 0x666666
          }

          // Entrance animation — drop in from above
          const finalY = sprite.y
          sprite.y = finalY - 60
          sprite.alpha = rsvp.response === 'in' ? 0 : sprite.alpha * 0.3

          gsap.to(sprite, {
            y: finalY,
            alpha: rsvp.response === 'in' ? 1 : sprite.alpha,
            duration: 0.6,
            delay: i * 0.12,
            ease: 'back.out(1.4)',
          })

          app.stage.addChild(sprite)
          spriteData.push({
            sprite,
            rsvp,
            baseX: sprite.x,
            baseY: finalY,
            index: i,
          })
        })
      )

      spritesRef.current = spriteData

      // ── Reaction particle scheduler ──
      // If 3+ people going, randomly spawn particles
      if (going.length >= 3) {
        const scheduleParticle = () => {
          const randomSprite = spriteData
            .filter(s => s.rsvp.response === 'in')
          
          if (randomSprite.length > 0 && appRef.current) {
            const target = randomSprite[Math.floor(Math.random() * randomSprite.length)]
            spawnParticle(app, target.sprite.x, target.sprite.y - 80)
          }
          
          // Schedule next particle
          const nextDelay = 3000 + Math.random() * 5000
          if (appRef.current) {
            setTimeout(scheduleParticle, nextDelay)
          }
        }
        setTimeout(scheduleParticle, 2000)
      }

      // ── Main ticker ──
      let t = 0
      app.ticker.add((ticker) => {
        t += ticker.deltaTime / 60

        spritesRef.current.forEach(({ sprite, rsvp, baseX, baseY, index }) => {
          switch (rsvp.response) {
            case 'in':
              animateIn(sprite, t, baseX, baseY, index)
              break
            case 'interested':
              animateMaybe(sprite, t, baseX, baseY, index)
              break
            case 'skip':
              animateOut(sprite, t, baseX, baseY)
              break
            default:
              animatePending(sprite, t)
          }
        })
      })
    }

    init()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(false) // false = don't destroy canvas DOM element
        appRef.current = null
      }
      spritesRef.current = []
    }
  }, [rsvps, width, height])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: '12px 12px 0 0',
        overflow: 'hidden',
        background: '#0a0a12',
      }}
    >
      {/* ── Layer 0: Screen glow — behind everything ── */}
      <div style={{
        position: 'absolute',
        top: -20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 280,
        height: 160,
        background: 'radial-gradient(ellipse at center, rgba(77,150,255,0.18) 0%, transparent 70%)',
        animation: 'screenGlow 3s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* ── Layer 1: Monitor SVG ── */}
      <div style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 140,
        zIndex: 1,
        pointerEvents: 'none',
      }}>
        <img src="/scenes/gaming/monitor.svg" alt="" style={{ width: '100%' }} />
      </div>

      {/* ── Layer 2: Desk SVG — sits at bottom ── */}
      <div style={{
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        <img src="/scenes/gaming/desk.svg" alt="" style={{ width: '100%' }} />
      </div>

      {/* ── Layer 3: Pixi canvas — avatars ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 3,
        }}
      />

      {/* ── Layer 4: Scanline overlay ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        zIndex: 4,
        pointerEvents: 'none',
      }} />

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes screenGlow {
          0%, 100% { opacity: 0.8; transform: translateX(-50%) scale(1); }
          50% { opacity: 1.0; transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </div>
  )
}

export default GamingScene
