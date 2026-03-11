export const AVATAR_STYLES = [
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
  avataaars: {
    skinColor: {
      label: 'Skin',
      type: 'swatch',
      values: ['f8d5c2','edb98a','d08b5b','ae5d29','614335','ffdbb4','ffcba4']
    },
    hairColor: {
      label: 'Hair colour',
      type: 'swatch', 
      values: ['2c1b18','4a312c','724133','a55728','b58143','d6b370','e8e1e1','ecdcbf','c93305','ff488e','a020f0','1e90ff','00c04b']
    },
    top: {
      label: 'Hair style',
      type: 'chips',
      values: ['shortHair','longHair','hat','hijab','turban','winterHat1','eyepatch','noHair']
    },
    accessories: {
      label: 'Accessories', 
      type: 'chips',
      values: ['none','kurt','prescription01','prescription02','round','sunglasses','wayfarers']
    },
    facialHair: {
      label: 'Facial hair',
      type: 'chips',
      values: ['none','beardLight','beardMajestic','beardMedium','moustacheFancy','moustacheMagnum']
    },
    clothesColor: {
      label: 'Outfit',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','ffffff','1a1a2e']
    }
  },
  bottts: {
    primaryColor: {
      label: 'Primary colour',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','ffffff','1a1a2e','00c9a7','f72585']
    },
    secondaryColor: {
      label: 'Secondary colour',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','ffffff','1a1a2e','00c9a7','f72585']
    }
  },
  'fun-emoji': {
    eyes: {
      label: 'Eyes',
      type: 'chips',
      values: ['closed','closed2','crying','cute','glasses','love','pissed','shades','sleepy','stars','wink','wink2']
    },
    mouth: {
      label: 'Mouth',
      type: 'chips',
      values: ['cute','drooling','faceMask','kissing','lilSmile','pissed','sad','shout','shy','sick','smileLol','smileTeeth','tongueOut','wideSmile']
    },
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','ffb3ba','baffc9','bae1ff','ffffba','transparent']
    }
  },
  lorelei: {
    hairColor: {
      label: 'Hair colour',
      type: 'swatch',
      values: ['2c1b18','4a312c','724133','a55728','b58143','d6b370','e8e1e1','ecdcbf','c93305','ff488e','a020f0','1e90ff','00c04b']
    },
    skinColor: {
      label: 'Skin',
      type: 'swatch',
      values: ['f8d5c2','edb98a','d08b5b','ae5d29','614335','ffdbb4','ffcba4']
    },
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','1a1a2e','ffffff']
    }
  },
  notionists: {
    backgroundColor: {
      label: 'Background',
      type: 'swatch',
      values: ['ff6b6b','6bcb77','4d96ff','ffd93d','c77dff','ff9a3c','1a1a2e','ffffff','transparent']
    },
    stroke: {
      label: 'Stroke',
      type: 'swatch',
      values: ['000000','ffffff','ff6b6b','6bcb77','4d96ff','ffd93d']
    }
  }
}

export const DEFAULT_AVATAR_CONFIG = {
  style: 'avataaars',
  skinColor: 'f8d5c2',
  hairColor: '2c1b18',
  top: 'shortHair',
  accessories: 'none',
  facialHair: 'none',
  clothesColor: 'ff6b6b'
}

export const buildAvatarUrl = (seed, config = {}) => {
  const style = config.style || 'avataaars'
  const params = new URLSearchParams()
  
  // Add all config keys as params except 'style'
  Object.entries(config).forEach(([key, value]) => {
    if (key !== 'style' && value !== undefined && value !== null) {
      params.set(key, value)
    }
  })
  
  const query = params.toString()
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}${query ? '&' + query : ''}`
}

export const getAvatarUrl = (user, _size) =>
  buildAvatarUrl(user?.name, user?.avatar_config || {})
