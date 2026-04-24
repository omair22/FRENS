import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'

// ── Avatar layout positions ─────────────────────────────────────
const getPositions = (count, sceneWidth, sceneHeight) => {
  const groundY = sceneHeight - 20
  const sofaY = sceneHeight - 40
  
  const positions = []
  
  // First 3 avatars sit on the Central Perk sofa
  // Sofa is roughly centered and wide
  const sofaXMap = [0.4, 0.6, 0.5]
  
  for (let i = 0; i < count; i++) {
    if (i < 3) {
      // Seated on sofa
      positions.push({ 
        x: sceneWidth * sofaXMap[i], 
        y: sofaY, 
        pose: 'seated',
        zIndex: i === 2 ? 10 : 5
      })
    } else {
      // Standing in the corner
      const offset = (i - 3) * 20
      positions.push({ 
        x: sceneWidth * 0.15 + offset, 
        y: groundY, 
        pose: 'standing',
        scale: 0.9,
        zIndex: 2
      })
    }
  }
  
  return positions
}

const CafeScene = ({ rsvps = [], width = 400, height = 200 }) => {
  const containerRef = useRef(null)
  const appRef = useRef(null)
  const spritesRef = useRef([])

  const init = useCallback(async () => {
    if (!containerRef.current) return
    
    // Create App
    const app = new PIXI.Application()
    await app.init({ 
      width, 
      height, 
      backgroundAlpha: 0,
      antialias: true,
      hello: false
    })
    
    appRef.current = app
    containerRef.current.appendChild(app.canvas)

    // Load avatars
    const positions = getPositions(rsvps.length || 1, width, height)
    const displayRsvps = rsvps.length > 0 ? rsvps : [{ user: { name: 'You' } }]

    for (let i = 0; i < displayRsvps.length; i++) {
      const rsvp = displayRsvps[i]
      const pos = positions[i] || positions[0]
      
      try {
        const avatar = await buildFullAvatar(rsvp.user || {}, 'coffee')
        avatar.x = pos.x
        avatar.y = pos.y
        avatar.scale.set(pos.scale || 1)
        
        // ── Rotation Animation (Drinking Coffee) ──
        // The user wants it to rotate to imitate drinking coffee
        gsap.to(avatar, {
          rotation: 0.05, // subtle tilt
          duration: 2 + Math.random(),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })

        app.stage.addChild(avatar)
        spritesRef.current.push(avatar)
      } catch (err) {
        console.error('[CafeScene] Failed to build avatar:', err)
      }
    }
  }, [rsvps, width, height])

  useEffect(() => {
    init()
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: false })
        appRef.current = null
      }
      spritesRef.current = []
    }
  }, [init])

  return (
    <div className="cafe-scene" style={{ width, height, position: 'relative', overflow: 'hidden', background: '#2c1e1e' }}>
      {/* ── Background (Removed as requested) ── */}
      
      {/* ── Central Perk Sofa Image ── */}
      <img 
        src="/scenes/cafe/sofa.webp" 
        alt="Cafe Sofa"
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '75%',
          height: 'auto',
          zIndex: 1,
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
        }}
      />

      {/* ── PIXI Canvas Container ── */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
    </div>
  )
}

export default CafeScene
