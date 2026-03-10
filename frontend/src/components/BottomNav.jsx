import React, { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { getFrenRequests } from '../lib/api'
import { useStore } from '../store/useStore'

const BottomNav = () => {
  const { pendingRequestCount, setPendingRequestCount, activeFab } = useStore()

  const fetchRequestCount = async () => {
    try {
      const res = await getFrenRequests()
      setPendingRequestCount(res.data.incoming?.length || 0)
    } catch (err) {
      // silently fail — user may not be authed yet
    }
  }

  useEffect(() => {
    fetchRequestCount()
    const interval = setInterval(fetchRequestCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const items = [
    { path: '/', label: 'Feed', icon: '🏠' },
    { path: '/nearby', label: 'Nearby', icon: '📍' },
    { path: '/new', label: '+', isFab: true },
    { path: '/frens', label: 'Frens', icon: '👥', badge: pendingRequestCount },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2 safe-bottom">
      <div className="max-w-md mx-auto glass rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl relative">
        {items.map((item) => (
          item.isFab ? (
            activeFab ? (
              activeFab.path ? (
                <NavLink
                  key="active-fab"
                  to={activeFab.path}
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br shadow-lg -translate-y-8 active:scale-90 transition-all duration-300 from-primary-blue to-blue-400 shadow-primary-blue/30"
                >
                  <span className="text-background -ml-0.5">{activeFab.icon}</span>
                </NavLink>
              ) : (
                <button
                  key="active-fab"
                  onClick={activeFab.onClick}
                  className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br shadow-lg -translate-y-8 active:scale-90 transition-all duration-300 from-primary-green to-[#4caf50] shadow-primary-green/30"
                >
                  <span className="text-background">{activeFab.icon}</span>
                </button>
              )
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl
                  bg-gradient-to-br from-primary-red to-primary-yellow shadow-lg shadow-primary-red/30
                  -translate-y-8 active:scale-90 transition-all duration-300
                  ${isActive ? 'scale-110' : ''}
                `}
              >
                <span className="text-background font-black mb-1">+</span>
              </NavLink>
            )
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-primary-red/10 text-primary-red scale-110' : 'text-white/30'}
              `}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-red rounded-full text-background text-[9px] font-black flex items-center justify-center border-2 border-background animate-in zoom-in duration-300">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </NavLink>
          )
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
