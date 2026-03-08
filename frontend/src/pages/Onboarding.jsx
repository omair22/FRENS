import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { updateProfile } from '../lib/api'
import { AVATAR_STYLES, getAvatarUrl } from '../lib/avatar'

const Onboarding = () => {
  const [step, setStep] = useState(1)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatarStyle, setAvatarStyle] = useState('adventurer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [authUserId, setAuthUserId] = useState(null)

  const navigate = useNavigate()
  const setUser = useStore(state => state.setUser)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let result
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signUp({ email, password })
      }

      if (result.error) throw result.error

      setAuthUserId(result.data.user.id)

      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', result.data.user.id)
        .maybeSingle()

      if (userProfile && userProfile.name) {
        setUser(result.data.user)
        navigate('/')
      } else {
        setStep(3)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await updateProfile(name, avatarStyle)
      setUser(res.data)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Preview URL using a placeholder ID during onboarding
  const previewUrl = (style) =>
    `https://api.dicebear.com/7.x/${style}/svg?seed=${authUserId || 'preview'}&size=160&backgroundColor=transparent`

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-display font-black leading-tight italic">
              get in here <br/> bestie 💅
            </h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setIsLogin(true); setStep(2); }} className="w-full btn-primary bg-primary-red text-background">
                Sign In
              </button>
              <button onClick={() => { setIsLogin(false); setStep(2); }} className="w-full btn-primary bg-white/5 text-white/60 border border-white/5">
                New Account
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <form onSubmit={handleAuth} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-display font-black leading-tight italic">
              {isLogin ? 'welcome back ✨' : 'let\'s start 🚀'}
            </h2>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email address"
                className="input-frens"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="input-frens"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button disabled={loading} className="w-full btn-primary bg-primary-red text-background shadow-lg shadow-primary-red/20">
              {loading ? 'Processing...' : (isLogin ? 'Sign In →' : 'Sign Up →')}
            </button>
            <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black uppercase opacity-30 text-center">
              Go Back
            </button>
          </form>
        )

      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-[80vh] overflow-y-auto no-scrollbar pb-12">
            <h2 className="text-3xl font-display font-black leading-tight italic">
              lastly, <br/> who are you? 👀
            </h2>

            {/* Name */}
            <input
              type="text"
              placeholder="Your name"
              className="input-frens"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Avatar preview + style picker */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Your Avatar</p>

              {/* Big preview */}
              <div className="flex justify-center">
                <div className="w-28 h-28 rounded-[2rem] bg-card border-4 border-primary-green shadow-xl shadow-primary-green/20 overflow-hidden">
                  <img
                    src={previewUrl(avatarStyle)}
                    alt="avatar preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Style grid */}
              <div className="grid grid-cols-3 gap-3">
                {AVATAR_STYLES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setAvatarStyle(s.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                      avatarStyle === s.id
                        ? 'bg-primary-green/20 border-2 border-primary-green scale-105'
                        : 'bg-card border border-white/5 opacity-50'
                    }`}
                  >
                    <img
                      src={previewUrl(s.id)}
                      alt={s.label}
                      className="w-12 h-12 rounded-full object-cover bg-card"
                    />
                    <span className="text-[8px] font-black uppercase tracking-wider">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              disabled={loading || !name}
              className="w-full bg-primary-green text-background font-black py-4 rounded-2xl text-lg active:scale-95 transition-all shadow-lg shadow-primary-green/20"
            >
              Start Hanging Out 🤘
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col justify-center max-w-md mx-auto relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary-red/10 blur-[100px] rounded-full" />
      <div className="mb-12 relative">
        <h1 className="text-5xl font-display font-black text-gradient-red-yellow mb-2 italic text-center">FRENS</h1>
      </div>
      <div className="relative">
        {renderStep()}
        {error && <p className="text-primary-red text-[10px] font-black uppercase mt-4 text-center">{error}</p>}
      </div>
    </div>
  )
}

export default Onboarding
