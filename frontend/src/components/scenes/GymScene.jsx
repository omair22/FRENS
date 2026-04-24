import { useEffect, useRef, useMemo, useState } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'
import { buildAvatarUrlForPixi } from '../../lib/avatar'

// ── Avatar layout positions ─────────────────────────────────────
const LEG_OFFSET = -20

// ── Dumbbell Configuration (Tweak these for size/gap) ────────────
const DUMBBELL_SCALE = 1.5      // Scale multiplier
const DUMBBELL_X = 22             // Side-to-side position in hand
const DUMBBELL_Y = 55          // Vertical position in hand
const DUMBBELL_COLOR = 0x222222   // Dark grey

const getPositions = (count, sceneWidth, sceneHeight) => {
  const groundY = sceneHeight + LEG_OFFSET
  const standingY = sceneHeight - 12

  const pos = []

  // Spread up to 5 people across the floor
  let floorXMap = [0.50]
  if (count === 2) floorXMap = [0.35, 0.65]
  if (count === 3) floorXMap = [0.25, 0.50, 0.75]
  if (count === 4) floorXMap = [0.20, 0.40, 0.60, 0.80]
  if (count >= 5) floorXMap = [0.15, 0.32, 0.50, 0.68, 0.85]

  for (let i = 0; i < count; i++) {
    // ALWAYS standing for gym
    pos.push({ x: sceneWidth * floorXMap[i], y: standingY, pose: 'standing' })
  }
  return pos
}

// ── GSAP Idle Animations ─────────────────────────────────────────
export const startIdleAnimation = (data) => {
  const { sprite, rsvp, baseY, index } = data
  const offset = index * 0.2

  gsap.killTweensOf(sprite)

  if (rsvp.response === 'in') {
    // Subtle breathing/sway (Match Cafe to stop wobbling)
    gsap.to(sprite, { rotation: 0.02, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
    gsap.to(sprite, { y: baseY + 2, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })

    // ── Dumbbell Curl Animation (Match Coffee Rotation) ──
    const armGroup = sprite.getChildByName('armGroup')
    if (armGroup) {
      const dumbbell = armGroup.getChildByName('accessory')
      if (dumbbell) {
        const drinkTL = gsap.timeline({ repeat: -1, delay: 5 + (index * 3) })
        drinkTL
          .to(armGroup, { rotation: 1.2, duration: 1.5, ease: 'power2.inOut' }) // Lift
          .to(dumbbell, { rotation: -0.8, duration: 1.5, ease: 'power2.inOut' }, 0) // Counter-rotate dumbbell
          .to(armGroup, { duration: 1.5 }) // Hold
          .to(armGroup, { rotation: 0, duration: 1.2, ease: 'power2.inOut' }) // Back down
          .to(dumbbell, { rotation: 0, duration: 1.2, ease: 'power2.inOut' }, "<") // Reset dumbbell rotation
          .to({}, { duration: 12 + (index * 4) }) // Long wait
      } else {
        // Fallback simple arm swing if accessory failed to load
        gsap.to(armGroup, { rotation: 0.5, duration: 1.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
      }
    }
  } else if (rsvp.response === 'interested') {
    gsap.to(sprite, { y: baseY + 2, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
  }
}

const GymScene = ({ rsvps = [], width = 400, height = 200 }) => {
  const canvasContainerRef = useRef(null)
  const appRef = useRef(null)
  const spritesRef = useRef([])
  const wrapperRef = useRef(null)
  const [loading, setLoading] = useState(true)

  const rsvpsKey = useMemo(() => {
    return (rsvps || []).map(r => `${r.user?.id || r.user_id || 'u'}:${r.response}`).join(',')
  }, [rsvps])

  const normalizedRsvps = useMemo(() => {
    return (rsvps || []).map(r => ({
      ...r,
      response: (r.response === 'going' || r.response === 'in' || !r.response) ? 'in' :
        (r.response === 'maybe' || r.response === 'interested') ? 'interested' : 'skip'
    }))
  }, [rsvps])

  const allSortedRsvps = useMemo(() => {
    const going = normalizedRsvps.filter(r => r.response === 'in')
    const maybe = normalizedRsvps.filter(r => r.response === 'interested')
    const combined = [...going, ...maybe]

    return combined.sort((a, b) => {
      const aScore = (a.isCreator ? 2 : a.isHost ? 1 : 0)
      const bScore = (b.isCreator ? 2 : b.isHost ? 1 : 0)
      return bScore - aScore
    })
  }, [normalizedRsvps])

  const displayRsvps = useMemo(() => {
    const creator = allSortedRsvps.find(r => r.isCreator)
    const others = allSortedRsvps.filter(r => !r.isCreator)

    const result = []
    if (creator) {
      if (allSortedRsvps.length === 1) {
        result.push(creator)
      } else if (allSortedRsvps.length === 2) {
        result.push(others[0], creator)
      } else {
        result.push(others[0], creator, ...others.slice(1, 4))
      }
    } else {
      result.push(...allSortedRsvps.slice(0, 5))
    }
    return result.slice(0, 5)
  }, [allSortedRsvps])

  const overflowRsvps = useMemo(() => {
    return allSortedRsvps.slice(5)
  }, [allSortedRsvps])

  const positions = useMemo(() => {
    return getPositions(displayRsvps.length, width, height)
  }, [displayRsvps.length, width, height])

  useEffect(() => {
    if (!canvasContainerRef.current || !wrapperRef.current) return

    const cleanupPixi = () => {
      if (appRef.current?.ticker) appRef.current.ticker.stop()
      if (spritesRef.current.length > 0) {
        spritesRef.current.forEach(({ sprite }) => gsap.killTweensOf(sprite))
      }
      if (appRef.current?.stage) {
        appRef.current.stage.removeChildren()
      }
      if (appRef.current) {
        appRef.current.destroy({
          removeView: true,
          children: false,
          texture: false,
          textureSource: false,
        })
        appRef.current = null
      }
    }

    const init = async () => {
      if (appRef.current) cleanupPixi()

      const app = new PIXI.Application()
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      if (!canvasContainerRef.current) {
        app.destroy(true, { children: true, texture: true, baseTexture: true })
        return
      }

      canvasContainerRef.current.innerHTML = ''
      canvasContainerRef.current.appendChild(app.canvas)
      appRef.current = app

      const spriteData = []

      await Promise.all(
        displayRsvps.map(async (rsvp, i) => {
          const pos = positions[i] || positions[positions.length - 1]

          const container = await buildFullAvatar(
            rsvp.user || { name: 'user' },
            'gym',
            pos.pose || 'standing'
          )
          container.x = pos.x
          container.y = pos.y

          // Match the scale from other scenes, but slightly larger (0.65) because they are standing
          const baseScale = 0.65
          container.scale.set(baseScale * (pos.scale || 1))

          // ── Add Procedural Dumbbell (Vector) ──
          if (rsvp.response === 'in') {
            const armGroup = container.getChildByName('armGroup')
            if (armGroup) {
              const dumbbell = new PIXI.Graphics()

              // Draw the dumbbell
              dumbbell.beginFill(DUMBBELL_COLOR)
              // Bar (scaled)
              dumbbell.drawRect(-12 * DUMBBELL_SCALE, -2 * DUMBBELL_SCALE, 24 * DUMBBELL_SCALE, 4 * DUMBBELL_SCALE)
              // Weights (scaled)
              dumbbell.drawRoundedRect(-18 * DUMBBELL_SCALE, -10 * DUMBBELL_SCALE, 8 * DUMBBELL_SCALE, 20 * DUMBBELL_SCALE, 3)
              dumbbell.drawRoundedRect(10 * DUMBBELL_SCALE, -10 * DUMBBELL_SCALE, 8 * DUMBBELL_SCALE, 20 * DUMBBELL_SCALE, 3)
              dumbbell.endFill()

              // Position in the hand
              dumbbell.x = DUMBBELL_X
              dumbbell.y = DUMBBELL_Y
              dumbbell.name = 'accessory'

              armGroup.addChild(dumbbell)
            }
          }

          // ── Name Label (Same as Cafe) ──
          const nameText = new PIXI.Text({
            text: rsvp.user?.name || 'Fren',
            style: {
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 20,
              fill: '#ffffff',
              fontWeight: '700',
              stroke: { color: '#000000', width: 4, join: 'round' },
              align: 'center'
            }
          })
          nameText.anchor.set(0.5, 1)
          nameText.y = -20 // Ultra tight to head
          nameText.scale.set(1 / container.scale.x * 0.45)
          container.addChild(nameText)

          // ── Crown (Vector, Same as Cafe) ──
          if (rsvp.isCreator || rsvp.isHost) {
            const crown = new PIXI.Graphics()
            const color = rsvp.isCreator ? 0xFFD700 : 0xC0C0C0
            crown.beginFill(color)
            crown.lineStyle(1.5, 0x000000, 1)
            // Simple crown shape
            crown.moveTo(-10, 0)
            crown.lineTo(-12, -10)
            crown.lineTo(-6, -6)
            crown.lineTo(0, -12)
            crown.lineTo(6, -6)
            crown.lineTo(12, -10)
            crown.lineTo(10, 0)
            crown.closePath()
            crown.endFill()

            crown.y = -45 // Position above the name label
            container.addChild(crown)
          }

          app.stage.addChild(container)

          const data = { sprite: container, rsvp, baseX: pos.x, baseY: pos.y, index: i }
          spriteData.push(data)
          spritesRef.current.push(data)
        })
      )

      spriteData.forEach((data) => {
        data.sprite.x = data.baseX
        data.sprite.y = data.baseY
        startIdleAnimation(data)
      })

      setLoading(false)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0].isIntersecting
        if (isVisible && !appRef.current) {
          requestAnimationFrame(() => {
            if (!appRef.current && canvasContainerRef.current) {
              init()
            }
          })
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(wrapperRef.current)

    return () => {
      observer.disconnect()
      cleanupPixi()
    }
  }, [rsvpsKey, width, height])

  return (
    <div style={{ width: '100%' }}>
      <div ref={wrapperRef} style={{ 
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: overflowRsvps.length > 0 ? '12px 12px 0 0' : '12px',
        backgroundImage: 'url(/scenes/gym/bg.avif)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        {loading && <div className="skeleton" style={{ position: 'absolute', inset: 0, zIndex: 10, borderRadius: '12px 12px 0 0' }} />}
        <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 6, opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }} />
      </div>

      {overflowRsvps.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px', background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)', borderTop: 'none',
          borderRadius: '0 0 12px 12px', overflowX: 'auto', scrollbarWidth: 'none'
        }}>
          {overflowRsvps.slice(0, 5).map((rsvp) => {
            const frenId = rsvp.user?.id || rsvp.user_id
            const isSelected = selectedFrenId === frenId
            const avatarUrl = buildAvatarUrlForPixi(rsvp.user?.name || 'fren', rsvp.user?.avatar_config || {})
            
            return (
              <button
                key={frenId}
                onClick={() => setSelectedFrenId(isSelected ? null : frenId)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: isSelected ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
                  background: '#222', padding: 0, overflow: 'hidden', cursor: 'pointer',
                  flexShrink: 0, transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <img 
                  src={avatarUrl} 
                  alt={rsvp.user?.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </button>
            )
          })}
          {overflowRsvps.length > 5 && (
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#333', border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#999', fontSize: '12px', fontWeight: '700', flexShrink: 0
            }}>
              +{overflowRsvps.length - 5}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GymScene
