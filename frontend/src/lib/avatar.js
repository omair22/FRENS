export const AVATAR_STYLES = [
  {
    id: 'adventurer',
    label: 'Adventurer',
    emoji: '🧗',
    description: 'Adventurous character'
  },
  {
    id: 'avataaars',
    label: 'Cartoon',
    emoji: '🎨',
    description: 'Classic illustrated character'
  },
  {
    id: 'bottts',
    label: 'Robot',
    emoji: '🤖', 
    description: 'Cute robot character'
  },
  {
    id: 'fun-emoji',
    label: 'Emoji',
    emoji: '😎',
    description: 'Fun emoji face'
  },
  {
    id: 'lorelei',
    label: 'Artistic',
    emoji: '🎭',
    description: 'Illustrated portrait'
  },
  {
    id: 'notionists',
    label: 'Minimal',
    emoji: '✏️',
    description: 'Clean minimal style'
  }
]

export const STYLE_OPTIONS = {
  adventurer: {
    skinColor: {
      label: 'Skin',
      type: 'swatch',
      values: ['f2d3b1', 'ebbe9b', 'e0a383', 'ba7d5a', '915b3c', '694d3d', '442a22']
    },
    hair: {
      label: 'Hair Style',
      type: 'chips',
      values: ['short01', 'short02', 'short03', 'short04', 'short05', 'long01', 'long02', 'long03', 'long04', 'long05', 'long06', 'long07', 'none']
    },
    hairColor: {
      label: 'Hair Color',
      type: 'swatch',
      values: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'e8e1e1', 'ecdcbf', 'c93305', 'ff488e', 'a020f0', '1e90ff', '00c04b']
    },
    eyes: {
      label: 'Eyes',
      type: 'chips',
      values: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13']
    },
    mouth: {
      label: 'Mouth',
      type: 'chips',
      values: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12']
    }
  },
  avataaars: {
    skinColor: {
      label: 'Skin',
      type: 'swatch',
      values: ['f8d5c2', 'edb98a', 'd08b5b', 'ae5d29', '614335', 'ffdbb4', 'ffcba4']
    },
    top: {
      label: 'Hair / Hat',
      type: 'chips',
      values: ['shortHair', 'longHair', 'hat', 'hijab', 'turban', 'winterHat1', 'eyepatch', 'noHair']
    },
    topColor: {
      label: 'Hair / Hat Color',
      type: 'swatch',
      values: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'e8e1e1', 'ecdcbf', 'c93305', 'ff488e', 'a020f0', '1e90ff', '00c04b']
    },
    accessories: {
      label: 'Accessories', 
      type: 'chips',
      values: ['none', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers']
    },
    facialHair: {
      label: 'Facial Hair',
      type: 'chips',
      values: ['none', 'beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum']
    },
    clothesColor: {
      label: 'Outfit',
      type: 'swatch',
      values: ['ff6b6b', '6bcb77', '4d96ff', 'ffd93d', 'c77dff', 'ff9a3c', 'ffffff', '1a1a2e']
    }
  },
  bottts: {
    baseColor: {
      label: 'Body Color',
      type: 'swatch',
      values: ['ffb300', '1e88e5', '546e7a', '6d4c41', '00acc1', 'f4511e', '5e35b1', '43a047', '757575', '3949ab', '039be5', '7cb342', 'c0ca33', 'fb8c00', 'd81b60', '8e24aa', 'e53935', '00897b', 'fdd835']
    },
    eyes: {
      label: 'Eyes',
      type: 'chips',
      values: ['bulging', 'dizzy', 'eva', 'frame1', 'frame2', 'glow', 'happy', 'hearts', 'robocop', 'round', 'roundFrame01', 'roundFrame02', 'sensor', 'shade01']
    },
    mouth: {
      label: 'Mouth',
      type: 'chips',
      values: ['bite', 'diagram', 'grill01', 'grill02', 'grill03', 'smile01', 'smile02', 'square01', 'square02']
    },
    sides: {
      label: 'Sides',
      type: 'chips',
      values: ['antenna01', 'antenna02', 'cables01', 'cables02', 'round', 'square', 'squareAssymetric']
    }
  },
  'fun-emoji': {
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['fcbc34', 'd84be5', 'd9915b', 'f6d594', '059ff2', '71cf62', 'transparent']
    },
    eyes: {
      label: 'Eyes',
      type: 'chips',
      values: ['plain', 'sad', 'tearDrop', 'pissed', 'cute', 'wink', 'wink2', 'glasses', 'closed', 'love', 'stars', 'shades', 'closed2', 'crying', 'sleepClose']
    },
    mouth: {
      label: 'Mouth',
      type: 'chips',
      values: ['plain', 'lilSmile', 'sad', 'shy', 'cute', 'wideSmile', 'shout', 'smileTeeth', 'smileLol', 'pissed', 'drip', 'tongueOut', 'kissHeart', 'sick', 'faceMask']
    }
  },
  lorelei: {
    skinColor: {
      label: 'Skin',
      type: 'swatch',
      values: ['f8d5c2', 'edb98a', 'd08b5b', 'ae5d29', '614335', 'ffdbb4', 'ffcba4']
    },
    hair: {
      label: 'Hair',
      type: 'chips',
      values: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17']
    },
    hairColor: {
      label: 'Hair Color',
      type: 'swatch',
      values: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'e8e1e1', 'ecdcbf', 'c93305', 'ff488e', 'a020f0', '1e90ff', '00c04b']
    },
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['ff6b6b', '6bcb77', '4d96ff', 'ffd93d', 'c77dff', 'ff9a3c', '1a1a2e', 'ffffff', 'transparent']
    }
  },
  notionists: {
    body: {
      label: 'Body',
      type: 'chips',
      values: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10', 'variant11', 'variant12', 'variant13', 'variant14', 'variant15', 'variant16', 'variant17', 'variant18', 'variant19', 'variant20']
    },
    face: {
      label: 'Face',
      type: 'chips',
      values: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05', 'variant06', 'variant07', 'variant08', 'variant09', 'variant10']
    },
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['ff6b6b', '6bcb77', '4d96ff', 'ffd93d', 'c77dff', 'ff9a3c', '1a1a2e', 'ffffff', 'transparent']
    }
  }
}

export const DEFAULT_AVATAR_CONFIG = {
  style: 'adventurer',
  skinColor: 'f2d3b1',
  hair: 'short01',
  hairColor: '2c1b18',
  eyes: 'variant01',
  mouth: 'variant01'
}

export const buildAvatarUrl = (seed, config = {}) => {
  const style = config.style || 'adventurer'
  const params = new URLSearchParams()
  
  params.set('seed', seed || 'you')
  
  // Add all config keys as params except 'style'
  Object.entries(config).forEach(([key, value]) => {
    if (key !== 'style' && value !== undefined && value !== null) {
      params.set(key, value)
      
      // Auto-handle probabilities for optional features
      // If a feature is selected and isn't 'none', set its probability to 100
      const featuresWithProbabilities = ['accessories', 'facialHair', 'earrings', 'glasses', 'beard', 'mouth', 'sides']
      if (featuresWithProbabilities.includes(key) && value !== 'none') {
        params.set(`${key}Probability`, '100')
      }
    }
  })
  
  const query = params.toString()
  return `https://api.dicebear.com/7.x/${style}/svg?${query}`
}

export const getAvatarUrl = (user, _size) =>
  buildAvatarUrl(user?.name, user?.avatar_config || {})
