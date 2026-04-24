import { useEffect, useRef, useMemo, useState } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'
import { buildAvatarUrlForPixi } from '../../lib/avatar'
import { generateAccessoryDataURI } from '../../lib/generateAccessory'

// ── Avatar layout positions ─────────────────────────────────────
const LEG_OFFSET = -20

const getPositions = (count, sceneWidth, sceneHeight) => {
  const yOffset = -sceneHeight * 0.10
  const seatY = sceneHeight - 5 + yOffset
  const standY = sceneHeight - 5 + yOffset
  const pos = []

  if (count === 1) {
    pos.push({ x: sceneWidth * 0.50, y: seatY, pose: 'seated' })
  } else if (count === 2) {
    pos.push({ x: sceneWidth * 0.32, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.58, y: seatY, pose: 'seated' })
  } else if (count === 3) {
    pos.push({ x: sceneWidth * 0.32, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.47, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.62, y: seatY, pose: 'seated' })
  } else if (count === 4) {
    pos.push({ x: sceneWidth * 0.10, y: standY, pose: 'standing' })
    pos.push({ x: sceneWidth * 0.35, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.50, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.65, y: seatY, pose: 'seated' })
  } else if (count >= 5) {
    pos.push({ x: sceneWidth * 0.10, y: standY, pose: 'standing' })
    pos.push({ x: sceneWidth * 0.32, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.47, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.62, y: seatY, pose: 'seated' })
    pos.push({ x: sceneWidth * 0.80, y: standY, pose: 'standing' })
  }

  return pos
}

export const startIdleAnimation = (data) => {
  const { sprite, rsvp, baseY, index } = data
  const offset = index * 0.2

  gsap.killTweensOf(sprite)

  if (rsvp.response === 'in') {
    gsap.to(sprite, { rotation: 0.02, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
    gsap.to(sprite, { y: baseY + 2, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })

    const armGroup = sprite.getChildByName('armGroup')
    if (armGroup) {
      const coffee = armGroup.getChildByName('accessory')
      if (coffee) {
        const drinkTL = gsap.timeline({ repeat: -1, delay: 5 + (index * 3) })
        drinkTL
          .to(armGroup, { rotation: 1.05, duration: 1.5, ease: 'power2.inOut' })
          .to(coffee, { rotation: -0.4, duration: 1.5, ease: 'power2.inOut' }, 0)
          .to(armGroup, { duration: 2 })
          .to(armGroup, { rotation: 0, duration: 1.2, ease: 'power2.inOut' })
          .to(coffee, { rotation: 0, duration: 1.2, ease: 'power2.inOut' }, "<")
          .to({}, { duration: 15 + (index * 5) })
      }
    }
  } else if (rsvp.response === 'interested') {
    gsap.to(sprite, { y: baseY + 2, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
  }
}

const CafeScene = ({ rsvps = [], width = 400, height = 200 }) => {
  const canvasContainerRef = useRef(null)
  const appRef = useRef(null)
  const spritesRef = useRef([])
  const wrapperRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [selectedFrenId, setSelectedFrenId] = useState(null)

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
    return combined.sort((a, b) => (b.isCreator ? 2 : b.isHost ? 1 : 0) - (a.isCreator ? 2 : a.isHost ? 1 : 0))
  }, [normalizedRsvps])

  const { displayRsvps, overflowRsvps } = useMemo(() => {
    const creator = allSortedRsvps.find(r => r.isCreator)
    const others = allSortedRsvps.filter(r => !r.isCreator)
    
    let display = []
    let overflow = []

    if (!creator) {
      display = allSortedRsvps.slice(0, 5)
      overflow = allSortedRsvps.slice(5)
    } else {
      const topOthers = others.slice(0, 4)
      overflow = others.slice(4)

      // Place creator in center
      const count = topOthers.length + 1
      if (count === 1) display = [creator]
      else if (count === 2) display = [topOthers[0], creator]
      else if (count === 3) display = [topOthers[0], creator, topOthers[1]]
      else if (count === 4) display = [topOthers[0], topOthers[1], creator, topOthers[2]]
      else if (count === 5) display = [topOthers[0], topOthers[1], creator, topOthers[2], topOthers[3]]
    }

    return { displayRsvps: display, overflowRsvps: overflow }
  }, [allSortedRsvps])

  const positions = useMemo(() => getPositions(displayRsvps.length, width, height), [displayRsvps.length, width, height])

  useEffect(() => {
    if (!canvasContainerRef.current || !wrapperRef.current) return

    const cleanupPixi = () => {
      if (appRef.current?.stage) appRef.current.stage.removeChildren()
      if (appRef.current) {
        appRef.current.destroy({ removeView: true, children: true })
        appRef.current = null
      }
    }

    const init = async () => {
      if (appRef.current) cleanupPixi()
      const app = new PIXI.Application()
      await app.init({ width, height, backgroundAlpha: 0, resolution: window.devicePixelRatio || 1, autoDensity: true })
      
      canvasContainerRef.current.innerHTML = ''
      canvasContainerRef.current.appendChild(app.canvas)
      appRef.current = app


      const spriteData = []
      await Promise.all(displayRsvps.map(async (rsvp, i) => {
        const pos = positions[i]
        const container = await buildFullAvatar(rsvp.user || { name: 'user' }, 'cafe', pos.pose)
        container.x = pos.x
        container.y = pos.y
        container.pose = pos.pose
        container.scale.set(pos.pose === 'standing' ? 0.52 : 0.55)



        const nameText = new PIXI.Text({
          text: rsvp.user?.name || 'Fren',
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: 20, fill: '#ffffff', fontWeight: '700', stroke: { color: '#000000', width: 4, join: 'round' }, align: 'center' }
        })
        nameText.anchor.set(0.5, 1)
        nameText.y = -20
        nameText.scale.set(1 / container.scale.x * 0.45)
        container.addChild(nameText)

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
      }))

      spriteData.forEach(data => startIdleAnimation(data))
      setLoading(false)
    }

    init()
    return cleanupPixi
  }, [rsvpsKey, width, height])

  return (
    <div style={{ width: '100%' }}>
      <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height, background: '#1a1a1a', borderRadius: overflowRsvps.length > 0 ? '12px 12px 0 0' : '12px', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/scenes/cafe/bg.webp)',
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
        }} />
        <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 6, opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }} />
        {loading && <div className="skeleton" style={{ position: 'absolute', inset: 0, zIndex: 10 }} />}
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

export default CafeScene
