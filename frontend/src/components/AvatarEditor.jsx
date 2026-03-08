import React, { useState } from 'react'
import { buildAvatarUrl } from '../lib/avatar'

const SKIN_COLORS = [
  { label: 'Light',      value: 'ffdbb4' },
  { label: 'Tan',        value: 'f8d25c' },
  { label: 'Yellow',     value: 'edb98a' },
  { label: 'Brown',      value: 'd08b5b' },
  { label: 'Dark Brown', value: 'ae5d29' },
  { label: 'Black',      value: '614335' },
]
const HAIR_STYLES_MALE = [
  { label: 'Short Flat',  value: 'shortHairShortFlat'   },
  { label: 'Short Round', value: 'shortHairShortRound'  },
  { label: 'Caesar',      value: 'shortHairTheCaesar'   },
  { label: 'Dreads',      value: 'shortHairDreadsO1'    },
  { label: 'Frizzle',     value: 'shortHairFrizzle'     },
  { label: 'Shaggy',      value: 'shortHairShaggyMullet'},
]
const HAIR_STYLES_FEMALE = [
  { label: 'Long',     value: 'longHairStraight' },
  { label: 'Curly',   value: 'longHairCurly'    },
  { label: 'Bob',     value: 'longHairBob'      },
  { label: 'Big',     value: 'longHairBigHair'  },
  { label: 'Bun',     value: 'longHairBun'      },
  { label: 'Dreads',  value: 'longHairDreads'   },
]
const HAIR_COLORS = [
  { label: 'Black',    value: '2c1b18' },
  { label: 'Brown',    value: 'a55728' },
  { label: 'Auburn',   value: 'b58143' },
  { label: 'Blonde',   value: 'f59797' },
  { label: 'Platinum', value: 'ecdcbf' },
  { label: 'Red',      value: 'c93305' },
  { label: 'Silver',   value: '9b9b9b' },
  { label: 'Pink',     value: 'ff488e' },
  { label: 'Blue',     value: '4d96ff' },
  { label: 'Purple',   value: 'c77dff' },
]
const CLOTHING_COLORS = [
  { label: 'Red',    value: 'ff6b6b' },
  { label: 'Blue',   value: '4d96ff' },
  { label: 'Green',  value: '6bcb77' },
  { label: 'Purple', value: 'c77dff' },
  { label: 'Yellow', value: 'ffd93d' },
  { label: 'Black',  value: '262e33' },
  { label: 'White',  value: 'e6e6e6' },
  { label: 'Pink',   value: 'ff488e' },
]
const ACCESSORIES = [
  { label: 'None',        value: 'none'           },
  { label: 'Glasses',     value: 'prescription01' },
  { label: 'Sunglasses',  value: 'sunglasses'     },
  { label: 'Round',       value: 'round'          },
  { label: 'Kurt',        value: 'kurt'           },
  { label: 'Wayfarers',   value: 'wayfarers'      },
]
const EYE_TYPES = [
  { label: 'Default', value: 'default' },
  { label: 'Happy',   value: 'happy'   },
  { label: 'Side',    value: 'side'    },
  { label: 'Squint',  value: 'squint'  },
  { label: 'Wink',    value: 'wink'    },
  { label: 'Stars',   value: 'stars'   },
]
const MOUTH_TYPES = [
  { label: 'Smile',    value: 'smile'   },
  { label: 'Default',  value: 'default' },
  { label: 'Serious',  value: 'serious' },
  { label: 'Tongue',   value: 'tongue'  },
  { label: 'Twinkle',  value: 'twinkle' },
  { label: 'Sad',      value: 'sad'     },
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
            : 'bg-white/5 text-white/50 border-white/10 hover:opacity-80'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
)

const AvatarEditor = ({ user, onSave, onClose }) => {
  const [cfg, setCfg] = useState({
    skinColor:     user?.avatar_config?.skinColor     || 'f8d25c',
    hairStyle:     user?.avatar_config?.hairStyle     || 'shortHairShortFlat',
    hairColor:     user?.avatar_config?.hairColor     || 'a55728',
    facialHair:    user?.avatar_config?.facialHair    || 'none',
    accessories:   user?.avatar_config?.accessories   || 'none',
    clothingColor: user?.avatar_config?.clothingColor || 'ff6b6b',
    eyeType:       user?.avatar_config?.eyeType       || 'default',
    mouthType:     user?.avatar_config?.mouthType     || 'smile',
    gender:        user?.avatar_config?.gender        || 'male',
  })
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setCfg(p => ({ ...p, [key]: val }))

  const hairStyles = cfg.gender === 'female' ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE
  const previewUrl = buildAvatarUrl(user?.name || 'preview', cfg)

  const handleGender = (g) => {
    set('gender', g)
    set('hairStyle', g === 'female' ? 'longHairStraight' : 'shortHairShortFlat')
  }

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

          <Section title="Gender Style">
            <div className="flex gap-2">
              {[['male','👦 Male'],['female','👧 Female'],['nonbinary','🧑 Fluid']].map(([g, label]) => (
                <button
                  key={g}
                  onClick={() => handleGender(g)}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold border transition-all ${cfg.gender === g ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-white/40'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Skin Tone">
            <ColorRow colors={SKIN_COLORS} selected={cfg.skinColor} onSelect={v => set('skinColor', v)} />
          </Section>

          <Section title="Hair Style">
            <OptionRow options={hairStyles} selected={cfg.hairStyle} onSelect={v => set('hairStyle', v)} />
          </Section>

          <Section title="Hair Colour">
            <ColorRow colors={HAIR_COLORS} selected={cfg.hairColor} onSelect={v => set('hairColor', v)} />
          </Section>

          <Section title="Eyes">
            <OptionRow options={EYE_TYPES} selected={cfg.eyeType} onSelect={v => set('eyeType', v)} />
          </Section>

          <Section title="Mouth">
            <OptionRow options={MOUTH_TYPES} selected={cfg.mouthType} onSelect={v => set('mouthType', v)} />
          </Section>

          <Section title="Accessories">
            <OptionRow options={ACCESSORIES} selected={cfg.accessories} onSelect={v => set('accessories', v)} />
          </Section>

          <Section title="Outfit Colour">
            <ColorRow colors={CLOTHING_COLORS} selected={cfg.clothingColor} onSelect={v => set('clothingColor', v)} />
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
