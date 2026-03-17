import React, { useState, useEffect } from 'react'

const CountdownTimer = ({ targetDate, style = {} }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft('')
      return
    }

    const calculateTimeLeft = () => {
      const now = new Date()
      const target = new Date(targetDate)
      const diff = target - now

      if (diff <= 0) {
        // If it started less than 24 hours ago, show "Started X ago"
        // Otherwise don't show anything (it's a past event)
        const absDiff = Math.abs(diff)
        if (absDiff < 24 * 60 * 60 * 1000) {
          const hours = Math.floor(absDiff / (1000 * 60 * 60))
          const mins = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))
          if (hours > 0) return `Started ${hours}h ${mins}m ago`
          if (mins > 0) return `Started ${mins}m ago`
          return 'Starts now'
        }
        return ''
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (days > 0) return `in ${days}d ${hours}h`
      if (hours > 0) return `in ${hours}h ${mins}m`
      return `in ${mins}m`
    }

    setTimeLeft(calculateTimeLeft())
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [targetDate])

  if (!timeLeft) return null

  return (
    <span
      style={{
        fontFamily: 'DM Sans, sans-serif',
        fontSize: 11,
        fontWeight: 600,
        color: timeLeft.startsWith('in') ? '#4caf7d' : '#666666',
        background: timeLeft.startsWith('in') ? 'rgba(76,175,125,0.1)' : 'rgba(255,255,255,0.05)',
        padding: '2px 8px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {timeLeft}
    </span>
  )
}

export default CountdownTimer
