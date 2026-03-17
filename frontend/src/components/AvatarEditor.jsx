import React, { useState } from 'react'
import { buildAvatarUrl, AVATAR_STYLES, STYLE_OPTIONS } from '../lib/avatar'
import BottomSheet from './BottomSheet'

const AvatarEditor = ({ user, onSave, onClose }) => {
  const [selectedStyle, setSelectedStyle] = useState(
    user?.avatar_config?.style || 'adventurer'
  )
  const [localConfig, setLocalConfig] = useState(user?.avatar_config || { style: 'adventurer' })
  const [seed, setSeed] = useState(user?.avatar_config?.seed || user?.name || 'you')

  const updateConfig = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value, style: selectedStyle }))
  }

  const handleStyleChange = (styleId) => {
    setSelectedStyle(styleId)
    // Reset to just style, keep nothing else (fresh start for new style)
    setLocalConfig({ style: styleId })
  }

  const handleRandomise = () => {
    setSeed(Math.random().toString(36).substring(7))
    // Also randomise all options for current style
    const options = STYLE_OPTIONS[selectedStyle] || {}
    const randomConfig = { style: selectedStyle }
    Object.entries(options).forEach(([key, option]) => {
      const values = option.values
      randomConfig[key] = values[Math.floor(Math.random() * values.length)]
    })
    setLocalConfig(randomConfig)
  }

  const currentOptions = STYLE_OPTIONS[selectedStyle] || {}

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Your Avatar">
      <div className="flex flex-col max-h-[75vh]">
        {/* Preview + randomise */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex-1" />
          <img
            src={buildAvatarUrl(seed, localConfig)}
            alt="Avatar Preview"
            className="w-24 h-24 rounded-3xl"
            style={{ background: '#1d1928' }}
          />
          <div className="flex-1 flex justify-end">
            <button onClick={handleRandomise}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                background: '#111111',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#666666',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}>
              Randomize
            </button>
          </div>
        </div>

        {/* Style picker */}
        <div className="flex gap-3 overflow-x-auto pb-3 px-6 hide-scrollbar flex-shrink-0">
          {AVATAR_STYLES.map(s => (
            <button key={s.id}
              onClick={() => handleStyleChange(s.id)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all"
              style={{
                background: selectedStyle === s.id 
                  ? '#1a1a1a' 
                  : '#111111',
                border: selectedStyle === s.id
                  ? '1px solid rgba(255,255,255,0.2)'
                  : '1px solid rgba(255,255,255,0.07)',
                minWidth: 80
              }}>
              <span className="text-[10px] font-black uppercase tracking-wide"
                style={{ color: selectedStyle === s.id ? '#f5f5f5' : '#666666' }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        <div className="h-px mx-6" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* Options for current style */}
        <div className="px-6 pt-4 pb-6 space-y-6 overflow-y-auto no-scrollbar">
          {Object.entries(currentOptions).map(([key, option]) => (
            <div key={key}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ color: 'rgba(255,255,255,0.3)' }}>
                {option.label}
              </p>
              
              {option.type === 'swatch' ? (
                <div className="flex flex-wrap gap-2.5">
                  {option.values.map(hex => (
                    <button key={hex}
                      onClick={() => updateConfig(key, hex)}
                      className="w-8 h-8 rounded-full transition-all active:scale-90"
                      style={{
                        background: hex === 'transparent' ? 'transparent' : `#${hex}`,
                        border: localConfig[key] === hex 
                          ? '3px solid white' 
                          : '2px solid rgba(255,255,255,0.1)',
                        boxShadow: localConfig[key] === hex 
                          ? '0 0 0 2px #ff6b6b' 
                          : 'none',
                        backgroundImage: hex === 'transparent' 
                          ? 'repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 0 0 / 8px 8px'
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {option.values.map(val => (
                    <button key={val}
                      onClick={() => updateConfig(key, val)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap"
                      style={{
                        background: localConfig[key] === val 
                          ? '#f5f5f5' 
                          : '#1a1a1a',
                        color: localConfig[key] === val 
                          ? '#0a0a0a' 
                          : '#666666',
                        border: localConfig[key] === val
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.07)'
                      }}>
                      {val === 'none' ? 'None' : val.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="px-6 pb-8 pt-4 flex-shrink-0">
          <button
            onClick={() => onSave({ ...localConfig, style: selectedStyle, seed })}
            className="btn-primary"
            style={{ width: '100%', height: 56 }}
          >
            Save Avatar
          </button>
        </div>
      </div>

      <style>{`
        .hide-scrollbar { scrollbar-width: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </BottomSheet>
  )
}

export default AvatarEditor
