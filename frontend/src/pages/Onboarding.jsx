import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AvatarEditor from '../components/AvatarEditor'

const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TOTAL_STEPS = 4

const Onboarding = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState('landing') // 'landing' | 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [nameAvailable, setNameAvailable] = useState(null)
  const [checkingName, setCheckingName] = useState(false)
  const [agreed, setAgreed] = useState({ terms: false, age: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [avatarConfig, setAvatarConfig] = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) navigate('/', { replace: true })
    })
  }, [])

  // Debounce name check
  useEffect(() => {
    if (!name || name.length < 3) { setNameAvailable(null); return }
    setCheckingName(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-name?name=${encodeURIComponent(name)}`)
        const data = await res.json()
        setNameAvailable(data.available)
      } catch { setNameAvailable(null) }
      finally { setCheckingName(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [name])

  const handleGoogleAuth = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  const handleEmailAuth = async () => {
    if (!email || !password) return setError('Fill in all fields')
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setStep(3)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/', { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  const handleSetName = async () => {
    if (!name || nameAvailable !== true) return
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await fetch('/api/auth/set-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ name })
      })
      setStep(4)
    } catch { setError('Failed to set name') }
    finally { setLoading(false) }
  }

  const handleFinish = async () => {
    if (!agreed.terms || !agreed.age) return
    setLoading(true)
    try {
      if (avatarConfig) {
        const { data: { session } } = await supabase.auth.getSession()
        await fetch('/api/users/me/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ avatar_config: avatarConfig })
        })
      }
      navigate('/', { replace: true })
    } catch { navigate('/', { replace: true }) }
    finally { setLoading(false) }
  }

  // ── Step 1: Landing ──
  if (step === 1 && mode === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, fontWeight: 800, color: '#f5f5f5', margin: '0 0 12px' }}>
              frens
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#666666', margin: 0 }}>
              Plan hangouts with the people you actually like
            </p>
          </div>
        </div>
        <div style={{ paddingBottom: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => { setMode('signin'); setStep(2) }}
            className="btn-primary"
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setStep(2) }}
            style={{
              height: 52, borderRadius: 12,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#f5f5f5',
              fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create Account
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Email Auth ──
  if (step === 2) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '56px 24px 48px' }}>
        <button
          onClick={() => { setStep(1); setMode('landing'); setError('') }}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
            color: '#666666', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginBottom: 32,
          }}
        >
          <BackIcon />
        </button>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 1, background: i < 1 ? '#f5f5f5' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#f5f5f5', margin: '0 0 8px' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', margin: '0 0 32px' }}>
          {mode === 'signin' ? 'Sign in to continue' : 'Start planning with your friends'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          <input type="email" placeholder="Email" className="input-frens" value={email} onChange={e => { setEmail(e.target.value); setError('') }} />
          <input type="password" placeholder="Password" className="input-frens" value={password} onChange={e => { setPassword(e.target.value); setError('') }} />
        </div>

        {error && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ff4d4d', marginBottom: 16 }}>{error}</p>
        )}

        <button
          onClick={handleEmailAuth}
          disabled={loading || !email || !password}
          className="btn-primary"
          style={{ marginBottom: 16 }}
        >
          {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            height: 52, borderRadius: 12,
            background: '#111111', border: '1px solid rgba(255,255,255,0.1)',
            color: '#f5f5f5',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>G</span> Continue with Google
        </button>

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
          style={{
            marginTop: 20, background: 'none', border: 'none',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666',
            cursor: 'pointer', textAlign: 'center',
          }}
        >
          {mode === 'signin' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
        </button>
      </div>
    )
  }

  // ── Step 3: Name + Avatar ──
  if (step === 3) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '56px 24px 48px' }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
          {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 1, background: i < 2 ? '#f5f5f5' : 'rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#f5f5f5', margin: '0 0 8px' }}>
          What's your name?
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', margin: '0 0 24px' }}>
          This is how frens will see you
        </p>

        <div style={{ position: 'relative', marginBottom: 8 }}>
          <input
            type="text"
            placeholder="First name or nickname"
            className="input-frens"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
          />
          {name.length >= 3 && (
            <div style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'DM Sans, sans-serif', fontSize: 12,
              color: checkingName ? '#666666' : nameAvailable ? '#4caf7d' : '#ff4d4d',
            }}>
              {checkingName ? '...' : nameAvailable ? '✓' : '✗'}
            </div>
          )}
        </div>

        {name.length >= 3 && !checkingName && nameAvailable === false && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ff4d4d', marginBottom: 16 }}>
            That name is taken
          </p>
        )}

        <div style={{ marginTop: 24, marginBottom: 24 }}>
            <p className="section-label" style={{ marginBottom: 12 }}>Pick an avatar</p>
            <AvatarEditor
              user={{ name }}
              onSave={(config) => { setAvatarConfig(config); setStep(4) }}
              onClose={() => setStep(4)}
              embedded
            />
          </div>

        <button
          onClick={handleSetName}
          disabled={loading || !name || nameAvailable !== true}
          className="btn-primary"
          style={{ marginTop: 'auto' }}
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    )
  }

  // ── Step 4: Terms ──
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', padding: '56px 24px 48px' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 1, background: '#f5f5f5' }} />
        ))}
      </div>

      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 700, color: '#f5f5f5', margin: '0 0 8px' }}>
        Almost done
      </h1>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', margin: '0 0 32px' }}>
        Agree to continue
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {[
          { key: 'terms', label: 'I agree to the Terms of Service and Privacy Policy' },
          { key: 'age', label: "I'm at least 16 years old" },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setAgreed(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12,
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: agreed[item.key] ? '#f5f5f5' : 'transparent',
              border: agreed[item.key] ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 12, color: '#0a0a0a', fontWeight: 600,
            }}>
              {agreed[item.key] ? '✓' : ''}
            </div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#f5f5f5', margin: 0 }}>{item.label}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleFinish}
        disabled={loading || !agreed.terms || !agreed.age}
        className="btn-primary"
        style={{ marginTop: 32 }}
      >
        {loading ? 'Setting up...' : "Let's go"}
      </button>
    </div>
  )
}

export default Onboarding