import React from 'react'
import { buildAvatarUrl, DEFAULT_AVATAR_CONFIG } from '../lib/avatar'

const STATUS_COLORS = {
  free:      '#4caf7d',
  busy:      '#ff4d4d',
  maybe:     '#f5a623',
  ghost:     '#9b7fff',
  invisible: 'transparent',
  offline:   '#3a3a3a',
}

/**
 * <Avatar name="Jake" config={user.avatar_config} size={40} status="free" />
 * Always circular. Status dot bottom-right.
 */
const Avatar = ({ name, config, size = 40, status, className = '', onClick }) => {
  const isDefaultStyle = (config?.style || DEFAULT_AVATAR_CONFIG.style) === DEFAULT_AVATAR_CONFIG.style
  const mergedConfig = isDefaultStyle
    ? { ...DEFAULT_AVATAR_CONFIG, ...(config || {}) }
    : (config || {})

  const url = buildAvatarUrl(name, mergedConfig)
  const dotSize = 10

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      <img
        src={url}
        alt={name || 'avatar'}
        className="w-full h-full object-cover"
        style={{
          borderRadius: '50%',
          background: '#1a1a1a',
          border: '2px solid #0a0a0a', // knockout border for stacking
        }}
      />
      {status && STATUS_COLORS[status] && status !== 'invisible' && (
        <div
          className="absolute"
          style={{
            width: dotSize,
            height: dotSize,
            bottom: 1,
            right: 1,
            background: STATUS_COLORS[status],
            borderRadius: '50%',
            border: '2px solid #0a0a0a',
          }}
        />
      )}
    </div>
  )
}

export default Avatar
