import { useEffect, useRef, useMemo, useState } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'
import { buildAvatarUrlForPixi } from '../../lib/avatar'
import { generateAccessoryDataURI } from '../../lib/generateAccessory'

// ── Avatar layout positions ─────────────────────────────────────
const LEG_OFFSET = -20

const getPositions = (count, sceneWidth, sceneHeight) => {
  const standingY = sceneHeight - 12
  const pos = []

  let floorXMap = [0.50]
  if (count === 2) floorXMap = [0.35, 0.65]
  if (count === 3) floorXMap = [0.25, 0.50, 0.75]
  if (count === 4) floorXMap = [0.20, 0.40, 0.60, 0.80]
  if (count >= 5) floorXMap = [0.15, 0.32, 0.50, 0.68, 0.85]

  for (let i = 0; i < count; i++) {
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
    // Reduced rotation as requested (0.01 instead of 0.02)
    gsap.to(sprite, { rotation: 0.01, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
    gsap.to(sprite, { y: baseY + 2, duration: 2.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })

    // ── Shopping Bag Swing Animation ──
    const armGroup = sprite.getChildByName('armGroup')
    if (armGroup) {
      const bag = armGroup.getChildByName('accessory')
      if (bag) {
        // Subtle bag swinging
        gsap.to(bag, { 
          rotation: 0.1, 
          duration: 1.5, 
          ease: 'sine.inOut', 
          yoyo: true, 
          repeat: -1, 
          delay: offset 
        })
        
        // Occasional "look at purchase" lift
        const swingTL = gsap.timeline({ repeat: -1, delay: 4 + (index * 2) })
        swingTL
          .to(armGroup, { rotation: 0.4, duration: 1.2, ease: 'power2.inOut' }) 
          .to(armGroup, { duration: 1.5 }) 
          .to(armGroup, { rotation: 0, duration: 1, ease: 'power2.inOut' }) 
          .to({}, { duration: 10 + (index * 3) })
      }
    }
  } else if (rsvp.response === 'interested') {
    gsap.to(sprite, { y: baseY + 2, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
  }
}

const ShoppingScene = ({ rsvps = [], width = 400, height = 200 }) => {
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

      // Load Shopping Bag Texture
      const bagDataUri = generateAccessoryDataURI('shopping_bag')
      const bagTexture = await PIXI.Assets.load(bagDataUri).catch(() => null)

      await Promise.all(
        displayRsvps.map(async (rsvp, i) => {
          const pos = positions[i] || positions[positions.length - 1]

          const container = await buildFullAvatar(
            rsvp.user || { name: 'user' },
            'shopping',
            pos.pose || 'standing'
          )
          container.x = pos.x
          container.y = pos.y

          const baseScale = 0.65
          container.scale.set(baseScale * (pos.scale || 1))

          // ── Add Shopping Bag Accessory ──
          if (rsvp.response === 'in' && bagTexture) {
            const armGroup = container.getChildByName('armGroup')
            if (armGroup) {
              const bag = new PIXI.Sprite(bagTexture)
              bag.anchor.set(0.5, 0.2) // Pivot at the top handle
              bag.x = 22
              bag.y = 55
              bag.name = 'accessory'
              bag.scale.set(1.5)
              armGroup.addChild(bag)
            }
          }

          // ── Name Label ──
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
          nameText.y = -20 
          nameText.scale.set(1 / container.scale.x * 0.45)
          container.addChild(nameText)

          // ── Crown ──
          if (rsvp.isCreator || rsvp.isHost) {
            const crown = new PIXI.Graphics()
            const color = rsvp.isCreator ? 0xFFD700 : 0xC0C0C0
            crown.beginFill(color)
            crown.lineStyle(1.5, 0x000000, 1)
            crown.moveTo(-10, 0).lineTo(-12, -10).lineTo(-6, -6).lineTo(0, -12).lineTo(6, -6).lineTo(12, -10).lineTo(10, 0).closePath().endFill()
            crown.y = -45 
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
        if (entries[0].isIntersecting && !appRef.current) {
          requestAnimationFrame(() => {
            if (!appRef.current && canvasContainerRef.current) init()
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

const [selectedFrenId, setSelectedFrenId] = useState(null)

  return (
    <div style={{ width: '100%' }}>
      <div ref={wrapperRef} style={{ 
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        borderRadius: overflowRsvps.length > 0 ? '12px 12px 0 0' : '12px',
        backgroundImage: 'url(/scenes/shopping/bg.webp)',
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

export default ShoppingScene
