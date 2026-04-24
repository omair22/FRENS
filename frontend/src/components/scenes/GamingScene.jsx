import { useEffect, useRef, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import gsap from 'gsap'
import { buildFullAvatar } from '../../lib/buildFullAvatar'

// ── Avatar layout positions ─────────────────────────────────────
const getPositions = (count, sceneWidth, sceneHeight) => {
  const groundY = sceneHeight - 20
  const sofaY = sceneHeight - 45
  
  const positions = []
  
  // First 3 avatars sit on the couch
  const sofaXMap = [0.38, 0.62, 0.5] // Left, Right, Middle (z-index handled by order)
  
  for (let i = 0; i < count; i++) {
    if (i < 3) {
      // Seated on sofa
      positions.push({ 
        x: sceneWidth * sofaXMap[i], 
        y: sofaY, 
        pose: 'seated',
        zIndex: i === 2 ? 10 : 5 // Middle one in front of others if needed
      })
    } else {
      // Standing in the corner (right side)
      const offset = (i - 3) * 15
      positions.push({ 
        x: sceneWidth * 0.85 - offset, 
        y: groundY, 
        pose: 'standing',
        scale: 0.9,
        zIndex: 2
      })
    }
  }
  
  return positions
}

const GamingScene = ({ rsvps = [], width = 400, height = 200 }) => {
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
    
    // If no RSVPs, show a placeholder for the user
    const displayRsvps = rsvps.length > 0 ? rsvps : [{ user: { name: 'You' } }]

    for (let i = 0; i < displayRsvps.length; i++) {
      const rsvp = displayRsvps[i]
      const pos = positions[i] || positions[0]
      
      try {
        const avatar = await buildFullAvatar(rsvp.user || {}, 'gaming')
        avatar.x = pos.x
        avatar.y = pos.y
        avatar.scale.set(pos.scale || 1)
        
        // Add subtle breathing animation
        gsap.to(avatar.scale, {
          y: (pos.scale || 1) * 1.02,
          duration: 1.5 + Math.random(),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        })

        app.stage.addChild(avatar)
        spritesRef.current.push(avatar)
      } catch (err) {
        console.error('[GamingScene] Failed to build avatar:', err)
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
    <div className="gaming-scene" style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      {/* ── Background (Simple Gaming Room) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        zIndex: 0
      }} />

      {/* ── Neon Couch ── */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '60%',
        height: 60,
        background: 'linear-gradient(180deg, #4834d4 0%, #30336b 100%)',
        borderRadius: '20px 20px 10px 10px',
        border: '2px solid #686de0',
        boxShadow: '0 0 15px rgba(104, 109, 224, 0.4)',
        zIndex: 1
      }}>
        {/* Armrests */}
        <div style={{ position: 'absolute', left: -10, bottom: 0, width: 20, height: 40, background: '#30336b', borderRadius: 8, border: '1px solid #686de0' }} />
        <div style={{ position: 'absolute', right: -10, bottom: 0, width: 20, height: 40, background: '#30336b', borderRadius: 8, border: '1px solid #686de0' }} />
      </div>

      {/* ── PIXI Canvas Container ── */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 2 }} />
    </div>
  )
}

export default GamingScene
