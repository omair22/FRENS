import React, { useState, useEffect, useRef } from 'react'

const RangeSlider = ({ minTime, maxTime, defaultStart, defaultEnd, onChange }) => {
  const sliderRef = useRef(null)
  
  // Calculate total duration in ms
  const minMs = new Date(minTime).getTime()
  let maxMs = new Date(maxTime).getTime()
  
  // Fallback: if no maxTime or maxTime is invalid, set a 6-hour window
  if (!maxTime || isNaN(maxMs)) {
    maxMs = minMs + (6 * 60 * 60 * 1000)
  }
  
  const totalDuration = maxMs - minMs

  // Initialize values
  const initStart = defaultStart ? new Date(defaultStart).getTime() : minMs
  const initEnd = defaultEnd ? new Date(defaultEnd).getTime() : maxMs

  // Use percentages (0 to 100) for slider thumb positions
  const valToPct = (val) => Math.max(0, Math.min(100, ((val - minMs) / totalDuration) * 100))
  const pctToVal = (pct) => minMs + ((pct / 100) * totalDuration)

  const [startPct, setStartPct] = useState(valToPct(initStart))
  const [endPct, setEndPct] = useState(valToPct(initEnd))
  const [isDragging, setIsDragging] = useState(null) // 'start' | 'end' | null

  // Broadcast changes on mouse/touch up, not every frame to prevent spamming state
  useEffect(() => {
    if (!isDragging) {
      if (onChange) {
        onChange({
          arriving_at: new Date(pctToVal(startPct)).toISOString(),
          leaving_at: new Date(pctToVal(endPct)).toISOString()
        })
      }
    }
  }, [isDragging])

  // Map pointer move to percentage
  const handleMove = (clientX) => {
    if (!isDragging || !sliderRef.current) return
    
    const rect = sliderRef.current.getBoundingClientRect()
    // Calculate percentage relative to slider width, bound between 0 and 100
    let newPct = ((clientX - rect.left) / rect.width) * 100
    newPct = Math.max(0, Math.min(100, newPct))

    // Minimum gap (e.g. 5% = roughly 15 mins depending on duration)
    const minGap = 5 

    if (isDragging === 'start') {
      const clamped = Math.min(newPct, endPct - minGap)
      setStartPct(clamped)
    } else if (isDragging === 'end') {
      const clamped = Math.max(newPct, startPct + minGap)
      setEndPct(clamped)
    }
  }

  // Mouse / Touch Event listeners
  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX)
    const onTouchMove = (e) => handleMove(e.touches[0].clientX)
    
    const onEnd = () => setIsDragging(null)

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('touchmove', onTouchMove, { passive: false })
      window.addEventListener('mouseup', onEnd)
      window.addEventListener('touchend', onEnd)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', onEnd)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDragging, startPct, endPct])

  // Format Helper
  const formatTime = (ms) => {
    return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  const startValue = pctToVal(startPct)
  const endValue = pctToVal(endPct)

  return (
    <div className="py-2 select-none touch-none">
      {/* Header Info */}
      <div className="flex justify-between items-end mb-4 px-1">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-yellow/70 block mb-0.5">Arriving</span>
          <span className="text-sm font-bold text-white">{formatTime(startValue)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary-red/70 block mb-0.5">Leaving</span>
          <span className="text-sm font-bold text-white">{formatTime(endValue)}</span>
        </div>
      </div>

      {/* Slider Track */}
      <div 
        ref={sliderRef}
        className="relative h-12 bg-white/5 border border-white/10 rounded-2xl mx-1"
      >
        {/* Active Range Fill */}
        <div 
          className="absolute top-0 bottom-0 pointer-events-none rounded-2xl bg-gradient-to-r from-primary-yellow/20 to-primary-red/20 border border-t-white/10 border-b-black/50"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Start Thumb */}
        <div
          onMouseDown={() => setIsDragging('start')}
          onTouchStart={() => setIsDragging('start')}
          className="absolute top-2 bottom-2 w-8 -ml-4 bg-primary-yellow rounded-xl shadow-[0_0_15px_rgba(255,217,61,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
          style={{ left: `${startPct}%` }}
        >
          <div className="w-1 h-3 rounded-full bg-background/50" />
        </div>

        {/* End Thumb */}
        <div
          onMouseDown={() => setIsDragging('end')}
          onTouchStart={() => setIsDragging('end')}
          className="absolute top-2 bottom-2 w-8 -ml-4 bg-primary-red rounded-xl shadow-[0_0_15px_rgba(255,107,107,0.5)] cursor-grab active:cursor-grabbing flex items-center justify-center z-10"
          style={{ left: `${endPct}%` }}
        >
          <div className="w-1 h-3 rounded-full bg-background/50" />
        </div>
      </div>
    </div>
  )
}

export default RangeSlider
