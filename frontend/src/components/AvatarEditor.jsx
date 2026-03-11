import React, { useState } from 'react'
import { buildAvatarUrl, AVATAR_STYLES, STYLE_OPTIONS } from '../lib/avatar'
import BottomSheet from './BottomSheet'

const AvatarEditor = ({ user, onSave, onClose }) => {
  const [selectedStyle, setSelectedStyle] = useState(
    user?.avatar_config?.style || 'avataaars'
  )
  const [localConfig, setLocalConfig] = useState(user?.avatar_config || { style: 'avataaars' })
  const [seed, setSeed] = useState(user?.name || 'you')

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
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl active:scale-95 transition-all"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              🎲
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
                  ? 'rgba(255,107,107,0.15)' 
                  : 'rgba(255,255,255,0.05)',
                border: selectedStyle === s.id
                  ? '2px solid #ff6b6b'
                  : '2px solid transparent',
                minWidth: 72
              }}>
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-[10px] font-black uppercase tracking-wide"
                style={{ color: selectedStyle === s.id ? '#ff6b6b' : 'rgba(255,255,255,0.4)' }}>
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
                          ? '#ff6b6b' 
                          : 'rgba(255,255,255,0.07)',
                        color: localConfig[key] === val 
                          ? '#fff' 
                          : 'rgba(255,255,255,0.4)',
                        border: localConfig[key] === val
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.08)'
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
        <div className="px-6 pb-8 pt-2 flex-shrink-0">
          <button
            onClick={() => onSave({ ...localConfig, style: selectedStyle })}
            className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all shadow-lg"
            style={{ background: '#ff6b6b', color: '#fff', boxShadow: '0 4px 20px rgba(255,107,107,0.3)' }}>
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
