import { useEffect, useRef, useMemo, useState } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'
import { buildAvatarUrlForPixi } from '../../lib/avatar'

// ── Avatar layout positions ─────────────────────────────────────
const LEG_OFFSET = -20

const getPositions = (count, sceneWidth, sceneHeight) => {
  const groundY = sceneHeight + LEG_OFFSET
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

export const startIdleAnimation = (data) => {
  const { sprite, rsvp, baseY, index } = data
  const offset = index * 0.2
  gsap.killTweensOf(sprite)

  if (rsvp.response === 'in') {
    gsap.to(sprite, { rotation: 0.02, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
    gsap.to(sprite, { y: baseY + 2, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
  } else if (rsvp.response === 'interested') {
    gsap.to(sprite, { y: baseY + 2, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: offset })
  }
}

const GenericScene = ({ bgUrl, rsvps = [], width = 400, height = 200 }) => {
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

  const displayRsvps = useMemo(() => allSortedRsvps.slice(0, 5), [allSortedRsvps])
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
        const container = await buildFullAvatar(rsvp.user || { name: 'user' }, 'default', 'standing')
        container.x = pos.x
        container.y = pos.y
        container.scale.set(0.65)

        // Name Label
        const nameText = new PIXI.Text({
          text: rsvp.user?.name || 'Fren',
          style: { fontFamily: 'DM Sans, sans-serif', fontSize: 20, fill: '#ffffff', fontWeight: '700', stroke: { color: '#000000', width: 4, join: 'round' }, align: 'center' }
        })
        nameText.anchor.set(0.5, 1)
        nameText.y = -20
        nameText.scale.set(1 / container.scale.x * 0.45)
        container.addChild(nameText)

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
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height, background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: bgUrl ? `url(${bgUrl})` : 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
        backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.6)'
      }} />
      <div ref={canvasContainerRef} style={{ position: 'absolute', inset: 0, zIndex: 6, opacity: loading ? 0 : 1, transition: 'opacity 0.3s ease' }} />
      {loading && <div className="skeleton" style={{ position: 'absolute', inset: 0, zIndex: 10 }} />}
    </div>
  )
}

export default GenericScene
