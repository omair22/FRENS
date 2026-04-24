const extractOutfit = (avatarConfig = {}) => {
  // A curated palette of casual human outfits (20 varieties)
  const palettes = [
    { top: '#e74c3c', pants: '#2c3e50', shoes: '#ecf0f1' }, // Red hoodie, dark jeans, white sneakers
    { top: '#f39c12', pants: '#34495e', shoes: '#ffffff' }, // Yellow, navy, white
    { top: '#2ecc71', pants: '#273746', shoes: '#bdc3c7' }, // Green, dark grey
    { top: '#3498db', pants: '#17202a', shoes: '#ecf0f1' }, // Blue, black
    { top: '#9b59b6', pants: '#ecf0f1', shoes: '#34495e' }, // Purple, light grey
    { top: '#ecf0f1', pants: '#2980b9', shoes: '#e74c3c' }, // White, blue, red
    { top: '#1abc9c', pants: '#34495e', shoes: '#ecf0f1' }, // Teal, navy
    { top: '#e67e22', pants: '#2c3e50', shoes: '#ffffff' }, // Orange, navy
    { top: '#34495e', pants: '#bdc3c7', shoes: '#2c3e50' }, // Navy, grey
    { top: '#e84393', pants: '#2d3436', shoes: '#dfe6e9' }, // Pink, dark pants
    { top: '#ff9ff3', pants: '#576574', shoes: '#feca57' }, // Pastel pink, slate, yellow shoes
    { top: '#5f27cd', pants: '#c8d6e5', shoes: '#10ac84' }, // Indigo, ice blue, green shoes
    { top: '#01a3a4', pants: '#222f3e', shoes: '#c8d6e5' }, // Sea blue, very dark grey
    { top: '#ff6b6b', pants: '#48dbfb', shoes: '#feca57' }, // Coral red, cyan jeans
    { top: '#222f3e', pants: '#c8d6e5', shoes: '#ff9f43' }, // Black top, light jeans, orange shoes
    { top: '#ff9f43', pants: '#222f3e', shoes: '#01a3a4' }, // Orange top, black jeans, blue shoes
    { top: '#10ac84', pants: '#c8d6e5', shoes: '#222f3e' }, // Mint top, light jeans, dark shoes
    { top: '#c8d6e5', pants: '#5f27cd', shoes: '#ff6b6b' }, // Ice blue, indigo pants
    { top: '#54a0ff', pants: '#341f97', shoes: '#feca57' }, // Light blue, deep purple pants
    { top: '#feca57', pants: '#222f3e', shoes: '#ff6b6b' }, // Yellow, black pants, red shoes
  ]

  const types = ['hoodie', 'sweater', 'tshirt', 'jacket']

  // Consistently hash based on the user's avatar traits AND their unique name
  const seedStr = (avatarConfig.hairColor || 'h') + (avatarConfig.skinColor || 's') + (avatarConfig.backgroundColor || 'b') + (avatarConfig.seedName || '')
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  const absHash = Math.abs(hash)
  
  return {
    palette: palettes[absHash % palettes.length],
    type: types[(absHash >> 2) % types.length]
  }
}

const darken = (hex, amount = 40) => {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const r = Math.max(0, (num >> 16) - amount)
  const g = Math.max(0, ((num >> 8) & 0xff) - amount)
  const b = Math.max(0, (num & 0xff) - amount)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

const lighten = (hex, amount = 40) => {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  const r = Math.min(255, (num >> 16) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
}

/**
 * Generates a SEATED flat-vector character SVG.
 * Redesigned to look like a human in casual clothing (hoodie, jeans, sneakers)
 * viewBox: 120 x 130
 */
export const generateBodySVG = (avatarConfig = {}, options = {}) => {
  const { width = 120, height = 130 } = options

  const outfitInfo = extractOutfit(avatarConfig)
  const top = outfitInfo.palette.top
  const topDark = darken(top, 35)
  const pants = outfitInfo.palette.pants
  const pantsDark = darken(pants, 35)
  const shoes = outfitInfo.palette.shoes
  const shoeDark = darken(shoes, 30)
  const outfitType = outfitInfo.type
  
  const outline = '#1a1a2e' // universal dark outline color
  const stroke = `stroke="${outline}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`

  // Skin tone for hands and neck
  const skinMap = {
    'f2d3b1': '#f2d3b1', 'ebbe9b': '#ebbe9b', 'e0a383': '#e0a383',
    'ba7d5a': '#ba7d5a', '915b3c': '#915b3c', '694d3d': '#694d3d', '442a22': '#442a22'
  }
  const skinHex = (avatarConfig.skinColor || '').replace('#','').toLowerCase()
  const skin = skinMap[skinHex] || '#e0a383'

  let torsoDetails = ''
  if (outfitType === 'hoodie') {
    torsoDetails = `
      <!-- Hoodie pocket -->
      <path d="M 44 64 L 76 64 L 80 80 L 40 80 Z" fill="${top}" ${stroke}/>
      <path d="M 40 80 L 44 64" fill="none" stroke="${topDark}" stroke-width="3" stroke-linecap="round"/>
      <path d="M 80 80 L 76 64" fill="none" stroke="${topDark}" stroke-width="3" stroke-linecap="round"/>
      <!-- Neck opening / skin under hoodie -->
      <path d="M 50 24 Q 60 34 70 24" fill="${skin}" ${stroke}/>
      <!-- Hoodie collar thickness -->
      <path d="M 46 24 Q 60 38 74 24" fill="none" stroke="${topDark}" stroke-width="3" stroke-linecap="round"/>
      <!-- Drawstrings -->
      <path d="M 53 30 Q 51 38 54 46" fill="none" stroke="${topDark}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 67 30 Q 69 38 66 46" fill="none" stroke="${topDark}" stroke-width="2.5" stroke-linecap="round"/>
    `
  } else if (outfitType === 'sweater') {
    torsoDetails = `
      <!-- Neck opening -->
      <path d="M 48 24 Q 60 36 72 24" fill="${skin}" ${stroke}/>
      <path d="M 48 24 Q 60 36 72 24" fill="none" stroke="${topDark}" stroke-width="4" stroke-linecap="round"/>
      <!-- Sweater ribbed bottom -->
      <rect x="34" y="76" width="52" height="10" rx="4" fill="${topDark}" ${stroke}/>
    `
  } else if (outfitType === 'tshirt') {
    torsoDetails = `
      <!-- T-shirt collar -->
      <path d="M 48 24 Q 60 38 72 24" fill="${skin}" ${stroke}/>
      <path d="M 48 24 Q 60 38 72 24" fill="none" stroke="${topDark}" stroke-width="2" stroke-linecap="round"/>
      <!-- Graphic tee design -->
      <rect x="44" y="52" width="32" height="12" rx="4" fill="${topDark}" opacity="0.4"/>
    `
  } else if (outfitType === 'jacket') {
    torsoDetails = `
      <!-- Inner shirt -->
      <path d="M 50 24 L 54 86 L 66 86 L 70 24" fill="#ffffff" ${stroke}/>
      <path d="M 50 24 Q 60 34 70 24" fill="${skin}" ${stroke}/>
      <!-- Jacket zipper/opening lines -->
      <line x1="54" y1="26" x2="54" y2="86" stroke="${topDark}" stroke-width="3" stroke-linecap="round"/>
      <line x1="66" y1="26" x2="66" y2="86" stroke="${topDark}" stroke-width="3" stroke-linecap="round"/>
    `
  }

  let leftArm = ''
  let rightArm = ''

  if (outfitType === 'tshirt') {
    leftArm = `
      <rect x="8" y="24" width="28" height="18" rx="8" fill="${top}" ${stroke} transform="rotate(20 8 24)"/>
      <circle cx="18" cy="46" r="8" fill="${skin}" ${stroke}/>
      <rect x="10" y="44" width="24" height="22" rx="7" fill="${skin}" ${stroke} transform="rotate(-15 10 44)"/>
    `
    rightArm = `
      <rect x="84" y="24" width="28" height="18" rx="8" fill="${top}" ${stroke} transform="rotate(-20 112 24)"/>
      <circle cx="102" cy="46" r="8" fill="${skin}" ${stroke}/>
      <rect x="86" y="44" width="24" height="22" rx="7" fill="${skin}" ${stroke} transform="rotate(15 110 44)"/>
    `
  } else {
    leftArm = `
      <rect x="8" y="24" width="28" height="22" rx="9" fill="${top}" ${stroke} transform="rotate(20 8 24)"/>
      <circle cx="18" cy="46" r="9" fill="${top}" ${stroke}/>
      <rect x="10" y="44" width="24" height="22" rx="8" fill="${top}" ${stroke} transform="rotate(-15 10 44)"/>
    `
    rightArm = `
      <rect x="84" y="24" width="28" height="22" rx="9" fill="${top}" ${stroke} transform="rotate(-20 112 24)"/>
      <circle cx="102" cy="46" r="9" fill="${top}" ${stroke}/>
      <rect x="86" y="44" width="24" height="22" rx="8" fill="${top}" ${stroke} transform="rotate(15 110 44)"/>
    `
  }

  const accessory = options.accessory || 'none'
  let accessoryMarkup = ''

  if (accessory === 'gaming') {
    accessoryMarkup = `
      <!-- ── GAME CONTROLLER ── -->
      <!-- Controller body -->
      <rect x="30" y="63" width="60" height="26" rx="10" fill="#1e1e2e" stroke="${outline}" stroke-width="2.5"/>

      <!-- Left grip -->
      <rect x="26" y="74" width="18" height="20" rx="9" fill="#252540" stroke="${outline}" stroke-width="2"/>
      <!-- Right grip -->
      <rect x="76" y="74" width="18" height="20" rx="9" fill="#252540" stroke="${outline}" stroke-width="2"/>

      <!-- D-pad -->
      <rect x="38" y="67" width="6" height="14" rx="2" fill="#3a3a5a"/>
      <rect x="34" y="71" width="14" height="6" rx="2" fill="#3a3a5a"/>

      <!-- Face buttons (ABXY) -->
      <circle cx="76" cy="69" r="3.5" fill="#4d96ff" stroke="${outline}" stroke-width="1"/>
      <circle cx="82" cy="73" r="3.5" fill="#ff4d4d" stroke="${outline}" stroke-width="1"/>
      <circle cx="76" cy="77" r="3.5" fill="#4caf7d" stroke="${outline}" stroke-width="1"/>
      <circle cx="70" cy="73" r="3.5" fill="#f5a623" stroke="${outline}" stroke-width="1"/>

      <!-- Thumbsticks -->
      <circle cx="48" cy="77" r="6" fill="#2a2a4a" stroke="${outline}" stroke-width="1.5"/>
      <circle cx="48" cy="77" r="3" fill="#3a3a6a"/>
      <circle cx="64" cy="75" r="6" fill="#2a2a4a" stroke="${outline}" stroke-width="1.5"/>
      <circle cx="64" cy="75" r="3" fill="#3a3a6a"/>

      <!-- Bumpers -->
      <rect x="32" y="62" width="18" height="6" rx="3" fill="#2a2a4a" stroke="${outline}" stroke-width="1.5"/>
      <rect x="70" y="62" width="18" height="6" rx="3" fill="#2a2a4a" stroke="${outline}" stroke-width="1.5"/>
    `
  } else if (accessory === 'coffee') {
    accessoryMarkup = `
      <!-- ── COFFEE CUP ── -->
      <!-- Cup Handle -->
      <path d="M 87 70 Q 97 70 97 80 Q 97 90 87 90" fill="none" stroke="${outline}" stroke-width="2.2" stroke-linecap="round"/>
      <!-- Cup Body -->
      <path d="M 61 66 L 89 66 L 86 94 Q 75 98 64 94 Z" fill="#f5f5f5" stroke="${outline}" stroke-width="2.8"/>
      <!-- Coffee Surface / Steam -->
      <path d="M 61 66 Q 75 69 89 66" fill="none" stroke="#ddd" stroke-width="1"/>
      <path d="M 69 60 Q 71 55 69 50" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4"/>
      <path d="M 75 58 Q 77 53 75 48" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4"/>
      <path d="M 81 60 Q 83 55 81 50" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4"/>
    `
  }

  const hideLegs = options.hideLegs || false
  const pose = options.pose || 'seated'

  let bodyMarkup = ''

  if (pose === 'standing') {
    bodyMarkup = `
      <!-- ── STANDING LEGS ── -->
      ${!hideLegs ? `
      <!-- Left leg -->
      <rect x="36" y="86" width="22" height="64" rx="6" fill="${pants}" ${stroke}/>
      <!-- Right leg -->
      <rect x="62" y="86" width="22" height="64" rx="6" fill="${pants}" ${stroke}/>
      <!-- Left shoe -->
      <rect x="34" y="142" width="26" height="12" rx="4" fill="${shoes}" ${stroke}/>
      <!-- Right shoe -->
      <rect x="60" y="142" width="26" height="12" rx="4" fill="${shoes}" ${stroke}/>
      ` : ''}
      <!-- Torso -->
      <rect x="32" y="24" width="56" height="64" rx="14" fill="${top}" ${stroke}/>
      ${torsoDetails}
      <!-- Arms -->
      <g transform="rotate(10 32 24)">
        <rect x="18" y="24" width="22" height="50" rx="8" fill="${top}" ${stroke}/>
        <circle cx="29" cy="74" r="8" fill="${skin}" ${stroke}/>
      </g>
      ${options.hideRightArm ? '' : `
      <g transform="rotate(-10 88 24)">
        <rect x="80" y="24" width="22" height="50" rx="8" fill="${top}" ${stroke}/>
        <circle cx="91" cy="74" r="8" fill="${skin}" ${stroke}/>
      </g>
      `}
    `
  } else {
    // Seated pose (Existing logic)
    bodyMarkup = `
      <!-- ── SEATED LOWER LEGS ── -->
      ${!hideLegs ? `
      <g transform="rotate(-8 21 88)">
        <rect x="4" y="126" width="34" height="20" rx="8" fill="${shoes}" ${stroke}/>
        <rect x="4" y="138" width="34" height="8" rx="4" fill="#ffffff" ${stroke}/>
        <rect x="10" y="88" width="22" height="42" rx="6" fill="${pants}" ${stroke}/>
      </g>
      <g transform="rotate(8 99 88)">
        <rect x="82" y="126" width="34" height="20" rx="8" fill="${shoes}" ${stroke}/>
        <rect x="82" y="138" width="34" height="8" rx="4" fill="#ffffff" ${stroke}/>
        <rect x="88" y="88" width="22" height="42" rx="6" fill="${pants}" ${stroke}/>
      </g>
      ` : ''}
      <!-- Thighs -->
      ${!hideLegs ? `
      <rect x="8" y="74" width="42" height="24" rx="12" fill="${pants}" ${stroke}/>
      <rect x="70" y="74" width="42" height="24" rx="12" fill="${pants}" ${stroke}/>
      ` : ''}
      <!-- Torso -->
      <rect x="32" y="24" width="56" height="62" rx="14" fill="${top}" ${stroke}/>
      ${torsoDetails}
      <!-- Arms -->
      ${leftArm}
      <ellipse cx="28" cy="68" rx="9" ry="8" fill="${skin}" ${stroke}/>
      ${options.hideRightArm ? '' : `
        ${rightArm}
        <ellipse cx="92" cy="68" rx="9" ry="8" fill="${skin}" ${stroke}/>
      `}
    `
  }

  return `
<svg viewBox="0 0 120 155" width="${width}" height="${height}" 
  xmlns="http://www.w3.org/2000/svg"
  shape-rendering="geometricPrecision">
  ${bodyMarkup}
  ${options.hideAccessory ? '' : accessoryMarkup}
</svg>
`
}

export const generateBodySVGDataURI = (avatarConfig, options) => {
  const svg = generateBodySVG(avatarConfig, options)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const generateRightArmSVG = (avatarConfig) => {
  const { palette } = extractOutfit(avatarConfig)
  const top = palette.top
  
  // Use the same skin mapping as the body
  const skinMap = {
    'f2d3b1': '#f2d3b1', 'ebbe9b': '#ebbe9b', 'e0a383': '#e0a383',
    'ba7d5a': '#ba7d5a', '915b3c': '#915b3c', '694d3d': '#694d3d', '442a22': '#442a22'
  }
  const skinHex = (avatarConfig.skinColor || '').replace('#','').toLowerCase()
  const skin = skinMap[skinHex] || '#e0a383'
  
  const stroke = 'stroke="#1a1a2e" stroke-width="3"'

  return `
<svg viewBox="0 0 120 155" width="120" height="155" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(-10 88 24)">
    <rect x="80" y="24" width="22" height="50" rx="8" fill="${top}" ${stroke}/>
    <circle cx="91" cy="74" r="8" fill="${skin}" ${stroke}/>
  </g>
</svg>
`
}

export const generateRightArmDataURI = (avatarConfig) => {
  const svg = generateRightArmSVG(avatarConfig)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const getAccessoryForScene = (sceneType) => {
  if (sceneType === 'gaming') return 'gaming'
  if (sceneType === 'cafe') return 'coffee'
  if (sceneType === 'gym') return 'none'
  if (sceneType === 'shopping') return 'shopping_bag'
  return 'none'
}
