import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import {
  updateDisplayName,
  updateNotificationPrefs,
  updatePrivacySettings,
  deleteAccount,
} from '../lib/api'

/* ─── Shared UI Primitives ─────────────────────── */

const BottomModal = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-end"
    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div className="w-full rounded-t-3xl p-5 pb-10 animate-in slide-in-from-bottom duration-300"
      style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex justify-center mb-4">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-black text-lg">{title}</h2>
        <button onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition-colors">
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
)

const SaveButton = ({ loading, onClick, label }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="w-full py-3.5 rounded-2xl font-black text-sm mt-4 transition-all active:scale-[0.98]"
    style={{
      background: loading ? 'rgba(255,107,107,0.3)' : 'linear-gradient(135deg, #ff6b6b, #ff8e53)',
      color: loading ? 'rgba(255,255,255,0.5)' : '#fff',
      boxShadow: loading ? 'none' : '0 6px 20px rgba(255,107,107,0.3)',
    }}
  >
    {loading ? 'Saving' : label}
  </button>
)

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
    style={{ background: value ? '#6bcb77' : 'rgba(255,255,255,0.15)' }}
  >
    <div
      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
      style={{ left: value ? 24 : 4 }}
    />
  </button>
)

const SectionCard = ({ children }) => (
  <div className="rounded-2xl overflow-hidden divide-y divide-white/[0.04]"
    style={{ background: '#16131f', border: '1px solid rgba(255,255,255,0.07)' }}>
    {children}
  </div>
)

const SectionTitle = ({ children }) => (
  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1 mt-7 mb-2">
    {children}
  </h3>
)

const SettingsRow = ({ icon, label, description, right, onClick, destructive }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3.5
      hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors text-left
      ${destructive ? 'text-red-400' : 'text-white'}`}
  >
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${destructive ? 'bg-red-500/15' : 'bg-white/[0.06]'
      }`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-semibold ${destructive ? 'text-red-400' : ''}`}>{label}</div>
      {description && <div className="text-[11px] text-white/40 mt-0.5 truncate">{description}</div>}
    </div>
    {right && <div className="flex-shrink-0 text-white/25 text-lg">{right}</div>}
  </button>
)

/* ─── Modal Components ─────────────────────────── */

const ChangeNameModal = ({ user, onSave, onClose }) => {
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return setError('Name cannot be empty')
    if (name.length > 30) return setError('Max 30 characters')
    setLoading(true)
    try { await onSave(name.trim()) }
    catch { setError('Failed to update') }
    finally { setLoading(false) }
  }

  return (
    <BottomModal title="Change Name" onClose={onClose}>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        maxLength={30}
        placeholder="Your name"
        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm outline-none focus:border-white/30 transition-colors"
        autoFocus
      />
      <div className="flex justify-between mt-2">
        <span className="text-[10px] text-white/20">{name.length}/30</span>
        {error && <span className="text-red-400 text-[10px]">{error}</span>}
      </div>
      <SaveButton loading={loading} onClick={handleSave} label="Save Name" />
    </BottomModal>
  )
}

const ChangeEmailModal = ({ onSave, onClose }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!email.includes('@')) return setError('Enter a valid email')
    setLoading(true)
    try { await onSave(email) }
    catch { setError('Failed to update email') }
    finally { setLoading(false) }
  }

  return (
    <BottomModal title="Change Email" onClose={onClose}>
      <p className="text-xs text-white/40 mb-3">
        We'll send a confirmation to your new email before changing it.
      </p>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="new@email.com"
        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm outline-none focus:border-white/30 transition-colors"
        autoFocus
      />
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <SaveButton loading={loading} onClick={handleSave} label="Confirm email" />
    </BottomModal>
  )
}

const ChangePasswordModal = ({ onSave, onClose }) => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
      : password.length < 10 ? 2
        : 3
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong']
  const strengthColor = ['', '#ff6b6b', '#ffd93d', '#6bcb77']

  const handleSave = async () => {
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try { await onSave(password) }
    catch { setError('Failed to update password') }
    finally { setLoading(false) }
  }

  return (
    <BottomModal title="Change Password" onClose={onClose}>
      <div className="relative mb-3">
        <input
          type={showPass ? 'text' : 'password'}
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          placeholder="New password"
          className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 pr-12 text-sm outline-none focus:border-white/30 transition-colors"
          autoFocus
        />
        <button onClick={() => setShowPass(!showPass)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 text-sm">
          {showPass ? '🙈' : '👁️'}
        </button>
      </div>
      {password.length > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${(strength / 3) * 100}%`, background: strengthColor[strength] }} />
          </div>
          <p className="text-[10px] mt-1 font-bold" style={{ color: strengthColor[strength] }}>
            {strengthLabel[strength]}
          </p>
        </div>
      )}
      <input
        type={showPass ? 'text' : 'password'}
        value={confirm}
        onChange={e => { setConfirm(e.target.value); setError('') }}
        placeholder="Confirm new password"
        className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 text-sm outline-none focus:border-white/30 transition-colors"
      />
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <SaveButton loading={loading} onClick={handleSave} label="Update password" />
    </BottomModal>
  )
}

const DeleteAccountModal = ({ onConfirm, onClose }) => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <BottomModal title="Delete Account" onClose={onClose}>
      <div className="p-4 rounded-2xl mb-4"
        style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.2)' }}>
        <p className="text-sm text-red-400 font-semibold mb-2">⚠️ This cannot be undone</p>
        <p className="text-xs text-white/50 leading-relaxed">
          Deleting your account will permanently remove your profile,
          all hangouts you created, your photos, and all friendships.
          Your frens will no longer see you.
        </p>
      </div>
      <p className="text-xs text-white/40 mb-2">Type <strong className="text-white/70">DELETE</strong> to confirm</p>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="DELETE"
        className="w-full h-12 bg-white/5 border border-red-500/30 rounded-2xl px-4 text-sm outline-none focus:border-red-500/60 transition-colors mb-4"
      />
      <button
        onClick={async () => {
          if (input !== 'DELETE') return
          setLoading(true)
          await onConfirm()
        }}
        disabled={input !== 'DELETE' || loading}
        className="w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
        style={{
          background: input === 'DELETE' ? '#ff6b6b' : 'rgba(255,107,107,0.15)',
          color: input === 'DELETE' ? '#fff' : 'rgba(255,107,107,0.4)',
        }}
      >
        {loading ? 'Deleting' : 'Delete Account'}
      </button>
    </BottomModal>
  )
}

/* ─── Settings Page ────────────────────────────── */

const Settings = () => {
  const navigate = useNavigate()
  const { user, setUser, setToast } = useStore()

  const [activeModal, setActiveModal] = useState(null)

  // Notification prefs
  const [notifs, setNotifs] = useState({
    hangoutInvites: true,
    rsvpUpdates: true,
    frenRequests: true,
    nearbyPings: true,
    hangoutReminders: true,
    newPhotos: false,
    weeklyRecap: true,
  })

  // Privacy prefs
  const [privacy, setPrivacy] = useState({
    showOnNearby: true,
    showStatus: true,
    allowFrenRequests: true,
    showInSearch: true,
    readReceipts: true,
  })

  // Appearance prefs (local only)
  const [appearance, setAppearance] = useState({
    haptics: true,
    reducedMotion: false,
    compactCards: false,
  })

  // Load saved prefs
  useEffect(() => {
    if (user?.notification_prefs && Object.keys(user.notification_prefs).length > 0) {
      setNotifs(prev => ({ ...prev, ...user.notification_prefs }))
    }
    if (user?.privacy_prefs && Object.keys(user.privacy_prefs).length > 0) {
      setPrivacy(prev => ({ ...prev, ...user.privacy_prefs }))
    }
  }, [user])

  const updateNotif = (key, val) => {
    const updated = { ...notifs, [key]: val }
    setNotifs(updated)
    updateNotificationPrefs(updated)
      .then(() => setToast({ message: 'Notifications updated', type: 'success' }))
      .catch(() => setToast({ message: 'Failed to save', type: 'error' }))
  }

  const updatePrivacyPref = (key, val) => {
    const updated = { ...privacy, [key]: val }
    setPrivacy(updated)
    updatePrivacySettings(updated)
      .then(() => setToast({ message: 'Privacy updated', type: 'success' }))
      .catch(() => setToast({ message: 'Failed to save', type: 'error' }))
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0e0c14' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 sticky top-0 z-20"
        style={{ background: '#0e0c14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/profile')}
          className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors">
          ←
        </button>
        <h1 className="font-display font-black text-2xl italic">Settings</h1>
      </div>

      <div className="px-4 pt-1">

        {/* ── ACCOUNT ── */}
        <SectionTitle>Account</SectionTitle>
        <SectionCard>
          <SettingsRow icon="👤" label="Display Name"
            description={user?.name || 'Set your name'} right="›"
            onClick={() => setActiveModal('name')} />
          <SettingsRow icon="📧" label="Email Address"
            description={user?.email
              ? user.email.slice(0, 2) + '••••@' + user.email.split('@')[1]
              : 'Not set'}
            right="›" onClick={() => setActiveModal('email')} />
          <SettingsRow icon="📱" label="Linked Phone"
            description="Add a phone number as backup" right="›"
            onClick={() => setToast({ message: 'Phone linking coming soon', type: 'info' })} />
        </SectionCard>

        {/* ── PASSWORD & SECURITY ── */}
        <SectionTitle>Password & Security</SectionTitle>
        <SectionCard>
          <SettingsRow icon="🔑" label="Change Password"
            description="Update your password" right="›"
            onClick={() => setActiveModal('password')} />
          <SettingsRow icon="🛡️" label="Two-Factor Authentication"
            description="Extra security for your account" right="›"
            onClick={() => setToast({ message: '2FA coming soon', type: 'info' })} />
          <SettingsRow icon="📋" label="Active Sessions"
            description="See where you're logged in" right="›"
            onClick={() => setToast({ message: 'Sessions coming soon', type: 'info' })} />
        </SectionCard>

        {/* ── NOTIFICATIONS ── */}
        <SectionTitle>Notifications</SectionTitle>
        <SectionCard>
          {[
            { key: 'hangoutInvites', icon: '🎉', label: 'Hangout invites', desc: 'When someone adds you to a plan' },
            { key: 'rsvpUpdates', icon: '✅', label: 'RSVP updates', desc: 'When frens respond to your plans' },
            { key: 'frenRequests', icon: '👥', label: 'Fren requests', desc: 'When someone wants to add you' },
            { key: 'nearbyPings', icon: '📍', label: 'Nearby pings', desc: 'When a fren pings you nearby' },
            { key: 'hangoutReminders', icon: '⏰', label: 'Hangout reminders', desc: '1 hour before a hangout' },
            { key: 'newPhotos', icon: '📸', label: 'New photos', desc: 'When frens add photos to albums' },
            { key: 'weeklyRecap', icon: '📊', label: 'Weekly recap', desc: 'Your weekly social summary' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{item.desc}</div>
              </div>
              <Toggle value={notifs[item.key]} onChange={val => updateNotif(item.key, val)} />
            </div>
          ))}
        </SectionCard>

        {/* ── PRIVACY ── */}
        <SectionTitle>Privacy</SectionTitle>
        <SectionCard>
          {[
            { key: 'showOnNearby', icon: '📍', label: 'Show on Nearby map', desc: 'Let frens see you on the map' },
            { key: 'showStatus', icon: '🟢', label: 'Show my status', desc: 'Free / busy / maybe visible to frens' },
            { key: 'allowFrenRequests', icon: '👋', label: 'Allow fren requests', desc: 'Let people send you requests' },
            { key: 'showInSearch', icon: '🔍', label: 'Show in search', desc: 'Appear when people search by email' },
            { key: 'readReceipts', icon: '👁️', label: 'Read receipts', desc: 'Let frens see when you viewed plans' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{item.desc}</div>
              </div>
              <Toggle value={privacy[item.key]} onChange={val => updatePrivacyPref(item.key, val)} />
            </div>
          ))}
          <SettingsRow icon="🚫" label="Blocked Users"
            description="Manage who you've blocked" right="›"
            onClick={() => setToast({ message: 'Block list coming soon', type: 'info' })} />
        </SectionCard>

        {/* ── APPEARANCE ── */}
        <SectionTitle>Appearance</SectionTitle>
        <SectionCard>
          {[
            { key: 'haptics', icon: '📳', label: 'Haptic feedback', desc: 'Vibrate on interactions' },
            { key: 'reducedMotion', icon: '🎞️', label: 'Reduce motion', desc: 'Less animations' },
            { key: 'compactCards', icon: '🗂️', label: 'Compact cards', desc: 'Smaller hangout cards on feed' },
          ].map(item => (
            <div key={item.key} className="flex items-center gap-4 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{item.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{item.desc}</div>
              </div>
              <Toggle
                value={appearance[item.key]}
                onChange={val => setAppearance(prev => ({ ...prev, [item.key]: val }))}
              />
            </div>
          ))}
        </SectionCard>

        {/* ── ABOUT ── */}
        <SectionTitle>About</SectionTitle>
        <SectionCard>
          <SettingsRow icon="📄" label="Privacy Policy" right="›"
            onClick={() => window.open('https://frens.app/privacy', '_blank')} />
          <SettingsRow icon="📋" label="Terms of Service" right="›"
            onClick={() => window.open('https://frens.app/terms', '_blank')} />
          <SettingsRow icon="💬" label="Send Feedback" right="›"
            onClick={() => window.open('mailto:hello@frens.app', '_blank')} />
          <SettingsRow icon="⭐" label="Rate the App" right="›"
            onClick={() => setToast({ message: 'App store link coming soon', type: 'info' })} />
          <div className="flex items-center gap-4 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-lg">📦</div>
            <div className="flex-1"><div className="text-sm font-semibold">Version</div></div>
            <div className="text-sm text-white/30 font-mono">1.0.0</div>
          </div>
        </SectionCard>

        {/* ── DANGER ZONE ── */}
        <SectionTitle>Danger Zone</SectionTitle>
        <SectionCard>
          <SettingsRow icon="🚪" label="Sign Out" destructive
            onClick={async () => {
              await supabase.auth.signOut()
              setUser(null)
              navigate('/onboarding')
            }} />
          <SettingsRow icon="🗑️" label="Delete Account"
            description="Permanently delete your account and all data"
            destructive right="›"
            onClick={() => setActiveModal('delete')} />
        </SectionCard>

        <div className="h-8" />
      </div>

      {/* ── MODALS ── */}
      {activeModal === 'name' && (
        <ChangeNameModal
          user={user}
          onSave={async (name) => {
            await updateDisplayName(name)
            setUser({ ...user, name })
            setToast({ message: 'Name updated', type: 'success' })
            setActiveModal(null)
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'email' && (
        <ChangeEmailModal
          onSave={async (email) => {
            await supabase.auth.updateUser({ email })
            setToast({ message: 'Check your new email to confirm', type: 'success' })
            setActiveModal(null)
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'password' && (
        <ChangePasswordModal
          onSave={async (newPassword) => {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setToast({ message: 'Password updated', type: 'success' })
            setActiveModal(null)
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'delete' && (
        <DeleteAccountModal
          onConfirm={async () => {
            try {
              await deleteAccount()
            } catch { }
            await supabase.auth.signOut()
            navigate('/onboarding')
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  )
}

export default Settings
