import React, { useEffect } from 'react'

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    // Auto dismiss after 2.5 seconds as requested
    const timer = setTimeout(onClose, 2500)
    return () => clearTimeout(timer)
  }, [onClose])

  const emojis = {
    success: '✅',
    error: '😬',
    info: '✨'
  }

  const borderColors = {
    success: 'border-primary-green/30',
    error: 'border-primary-red/30',
    info: 'border-primary-purple/30'
  }

  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 fade-in duration-500`}>
      <div className={`bg-[#16131f] border ${borderColors[type]} text-white px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-xl`}>
        <span className="text-lg">{emojis[type]}</span>
        <span className="text-sm font-bold tracking-tight whitespace-nowrap">{message}</span>
      </div>
    </div>
  )
}

export default Toast
