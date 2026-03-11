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
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmedAge, setConfirmedAge] = useState(false)

  const navigate = useNavigate()
  const { setUser } = useStore()

  useEffect(() => {
    // If already fully onboarded, skip to feed
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .maybeSingle()
      if (profile?.name?.trim()) {
        navigate('/', { replace: true })
      }
    })
  }, [])

  const changeStep = (newStep) => {
    setDirection(newStep > step ? 'right' : 'left')
    setStep(newStep)
  }

  const handleEmailSignup = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      // Minimal user set — no DB write yet, that happens at step 4
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
  }

  const handleCompleteSignup = async () => {
    if (!agreedToTerms || !confirmedAge || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('No active session')

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

      // Set complete user in store BEFORE navigating
      setUser({ ...session.user, ...profile })

      // Small delay so store updates before ProtectedRoute checks
      await new Promise(r => setTimeout(r, 150))
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const animationClass = direction === 'right'
    ? 'animate-[slideInRight_0.2s_ease]'
    : 'animate-[slideInLeft_0.2s_ease]'

  if (step === 1) return (
    <div className="min-h-screen bg-background p-6 flex flex-col justify-center max-w-md mx-auto"
      style={{ animation: 'slideInRight 0.2s ease' }}>
      <h1 className="text-5xl font-display font-black text-center mb-12 italic">FRENS</h1>

      {isDeleted && (
        <div className="w-full mb-4 px-4 py-3 rounded-2xl text-sm text-center font-bold"
          style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>
          This account has been deleted.
        </div>
      )}

      <div className="space-y-3">
        <button onClick={() => { setIsLogin(true); changeStep(2) }}
          className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
          style={{ background: '#ff6b6b', color: '#fff' }}>
          Sign In
        </button>
        <button onClick={() => { setIsLogin(false); changeStep(2) }}
          className="w-full py-4 rounded-2xl font-black text-base border active:scale-95 transition-all"
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
          Create Account
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      <div className="px-6 pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button onClick={() => changeStep(step - 1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90 transition-all"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            <span className="text-white/60">←</span>
          </button>
          <span className="text-5xl font-display font-black italic text-white/5 tracking-tighter">FRENS</span>
          <div className="w-9" />
        </div>

        {step >= 2 && step <= 4 && (
          <div className="flex gap-1.5">
            {[2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
                style={{ background: i <= step ? '#ff6b6b' : 'rgba(255,255,255,0.1)' }} />
            ))}
          </div>
        )}
      </div>

      <div className={`flex-1 p-6 flex flex-col justify-center ${animationClass}`}>

        {step === 2 && (
          <>
            <h2 className="text-3xl font-display font-black mb-6">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <form onSubmit={e => {
              e.preventDefault()
              if (!loading && email && password) {
                isLogin ? handleEmailSignIn() : handleEmailSignup()
              }
            }} className="space-y-3">
              <input type="email" placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30" />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30" />
              {error && <p className="text-red-400 text-xs font-bold px-1">{error}</p>}
              <button type="submit" disabled={loading || !email || !password}
                className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all"
                style={{
                  background: (email && password) ? '#ff6b6b' : 'rgba(255,107,107,0.2)',
                  color: (email && password) ? '#fff' : 'rgba(255,255,255,0.2)'
                }}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30 font-bold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button type="button" onClick={handleGoogleAuth} disabled={loading}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all"
              style={{ background: '#fff', color: '#111' }}>
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-3xl font-display font-black mb-8">What should frens call you?</h2>
            <div className="space-y-8">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <img src={buildAvatarUrl(name || 'you', avatarConfig)} alt="avatar"
                    className="w-32 h-32 rounded-[40px]"
                    style={{ background: '#1d1928', border: '4px solid rgba(255,107,107,0.3)' }} />
                  <button onClick={() => setShowAvatarEditor(true)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-xl"
                    style={{ background: '#ff6b6b', border: '3px solid #0e0c14' }}>
                    ✏️
                  </button>
                </div>
                <button onClick={() => setShowAvatarEditor(true)}
                  className="text-xs text-white/40 font-black uppercase tracking-widest">
                  Customise avatar
                </button>
              </div>

              <input type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} maxLength={30} autoFocus
                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white outline-none focus:border-white/30 text-center text-lg font-bold" />

              <button onClick={() => changeStep(4)} disabled={!name.trim()}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
                style={{
                  background: name.trim() ? '#6bcb77' : 'rgba(107,203,119,0.1)',
                  color: name.trim() ? '#0a1a0d' : 'rgba(107,203,119,0.3)',
                }}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-3xl font-display font-black mb-2">Before you jump in</h2>
            <p className="text-white/40 text-sm mb-6">A few rules for our community</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-4 max-h-[260px] overflow-y-auto">
              {[
                ['🔒', 'Your data is private by default'],
                ['📍', 'Location only shared with your frens'],
                ['🚫', 'No ads. Ever.'],
                ['👤', 'You must be 13 or older'],
                ['📸', 'Photos you share belong to you'],
                ['💬', 'Be kind — harassment gets you removed'],
              ].map(([icon, text]) => (
                <div key={text} className="flex gap-3 items-start">
                  <span className="text-xl">{icon}</span>
                  <p className="text-sm font-medium text-white/80">{text}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              {[
                [agreedToTerms, setAgreedToTerms, 'I agree to the Terms of Service and Privacy Policy'],
                [confirmedAge, setConfirmedAge, 'I confirm I am 13 years or older'],
              ].map(([checked, setter, label]) => (
                <label key={label} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0
                    ${checked ? 'bg-[#ff6b6b] border-[#ff6b6b]' : 'border-white/10 group-hover:border-white/20'}`}
                    onClick={() => setter(!checked)}>
                    {checked && <span className="text-white text-xs font-black">✓</span>}
                  </div>
                  <span className="text-xs font-bold text-white/60">{label}</span>
                </label>
              ))}
            </div>

            <button onClick={handleCompleteSignup}
              disabled={loading || !agreedToTerms || !confirmedAge}
              className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95"
              style={{
                background: (agreedToTerms && confirmedAge) ? '#6bcb77' : 'rgba(107,203,119,0.1)',
                color: (agreedToTerms && confirmedAge) ? '#0a1a0d' : 'rgba(107,203,119,0.3)',
              }}>
              {loading ? 'Creating account...' : 'Create my account'}
            </button>
            {error && <p className="text-red-400 text-xs font-bold text-center mt-4">{error}</p>}
          </>
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