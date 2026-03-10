/**
 * DiceBear v7 Adventurer avatar URL builder
 * https://www.dicebear.com/styles/adventurer
 *
 * The adventurer style generates unique avatars from the seed value.
 * Customisation options: backgroundColor, skinColor, hair, hairColor,
 * eyes, eyebrows, mouth, earrings, glasses, features
 */

export const DEFAULT_AVATAR_CONFIG = {
  skinColor:     'f2d3b1',
  hair:          'short01',
  hairColor:     'ac6651',
  eyes:          'variant01',
  eyebrows:      'variant01',
  mouth:         'variant01',
  earrings:      'none',
  glasses:       'none',
  features:      'none',
}

export const buildAvatarUrl = (name, config = {}) => {
  const cfg = { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }
  const base = 'https://api.dicebear.com/7.x/adventurer/svg'
  const p = new URLSearchParams()

  p.set('seed',            name || 'user')
  p.set('backgroundColor', 'transparent')

  // Skin
  p.set('skinColor', cfg.skinColor)

  // Hair
  if (cfg.hair && cfg.hair !== 'none') {
    p.set('hair', cfg.hair)
    p.set('hairColor', cfg.hairColor)
  }

  // Face features
  p.set('eyes',     cfg.eyes)
  p.set('eyebrows', cfg.eyebrows)
  p.set('mouth',    cfg.mouth)

  // Accessories
  if (cfg.earrings && cfg.earrings !== 'none') {
    p.set('earrings',            cfg.earrings)
    p.set('earringsProbability', '100')
  } else {
    p.set('earringsProbability', '0')
  }

  if (cfg.glasses && cfg.glasses !== 'none') {
    p.set('glasses',            cfg.glasses)
    p.set('glassesProbability', '100')
  } else {
    p.set('glassesProbability', '0')
  }

  if (cfg.features && cfg.features !== 'none') {
    p.set('features',            cfg.features)
    p.set('featuresProbability', '100')
  } else {
    p.set('featuresProbability', '0')
  }

  return `${base}?${p.toString()}`
}

export const getAvatarUrl = (user, _size) =>
  buildAvatarUrl(user?.name, user?.avatar_config || {})
