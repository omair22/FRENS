/**
 * Avataaars DiceBear avatar URL builder (v7.x)
 * https://www.dicebear.com/styles/avataaars
 */

export const DEFAULT_AVATAR_CONFIG = {
  skinColor:     'f8d25c',
  hairStyle:     'shortHairShortFlat',
  hairColor:     'a55728',
  facialHair:    'none',        // 'none' means facialHairProbability=0
  accessories:   'none',        // 'none' means accessoriesProbability=0
  clothingColor: 'ff6b6b',
  eyeType:       'default',
  mouthType:     'smile',
}

export const buildAvatarUrl = (name, config = {}) => {
  const cfg = { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }
  const base = 'https://api.dicebear.com/7.x/avataaars/svg'
  const p = new URLSearchParams()

  // Seed & background
  p.set('seed',            name || 'user')
  p.set('backgroundColor', '1d1928')
  p.set('backgroundType',  'solid')

  // Appearance — plain key=value, no brackets
  p.set('skinColor',     cfg.skinColor)
  p.set('hairColor',     cfg.hairColor)
  p.set('clothingColor', cfg.clothingColor)
  p.set('top',           cfg.hairStyle)
  p.set('eyes',          cfg.eyeType)
  p.set('mouth',         cfg.mouthType)

  // Facial hair — 'none' disables it via probability
  if (cfg.facialHair && cfg.facialHair !== 'none' && cfg.facialHair !== 'blank') {
    p.set('facialHair', cfg.facialHair)
  } else {
    p.set('facialHairProbability', '0')
  }

  // Accessories — same pattern
  if (cfg.accessories && cfg.accessories !== 'none' && cfg.accessories !== 'blank') {
    p.set('accessories', cfg.accessories)
  } else {
    p.set('accessoriesProbability', '0')
  }

  return `${base}?${p.toString()}`
}

// Legacy shim kept for any remaining getAvatarUrl calls
export const getAvatarUrl = (user, _size) =>
  buildAvatarUrl(user?.name, user?.avatar_config || {})
