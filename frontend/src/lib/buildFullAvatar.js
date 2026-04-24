import * as PIXI from 'pixi.js'
import { buildAvatarUrlForPixi } from './avatar'
import { generateBodySVGDataURI, getAccessoryForScene, generateRightArmDataURI } from './generateBody'
import { generateAccessoryDataURI } from './generateAccessory'

// ── Cache head and body textures independently ───────────────────
const headCache = new Map()
const bodyCache = new Map()

// ── Head texture loader ──────────────────────────────────────────
// Uses raw Image → Canvas → PIXI.Texture
// Zero dependency on PIXI.Assets.resolver (which doesn't exist in v8)
const loadHeadTexture = (name, avatarConfig) => {
  const url = buildAvatarUrlForPixi(name, avatarConfig)

  // Return cached texture immediately if available
  if (headCache.has(url)) {
    return Promise.resolve(headCache.get(url))
  }

  return new Promise((resolve) => {
    const img = new Image()

    // Must set crossOrigin before src — DiceBear PNG supports CORS
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 128, 128)

        // PIXI.Texture.from(canvas) works in all Pixi versions
        const texture = PIXI.Texture.from(canvas)
        headCache.set(url, texture)
        resolve(texture)
      } catch (err) {
        console.warn('[buildFullAvatar] Canvas draw failed:', err)
        resolve(null)
      }
    }

    img.onerror = (err) => {
      console.warn('[buildFullAvatar] Image fetch failed for:', url, err)
      resolve(null)
    }

    // Set src last — triggers the load
    img.src = url
  })
}

/**
 * Generates and loads an SVG body texture using a canvas-based approach
 * that works with Pixi v8 without requiring external parser registration.
 */
const loadBodyTexture = (avatarConfig, sceneType, pose = 'seated') => {
  const accessory = getAccessoryForScene(sceneType)
  const hideLegs = false // Always show legs now as requested
  const hideAccessory = sceneType === 'cafe' || sceneType === 'gym' || sceneType === 'shopping'
  const hideRightArm = sceneType === 'cafe' || sceneType === 'gym' || sceneType === 'shopping'
  const cacheKey = `body_${JSON.stringify(avatarConfig)}_${accessory}_${hideLegs}_${pose}_${hideAccessory}_${hideRightArm}`

  // Return cached texture immediately if available
  if (bodyCache.has(cacheKey)) {
    return Promise.resolve(bodyCache.get(cacheKey))
  }

  return new Promise((resolve) => {
    try {
      const svgDataUri = generateBodySVGDataURI(avatarConfig, {
        width: 120,
        height: 155,
        accessory,
        hideLegs,
        pose,
        hideAccessory,
        hideRightArm
      })

      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = 120
          canvas.height = 155
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, 120, 155)
          const texture = PIXI.Texture.from(canvas)
          bodyCache.set(cacheKey, texture)
          resolve(texture)
        } catch (err) {
          console.warn('[buildFullAvatar] Body canvas draw failed:', err)
          resolve(null)
        }
      }
      img.onerror = (err) => {
        console.warn('[buildFullAvatar] Body SVG load failed:', err)
        resolve(null)
      }
      img.src = svgDataUri
    } catch (err) {
      console.warn('[buildFullAvatar] Body load failed:', err)
      resolve(null)
    }
  })
}

/**
 * Robust SVG texture loader that renders to canvas first
 */
const loadSVGTexture = (svgDataUri, width, height) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      resolve(PIXI.Texture.from(canvas))
    }
    img.onerror = () => resolve(null)
    img.src = svgDataUri
  })
}

/**
 * Builds a PIXI.Container with two sprites composited vertically:
 *   [Head on top]  — DiceBear PNG (76x76)
 *   [Body below]   — Generated SVG (110x118), overlaps head bottom by ~18px
 *
 * The container's pivot is set to bottom-center so it can be positioned
 * on the couch baseline directly (container.x = seatX, container.y = seatY).
 *
 * @param {Object} user - { name, avatar_config }
 * @param {string} sceneType - 'gaming' | 'coffee' | 'food' | 'movie' | etc.
 * @returns {PIXI.Container}
 */
export const buildFullAvatar = async (user, sceneType, pose = 'seated') => {
  const { name = 'user', avatar_config = {} } = user

  const [headTexture, bodyTexture] = await Promise.all([
    loadHeadTexture(name, avatar_config),
    loadBodyTexture({ ...avatar_config, seedName: name }, sceneType, pose),
  ])

  console.log('[buildFullAvatar] headTexture:', headTexture ? 'loaded ✓' : 'FAILED ✗')
  console.log('[buildFullAvatar] bodyTexture:', bodyTexture ? 'loaded ✓' : 'FAILED ✗')

  const container = new PIXI.Container()

  // ── Body FIRST — renders behind the head ──
  if (bodyTexture) {
    const body = new PIXI.Sprite(bodyTexture)
    body.width = 110
    body.height = 142 // Adjusted for longer torso (was 132)
    body.anchor.set(0.5, 0)
    body.x = 0
    body.y = 30 // Pushed up to close the neck gap
    container.addChild(body) // FIRST = behind
  }

  // ── Head SECOND — renders in front of body ──
  if (headTexture) {
    const head = new PIXI.Sprite(headTexture)
    head.width = 76
    head.height = 76
    head.anchor.set(0.5, 1) // bottom-center anchor
    head.x = 0
    head.y = 66 // Tucked down slightly
    container.addChild(head) // SECOND = in front
  }

  // ── Accessory Arm Assembly (Cafe & Gym) ──
  if (sceneType === 'cafe' || sceneType === 'gym') {
    const armGroup = new PIXI.Container()
    armGroup.name = 'armGroup'
    
    // Position at the shoulder area of the new body
    armGroup.x = -15
    armGroup.y = 85
    const armTexture = await loadSVGTexture(generateRightArmDataURI({ ...avatar_config, seedName: name }), 120, 155)
    if (armTexture) {
      const arm = new PIXI.Sprite(armTexture)
      arm.width = 120
      arm.height = 155
      arm.anchor.set(88 / 120, 24 / 155) // Shoulder pivot
      armGroup.addChild(arm)
    }

    // 2. Load Cup (Cafe ONLY)
    if (sceneType === 'cafe') {
      const accessoryTexture = await loadSVGTexture(generateAccessoryDataURI('coffee'), 60, 60)
      if (accessoryTexture) {
        const cup = new PIXI.Sprite(accessoryTexture)
        cup.name = 'accessory'
        cup.width = 60
        cup.height = 60
        cup.anchor.set(0.5, 0.5)
        cup.scale.set(1.4) // BIG cup
        cup.position.set(-9, 50) // Relative to shoulder (Moved 10% left)
        armGroup.addChild(cup)
      }
    }

    // 3. Position Group on Body
    armGroup.position.set(28, 60)

    container.addChild(armGroup)
  }

  // Layout summary:
  //   Head: y=-10 to y=66   (76px tall, anchored at bottom y=66)
  //   Body: y=30  to y=172  (142px tall, anchored at top y=30)
  //   Pivot at bottom of body = 172px from container origin
  container.pivot.set(0, 172)

  return container
}
