import React from 'react'
import { getAvatarUrl } from '../lib/avatar'

/**
 * <Avatar user={user} size="md" status={true} className="" />
 * sizes: xs=24 sm=32 md=48 lg=80 xl=120
 */
const sizeMap = { xs: 24, sm: 32, md: 48, lg: 80, xl: 120 }

const statusColor = {
  free: 'bg-primary-green',
  maybe: 'bg-primary-yellow',
  busy: 'bg-primary-red',
}

const Avatar = ({ user, size = 'md', showStatus = false, className = '' }) => {
  const px = typeof size === 'number' ? size : (sizeMap[size] || 48)
  const url = getAvatarUrl(user, px * 2) // 2x for retina

  const borderRadius = px >= 80 ? 'rounded-[2rem]' : 'rounded-full'

  return (
    <div
      className={`relative flex-shrink-0 ${className}`}
      style={{ width: px, height: px }}
    >
      {url ? (
        <img
          src={url}
          alt={user?.name || 'avatar'}
          className={`w-full h-full object-cover ${borderRadius} bg-card`}
          loading="lazy"
        />
      ) : (
        <div className={`w-full h-full ${borderRadius} bg-card flex items-center justify-center text-xl`}>
          {user?.emoji || '👤'}
        </div>
      )}

      {showStatus && user?.status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusColor[user.status] || 'bg-white/20'}`}
        />
      )}
    </div>
  )
}

export default Avatar
