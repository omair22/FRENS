import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useStore } from '../store/useStore'
import { buildAvatarUrl, DEFAULT_AVATAR_CONFIG } from '../lib/avatar'
import AvatarEditor from '../components/AvatarEditor'

const Onboarding = () => {
  const [searchParams] = useSearchParams()
  const initialStep = parseInt(searchParams.get('step') || '1')
  const isDeleted = searchParams.get('deleted') === 'true'

  const [step, setStep] = useState(initialStep)
  const [direction, setDirection] = useState('right')
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [nameStatus, setNameStatus] = useState('idle') // 'idle' | 'checking' | 'available' | 'taken'
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmedAge, setConfirmedAge] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useStore()

  // On mount — handle redirection and pre-filling name for Google users
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return

      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle()

      if (profile?.name?.trim()) {
        // Fully onboarded — go to feed
        navigate('/', { replace: true })
        return
      }

      // Has session but no name — new Google user
      // Check if we're already on step 3 (from URL param or state)
      if (initialStep >= 3 || step >= 3) return

      // Pre-fill name from Google metadata
      const googleName = session.user.user_metadata?.full_name ||
        session.user.user_metadata?.name
      if (googleName) {
        setName(googleName.split(' ')[0])
      }

      // Send to step 3
      changeStep(3)
    })
  }, [])

  // Username availability check with 500ms debounce
  useEffect(() => {
    if (!name.trim() || name.trim().length < 2) {
      setNameStatus('idle')
      return
    }

    setNameStatus('checking')
    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .ilike('name', name.trim()) // case-insensitive match
        .maybeSingle()

      if (error) {
        setNameStatus('idle')
        return
      }

      setNameStatus(data ? 'taken' : 'available')
    }, 500)

    return () => clearTimeout(timer)
  }, [name])

  const changeStep = (newStep) => {
    setError(null)
    setDirection(newStep > step ? 'right' : 'left')
    setStep(newStep)
  }

  const handleEmailSignup = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      setUser({ id: data.user.id, email: data.user.email })
      changeStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile?.name?.trim()) {
        setUser({ ...data.user, ...profile })
        navigate('/', { replace: true })
      } else {
        setUser({ ...data.user, ...(profile || {}) })
        changeStep(3)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' }
      }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Browser redirects — no further action
  }

  const handleCompleteSignup = async () => {
    if (!agreedToTerms || !confirmedAge || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No active session. Please sign in again.')

      const { data: profile, error: dbError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          name: name.trim(),
          avatar_config: avatarConfig,
          status: 'free'
        })
        .select()
        .single()

      if (dbError) throw dbError

      setUser({ ...session.user, ...profile })

      // Small delay so store settles before ProtectedRoute checks
      await new Promise(r => setTimeout(r, 150))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const animationStyle = {
    animation: direction === 'right'
      ? 'slideInRight 0.2s ease'
      : 'slideInLeft 0.2s ease'
  }

  const canContinue = name.trim().length >= 2 && nameStatus === 'available'

  // ─── Step 1 — Landing ───────────────────────────────────

  if (step === 1) return (
    <div className="min-h-screen bg-background p-6 flex flex-col justify-center max-w-md mx-auto"
      style={{ animation: 'slideInRight 0.2s ease' }}>

      <div className="mb-16 text-center">
        <h1 className="text-6xl font-display font-black italic mb-3"
          style={{ color: '#ff6b6b' }}>
          frens
        </h1>
        <p className="text-white/30 text-sm font-medium">hang out. for real.</p>
      </div>

      {isDeleted && (
        <div className="mb-6 px-4 py-3 rounded-2xl text-sm text-center font-bold"
          style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>
          This account has been deleted.
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => { setIsLogin(true); changeStep(2) }}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
          style={{ background: '#ff6b6b', color: '#fff', boxShadow: '0 4px 20px rgba(255,107,107,0.3)' }}
        >
          Sign In
        </button>
        <button
          onClick={() => { setIsLogin(false); changeStep(2) }}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Create Account
        </button>
      </div>

      <p className="text-center text-white/20 text-xs mt-10">
        By signing up you agree to our Terms & Privacy Policy
      </p>
    </div>
  )

  // ─── Steps 2–4 ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="px-6 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeStep(step - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <span className="text-white/60 text-lg">←</span>
          </button>
          <span className="font-display font-black italic text-white/10 text-2xl">frens</span>
          <div className="w-9" />
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {[2, 3, 4].map(i => (
            <div key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ background: i <= step ? '#ff6b6b' : 'rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 flex flex-col justify-center" style={animationStyle}>

        {/* ── Step 2 — Auth ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-3xl font-display font-black mb-1">
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-white/30 text-sm">
                {isLogin ? 'Sign in to see your frens' : 'Join your frens on the app'}
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault()
                if (!loading && email && password) {
                  isLogin ? handleEmailSignIn() : handleEmailSignup()
                }
              }}
              className="space-y-3"
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-12 rounded-xl px-4 text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full h-12 rounded-xl px-4 text-sm text-white outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />

              {error && (
                <p className="text-red-400 text-xs font-bold px-1">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
                style={{
                  background: (email && password) ? '#ff6b6b' : 'rgba(255,107,107,0.15)',
                  color: (email && password) ? '#fff' : 'rgba(255,107,107,0.4)',
                  boxShadow: (email && password) ? '0 4px 20px rgba(255,107,107,0.25)' : 'none'
                }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <button
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all"
              style={{ background: '#fff', color: '#111' }}
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>

            <button
              onClick={() => { setIsLogin(!isLogin); setError(null) }}
              className="w-full text-center text-xs font-bold py-2"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        )}

        {/* ── Step 3 — Name + Avatar ── */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-display font-black mb-1">What should frens call you?</h2>
              <p className="text-white/30 text-sm">You can change this later</p>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <img
                  src={buildAvatarUrl(name || 'you', avatarConfig)}
                  alt="avatar"
                  className="w-32 h-32 rounded-[40px]"
                  style={{ background: '#1d1928', border: '4px solid rgba(255,107,107,0.3)' }}
                />
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xl"
                  style={{ background: '#ff6b6b', border: '3px solid #0e0c14' }}
                >
                  ✏️
                </button>
              </div>
              <button
                onClick={() => setShowAvatarEditor(true)}
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Customise avatar
              </button>
            </div>

            {/* Name input */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={30}
                autoFocus
                className="w-full h-14 rounded-xl px-4 text-white outline-none text-center text-xl font-black transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />

              {/* Status indicator */}
              <div className="h-5 flex items-center justify-center gap-1.5">
                {nameStatus === 'checking' && (
                  <span className="text-xs text-white/30 font-bold italic">Checking...</span>
                )}
                {nameStatus === 'available' && (
                  <span className="text-xs font-bold" style={{ color: '#6bcb77' }}>
                    ✓ Available
                  </span>
                )}
                {nameStatus === 'taken' && (
                  <span className="text-xs font-bold" style={{ color: '#ff6b6b' }}>
                    ✗ Already taken — try another
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => changeStep(4)}
              disabled={!canContinue}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{
                background: canContinue ? '#6bcb77' : 'rgba(107,203,119,0.1)',
                color: canContinue ? '#0a1a0d' : 'rgba(107,203,119,0.3)',
                boxShadow: canContinue ? '0 4px 20px rgba(107,203,119,0.25)' : 'none'
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 4 — Terms ── */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-display font-black mb-1">Before you jump in</h2>
              <p className="text-white/30 text-sm">A few things to know</p>
            </div>

            <div className="rounded-2xl p-5 space-y-4 max-h-[240px] overflow-y-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                ['🔒', 'Your data is private by default'],
                ['📍', 'Location only shared with your frens'],
                ['🚫', 'No ads. Ever.'],
                ['👤', 'You must be 13 or older'],
                ['📸', 'Photos you share belong to you'],
                ['💬', 'Be kind — harassment gets you removed'],
              ].map(([icon, text]) => (
                <div key={text} className="flex gap-3 items-start">
                  <span className="text-lg">{icon}</span>
                  <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {[
                [agreedToTerms, setAgreedToTerms, 'I agree to the Terms of Service and Privacy Policy'],
                [confirmedAge, setConfirmedAge, 'I confirm I am 13 years or older'],
              ].map(([checked, setter, label]) => (
                <label
                  key={label}
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setter(v => !v)}
                >
                  <div className="w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: checked ? '#ff6b6b' : 'transparent',
                      borderColor: checked ? '#ff6b6b' : 'rgba(255,255,255,0.15)'
                    }}>
                    {checked && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                  <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                </label>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-xs font-bold text-center">{error}</p>
            )}

            <button
              onClick={handleCompleteSignup}
              disabled={loading || !agreedToTerms || !confirmedAge}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{
                background: (agreedToTerms && confirmedAge) ? '#6bcb77' : 'rgba(107,203,119,0.1)',
                color: (agreedToTerms && confirmedAge) ? '#0a1a0d' : 'rgba(107,203,119,0.3)',
                boxShadow: (agreedToTerms && confirmedAge) ? '0 4px 20px rgba(107,203,119,0.25)' : 'none'
              }}
            >
              {loading ? 'Setting up your account...' : 'Create my account 🎉'}
            </button>
          </div>
        )}
      </div>

      {showAvatarEditor && (
        <AvatarEditor
          user={{ name, avatar_config: avatarConfig }}
          onSave={cfg => { setAvatarConfig(cfg); setShowAvatarEditor(false) }}
          onClose={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  )
}

export default Onboarding