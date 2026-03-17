import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Lock, Check } from 'phosphor-react'
import BottomSheet from './BottomSheet'
import { buildAvatarUrl } from '../lib/avatar'

const FEATURE_COPY = {
  'create-hangout': {
    title: 'Plan your own hangout',
    subtitle: 'Create hangouts, invite frens, and coordinate plans.'
  },
  'add-fren': {
    title: 'Connect with frens',
    subtitle: 'Add frens to see when they\'re free and plan hangouts.'
  },
  'nearby': {
    title: 'See who\'s nearby',
    subtitle: 'Find out when your frens are free and close by.'
  },
  'notifications': {
    title: 'Stay in the loop',
    subtitle: 'Get notified when plans change or frens RSVP.'
  },
  'profile': {
    title: 'Make it yours',
    subtitle: 'Set up your profile, pick an avatar, and track hangouts.'
  },
  'default': {
    title: 'Join Frens',
    subtitle: 'Create an account to unlock everything.'
  }
}

const PERKS = [
  'Create and join hangouts',
  'See when frens are free',
  'Live nearby map',
  'Custom avatar',
  'Hangout history and streaks'
]

const AuthPromptSheet = ({ isOpen, onClose, feature }) => {
  const navigate = useNavigate()
  const { user } = useStore()
  const copy = FEATURE_COPY[feature] || FEATURE_COPY['default']

  // Don't show same prompt twice per session
  const shownKey = 'frens_shown_prompts'
  const shown = JSON.parse(sessionStorage.getItem(shownKey) || '[]')
  if (isOpen && feature && !shown.includes(feature)) {
    sessionStorage.setItem(shownKey, JSON.stringify([...shown, feature]))
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="px-6 pb-10 pt-2 flex flex-col items-center text-center gap-5">

        {/* Guest avatar with lock badge */}
        <div className="relative mt-2">
          <img
            src={buildAvatarUrl(user?.name || 'you', user?.avatar_config || {})}
            className="w-20 h-20 rounded-3xl"
            style={{ background: '#1a1a1a' }}
          />
          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full
            flex items-center justify-center"
            style={{ 
              background: '#0a0a0a', 
              border: '2px solid #1a1a1a' 
            }}>
            <Lock size={13} color="#666666" />
          </div>
        </div>

        {/* Copy */}
        <div>
          <h3 className="text-xl font-bold mb-1.5"
            style={{ fontFamily: 'Syne', color: '#f5f5f5' }}>
            {copy.title}
          </h3>
          <p className="text-sm leading-relaxed"
            style={{ color: '#666666', fontFamily: 'DM Sans' }}>
            {copy.subtitle}
          </p>
        </div>

        {/* Perks list */}
        <div className="w-full rounded-2xl p-4 space-y-3 text-left"
          style={{ 
            background: '#111111', 
            border: '1px solid rgba(255,255,255,0.07)' 
          }}>
          {PERKS.map(perk => (
            <div key={perk} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center 
                justify-center flex-shrink-0"
                style={{ background: 'rgba(76,175,125,0.12)' }}>
                <Check size={11} color="#4caf7d" weight="bold" />
              </div>
              <span className="text-sm"
                style={{ color: '#f5f5f5', fontFamily: 'DM Sans' }}>
                {perk}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full space-y-3">
          <button
            onClick={() => {
              onClose()
              navigate('/onboarding?signup=true&name=' +
                encodeURIComponent(user?.name || ''))
            }}
            className="w-full rounded-xl font-semibold text-base
              active:scale-97 transition-transform"
            style={{
              background: '#f5f5f5',
              color: '#0a0a0a',
              fontFamily: 'DM Sans',
              height: 52
            }}>
            Create free account
          </button>

          <button
            onClick={() => {
              onClose()
              navigate('/onboarding')
            }}
            className="w-full rounded-xl font-semibold text-sm"
            style={{
              background: 'transparent',
              color: '#666666',
              fontFamily: 'DM Sans',
              height: 44
            }}>
            Already have an account? Sign in
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs"
          style={{ color: '#3a3a3a', fontFamily: 'DM Sans' }}>
          Maybe later
        </button>

      </div>
    </BottomSheet>
  )
}

export default AuthPromptSheet
