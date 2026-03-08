import React from 'react'
import { NavLink } from 'react-router-dom'

const BottomNav = () => {
  const items = [
    { path: '/', label: 'Feed', icon: '🏠' },
    { path: '/nearby', label: 'Nearby', icon: '📍' },
    { path: '/new', label: '+', isFab: true },
    { path: '/frens', label: 'Frens', icon: '👥' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-6 pt-2 safe-bottom">
      <div className="max-w-md mx-auto glass rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl relative">
        {items.map((item) => (
          item.isFab ? (
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
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300
                ${isActive ? 'bg-primary-red/10 text-primary-red scale-110' : 'text-white/30'}
              `}
            >
              <span className="text-xl mb-0.5">{item.icon}</span>
              {/* <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span> */}
            </NavLink>
          )
        ))}
      </div>
    </nav>
  )
}

export default BottomNav
