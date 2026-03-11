import React from 'react'
import { buildAvatarUrl, DEFAULT_AVATAR_CONFIG } from '../lib/avatar'

const STATUS_COLORS = {
  free:      '#6bcb77',
  busy:      '#ff6b6b',
  maybe:     '#ffd93d',
  ghost:     '#c77dff',
  invisible: '#444',
  offline:   '#444',
}

/**
 * <Avatar name="Jake" config={user.avatar_config} size={40} status="free" />
 * Always renders something — falls back to DEFAULT_AVATAR_CONFIG if config is empty/null.
 */
const Avatar = ({ name, config, size = 40, status, className = '', onClick }) => {
  // Merge with defaults so an empty {} or null/undefined always shows a full avatar.
  // HOWEVER, only merge if the style matches the default, otherwise we might
  // pollute other styles with Adventurer-specific parameters like 'hair'
  const isDefaultStyle = (config?.style || DEFAULT_AVATAR_CONFIG.style) === DEFAULT_AVATAR_CONFIG.style
  const mergedConfig = isDefaultStyle 
    ? { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }
    : (config || {})
    
  const url = buildAvatarUrl(name, mergedConfig)
  const dotSize = Math.round(size * 0.28)

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <img
        src={url}
        alt={name || 'avatar'}
        className="rounded-full w-full h-full object-cover"
        style={{ background: '#1d1928' }}
      />
      {status && STATUS_COLORS[status] && (
        <div
          className="absolute bottom-0 right-0 rounded-full border-2"
          style={{
            width: dotSize,
            height: dotSize,
            background: STATUS_COLORS[status],
            borderColor: '#0e0c14',
          }}
        />
      )}
    </div>
  )
}

export default Avatar
