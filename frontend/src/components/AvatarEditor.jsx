import React, { useState } from 'react'
import { buildAvatarUrl } from '../lib/avatar'

const SKIN_COLORS = [
  { label: 'Light',      value: 'ffdbb4' },
  { label: 'Peach',      value: 'f2d3b1' },
  { label: 'Tan',        value: 'ecad80' },
  { label: 'Brown',      value: 'd08b5b' },
  { label: 'Dark',       value: 'ae5d29' },
  { label: 'Deep',       value: '614335' },
]

const HAIR_STYLES = [
  { label: 'Short 1',  value: 'short01' },
  { label: 'Short 2',  value: 'short02' },
  { label: 'Short 3',  value: 'short03' },
  { label: 'Short 4',  value: 'short04' },
  { label: 'Short 5',  value: 'short05' },
  { label: 'Long 1',   value: 'long01'  },
  { label: 'Long 2',   value: 'long02'  },
  { label: 'Long 3',   value: 'long03'  },
  { label: 'Long 4',   value: 'long04'  },
  { label: 'Long 5',   value: 'long05'  },
  { label: 'Long 6',   value: 'long06'  },
  { label: 'Long 7',   value: 'long07'  },
]

const HAIR_COLORS = [
  { label: 'Black',    value: '2c1b18' },
  { label: 'Brown',    value: 'ac6651' },
  { label: 'Auburn',   value: 'b58143' },
  { label: 'Blonde',   value: 'e8c93a' },
  { label: 'Platinum', value: 'ecdcbf' },
  { label: 'Red',      value: 'c93305' },
  { label: 'Silver',   value: '9b9b9b' },
  { label: 'Pink',     value: 'ff488e' },
  { label: 'Blue',     value: '4d96ff' },
  { label: 'Purple',   value: 'c77dff' },
]

const EYES = [
  { label: 'Style 1',  value: 'variant01' },
  { label: 'Style 2',  value: 'variant02' },
  { label: 'Style 3',  value: 'variant03' },
  { label: 'Style 4',  value: 'variant04' },
  { label: 'Style 5',  value: 'variant05' },
  { label: 'Style 6',  value: 'variant06' },
  { label: 'Style 7',  value: 'variant07' },
  { label: 'Style 8',  value: 'variant08' },
  { label: 'Style 9',  value: 'variant09' },
  { label: 'Style 10', value: 'variant10' },
  { label: 'Style 11', value: 'variant11' },
  { label: 'Style 12', value: 'variant12' },
  { label: 'Style 13', value: 'variant13' },
  { label: 'Style 17', value: 'variant17' },
  { label: 'Style 26', value: 'variant26' },
]

const EYEBROWS = [
  { label: 'Style 1',  value: 'variant01' },
  { label: 'Style 2',  value: 'variant02' },
  { label: 'Style 3',  value: 'variant03' },
  { label: 'Style 4',  value: 'variant04' },
  { label: 'Style 5',  value: 'variant05' },
  { label: 'Style 6',  value: 'variant06' },
  { label: 'Style 7',  value: 'variant07' },
  { label: 'Style 8',  value: 'variant08' },
  { label: 'Style 9',  value: 'variant09' },
  { label: 'Style 10', value: 'variant10' },
]

const MOUTHS = [
  { label: 'Style 1',  value: 'variant01' },
  { label: 'Style 2',  value: 'variant02' },
  { label: 'Style 3',  value: 'variant03' },
  { label: 'Style 4',  value: 'variant04' },
  { label: 'Style 5',  value: 'variant05' },
  { label: 'Style 6',  value: 'variant06' },
  { label: 'Style 7',  value: 'variant07' },
  { label: 'Style 8',  value: 'variant08' },
  { label: 'Style 9',  value: 'variant09' },
  { label: 'Style 10', value: 'variant10' },
  { label: 'Style 11', value: 'variant11' },
  { label: 'Style 12', value: 'variant12' },
]

const GLASSES = [
  { label: 'None',      value: 'none'      },
  { label: 'Style 1',   value: 'variant01' },
  { label: 'Style 2',   value: 'variant02' },
  { label: 'Style 3',   value: 'variant03' },
  { label: 'Style 4',   value: 'variant04' },
  { label: 'Style 5',   value: 'variant05' },
]

const EARRINGS = [
  { label: 'None',      value: 'none'      },
  { label: 'Style 1',   value: 'variant01' },
  { label: 'Style 2',   value: 'variant02' },
  { label: 'Style 3',   value: 'variant03' },
  { label: 'Style 4',   value: 'variant04' },
  { label: 'Style 5',   value: 'variant05' },
]

const Section = ({ title, children }) => (
  <div className="mb-6">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-3 px-1">{title}</p>
    {children}
  </div>
)

const ColorRow = ({ colors, selected, onSelect }) => (
  <div className="flex gap-2 flex-wrap">
    {colors.map(c => (
      <button
        key={c.value}
        onClick={() => onSelect(c.value)}
        title={c.label}
        className="w-8 h-8 rounded-full border-2 transition-all"
        style={{
          background: `#${c.value}`,
          borderColor: selected === c.value ? '#fff' : 'transparent',
          boxShadow: selected === c.value ? `0 0 8px #${c.value}88` : 'none',
          transform: selected === c.value ? 'scale(1.2)' : 'scale(1)',
        }}
      />
    ))}
  </div>
)

const OptionRow = ({ options, selected, onSelect }) => (
  <div className="flex gap-2 flex-wrap">
    {options.map(o => (
      <button
        key={o.value}
        onClick={() => onSelect(o.value)}
        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
          selected === o.value
            ? 'bg-white text-black border-white'
            : 'bg-white/5 text-white/50 border-white/10'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
)

const AvatarEditor = ({ user, onSave, onClose }) => {
  const [cfg, setCfg] = useState({
    skinColor:  user?.avatar_config?.skinColor  || 'f2d3b1',
    hair:       user?.avatar_config?.hair       || 'short01',
    hairColor:  user?.avatar_config?.hairColor  || 'ac6651',
    eyes:       user?.avatar_config?.eyes       || 'variant01',
    eyebrows:   user?.avatar_config?.eyebrows   || 'variant01',
    mouth:      user?.avatar_config?.mouth      || 'variant01',
    glasses:    user?.avatar_config?.glasses    || 'none',
    earrings:   user?.avatar_config?.earrings   || 'none',
    features:   user?.avatar_config?.features   || 'none',
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setCfg(p => ({ ...p, [key]: val }))

  const previewUrl = buildAvatarUrl(user?.name || 'preview', cfg)

  const handleSave = async () => {
    setSaving(true)
    await onSave(cfg)
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-h-[90vh] overflow-y-auto no-scrollbar"
        style={{ background: '#16131f', borderTop: '1px solid rgba(255,255,255,0.08)', borderRadius: '2rem 2rem 0 0' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Sticky header with live preview */}
        <div
          className="flex items-center gap-4 px-5 py-4 sticky top-0 z-10"
          style={{ background: '#16131f', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <img
            src={previewUrl}
            alt="preview"
            className="w-20 h-20 rounded-full flex-shrink-0"
            style={{ background: '#1d1928', border: '3px solid #ff6b6b', boxShadow: '0 0 24px rgba(255,107,107,0.3)' }}
          />
          <div className="flex-1">
            <h2 className="font-display font-black text-xl italic">Your Vibe ✨</h2>
            <p className="text-[10px] opacity-30 mt-0.5 uppercase font-black tracking-widest">Customise your avatar</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Editor sections */}
        <div className="px-5 py-5">

          <Section title="Skin Tone">
            <ColorRow colors={SKIN_COLORS} selected={cfg.skinColor} onSelect={v => set('skinColor', v)} />
          </Section>

          <Section title="Hair Style">
            <OptionRow options={HAIR_STYLES} selected={cfg.hair} onSelect={v => set('hair', v)} />
          </Section>

          <Section title="Hair Colour">
            <ColorRow colors={HAIR_COLORS} selected={cfg.hairColor} onSelect={v => set('hairColor', v)} />
          </Section>

          <Section title="Eyes">
            <OptionRow options={EYES} selected={cfg.eyes} onSelect={v => set('eyes', v)} />
          </Section>

          <Section title="Eyebrows">
            <OptionRow options={EYEBROWS} selected={cfg.eyebrows} onSelect={v => set('eyebrows', v)} />
          </Section>

          <Section title="Mouth">
            <OptionRow options={MOUTHS} selected={cfg.mouth} onSelect={v => set('mouth', v)} />
          </Section>

          <Section title="Glasses">
            <OptionRow options={GLASSES} selected={cfg.glasses} onSelect={v => set('glasses', v)} />
          </Section>

          <Section title="Earrings">
            <OptionRow options={EARRINGS} selected={cfg.earrings} onSelect={v => set('earrings', v)} />
          </Section>

        </div>

        {/* Sticky save button */}
        <div
          className="px-5 pb-10 pt-3 sticky bottom-0"
          style={{ background: '#16131f', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-display font-black text-base transition-all"
            style={{
              background: saving ? 'rgba(255,107,107,0.3)' : 'linear-gradient(135deg,#ff6b6b,#ff8e53)',
              color: saving ? 'rgba(255,255,255,0.4)' : '#fff',
              boxShadow: saving ? 'none' : '0 8px 24px rgba(255,107,107,0.3)',
            }}
          >
            {saving ? 'Saving...' : 'Save Avatar ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AvatarEditor
