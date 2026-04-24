/**
 * Separated Accessory Generator
 * Returns SVG for specific accessories so they can be animated independently in Pixi.
 */
export const generateAccessorySVG = (type, width = 60, height = 60) => {
  if (type === 'coffee') {
    return `
<svg viewBox="0 0 60 60" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Steam -->
  <path d="M 24 15 Q 26 10 24 5" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4">
    <animate attributeName="d" values="M 24 15 Q 26 10 24 5; M 24 15 Q 22 10 24 5; M 24 15 Q 26 10 24 5" dur="2s" repeatCount="indefinite" />
  </path>
  <path d="M 30 13 Q 32 8 30 3" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4">
    <animate attributeName="d" values="M 30 13 Q 32 8 30 3; M 30 13 Q 28 8 30 3; M 30 13 Q 32 8 30 3" dur="2.5s" repeatCount="indefinite" />
  </path>
  <path d="M 36 15 Q 38 10 36 5" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.4">
    <animate attributeName="d" values="M 36 15 Q 38 10 36 5; M 36 15 Q 34 10 36 5; M 36 15 Q 38 10 36 5" dur="1.8s" repeatCount="indefinite" />
  </path>

  <!-- Cup Handle -->
  <path d="M 42 22 Q 48 22 48 28 Q 48 34 42 34" fill="none" stroke="#ffffff" stroke-width="3" />
  
  <!-- Cup Body -->
  <path d="M 18 20 L 42 20 L 38 42 Q 30 45 22 42 Z" fill="#ffffff" stroke="#000000" stroke-width="2" />
</svg>
    `
  }
  
  if (type === 'shopping_bag') {
    return `
<svg viewBox="0 0 60 60" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Handles -->
  <path d="M 22 25 Q 30 10 38 25" fill="none" stroke="#555" stroke-width="2.5" />
  <!-- Bag -->
  <rect x="15" y="25" width="30" height="30" rx="2" fill="#f39c12" stroke="#d35400" stroke-width="1.5" />
</svg>
    `
  }
  
  if (type === 'gaming') {
    return `
<svg viewBox="0 0 60 40" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="5" width="40" height="25" rx="8" fill="#333" stroke="#000" stroke-width="2"/>
  <circle cx="18" cy="17" r="4" fill="#555"/>
  <rect x="34" y="13" width="10" height="3" rx="1.5" fill="#555"/>
  <rect x="37" y="10" width="3" height="10" rx="1.5" fill="#555"/>
</svg>
    `
  }
  
  return `<svg></svg>`
}

export const generateAccessoryDataURI = (type) => {
  const svg = generateAccessorySVG(type)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
