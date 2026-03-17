import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { getFrenRequests } from '../lib/api'
import { useStore } from '../store/useStore'

// Simple SVG icons to avoid needing phosphor-react install
const Icons = {
  House: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  Users: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 20c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 20c0-2.761-1.791-5-4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  Plus: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path d="M12 21s-7-6.895-7-11a7 7 0 1114 0c0 4.105-7 11-7 11z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  User: () => (
    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
}

const BottomNav = () => {
  const { user, pendingRequestCount, setPendingRequestCount, activeFab, setAuthPrompt } = useStore()

  const fetchRequestCount = async () => {
    try {
      const res = await getFrenRequests()
      setPendingRequestCount(res.data.incoming?.length || 0)
    } catch {}
  }

  useEffect(() => {
    fetchRequestCount()
    const interval = setInterval(fetchRequestCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { path: '/', label: 'Home', Icon: Icons.House, feature: 'default' },
    { path: '/frens', label: 'Frens', Icon: Icons.Users, badge: pendingRequestCount, feature: 'add-fren' },
    { path: '/new', label: null, Icon: Icons.Plus, isFab: true, feature: 'create-hangout' },
    { path: '/nearby', label: 'Nearby', Icon: Icons.MapPin, feature: 'nearby' },
    { path: '/profile', label: 'Me', Icon: Icons.User, feature: 'profile' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{
        height: 64,
        background: '#111111',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div
        className="max-w-md mx-auto h-full flex items-center justify-around"
        style={{ paddingLeft: 8, paddingRight: 8 }}
      >
        {tabs.map((tab) => {
          const handleClick = (e) => {
            if (user?.isGuest) {
              e.preventDefault()
              setAuthPrompt(tab.feature)
              return
            }
            if (tab.isFab && activeFab?.onClick) {
              activeFab.onClick(e)
            }
          }

          if (tab.isFab) {
            // Center FAB — slightly elevated
            const fabTarget = activeFab ?? tab
            return (
              <NavLink
                key={tab.path}
                to={fabTarget.path || tab.path}
                onClick={handleClick}
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 48, height: 48, borderRadius: 12, background: '#f5f5f5', color: '#0a0a0a' }}
              >
                <tab.Icon />
              </NavLink>
            )
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              onClick={handleClick}
              className="relative flex-shrink-0"
              style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator — 2px line above */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 16,
                        height: 2,
                        borderRadius: 1,
                        background: '#f5f5f5',
                      }}
                    />
                  )}
                  <div style={{ color: isActive ? '#f5f5f5' : '#3a3a3a', position: 'relative' }}>
                    <tab.Icon />
                    {tab.badge > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: '#ff4d4d',
                          border: '2px solid #111111',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          fontWeight: 600,
                          color: '#fff',
                        }}
                      >
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </div>
                    )}
                  </div>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
