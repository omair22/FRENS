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

/* ── Primitives ── */

const BackIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    style={{
      width: 44, height: 24, borderRadius: 9999,
      background: value ? '#4caf7d' : '#1a1a1a',
      border: '1px solid rgba(255,255,255,0.07)',
      position: 'relative', flexShrink: 0, cursor: 'pointer',
      transition: 'background 0.2s ease',
    }}
  >
    <div style={{
      position: 'absolute', top: 3,
      left: value ? 23 : 3,
      width: 16, height: 16,
      borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      transition: 'left 0.2s ease',
    }} />
  </button>
)

const Row = ({ icon, label, description, right, onClick, destructive }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: 'none', border: 'none',
      cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
    }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: '#1a1a1a', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 15, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: destructive ? '#ff4d4d' : '#f5f5f5', margin: 0 }}>
        {label}
      </p>
      {description && (
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {description}
        </p>
      )}
    </div>
    {right && <div style={{ color: '#3a3a3a', fontSize: 16, flexShrink: 0 }}>{right}</div>}
  </button>
)

const Card = ({ children }) => (
  <div style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    {children}
  </div>
)

const Divider = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 16px' }} />

const SectionTitle = ({ children }) => (
  <p className="section-label" style={{ marginTop: 24, marginBottom: 8 }}>{children}</p>
)

/* ── Modals ── */

const Modal = ({ title, onClose, children }) => (
  <div
    style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div style={{ width: '100%', maxWidth: 448, background: '#111111', borderRadius: '20px 20px 0 0', padding: '0 20px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
        <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666666', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
)

/* ── Settings Page ── */

const Settings = () => {
  const navigate = useNavigate()
  const { user, setUser, setToast } = useStore()
  const [activeModal, setActiveModal] = useState(null)
  const [notifs, setNotifs] = useState({ hangoutInvites: true, rsvpUpdates: true, frenRequests: true, nearbyPings: true, hangoutReminders: true, newPhotos: false, weeklyRecap: true })
  const [privacy, setPrivacy] = useState({ showOnNearby: true, showStatus: true, allowFrenRequests: true, showInSearch: true, readReceipts: true })

  useEffect(() => {
    if (user?.notification_prefs) setNotifs(p => ({ ...p, ...user.notification_prefs }))
    if (user?.privacy_prefs) setPrivacy(p => ({ ...p, ...user.privacy_prefs }))
  }, [user])

  const updateNotif = (key, val) => {
    const updated = { ...notifs, [key]: val }
    setNotifs(updated)
    updateNotificationPrefs(updated)
      .then(() => setToast({ message: 'Saved', type: 'success' }))
      .catch(() => setToast({ message: 'Failed', type: 'error' }))
  }

  const updatePriv = (key, val) => {
    const updated = { ...privacy, [key]: val }
    setPrivacy(updated)
    updatePrivacySettings(updated)
      .then(() => setToast({ message: 'Saved', type: 'success' }))
      .catch(() => setToast({ message: 'Failed', type: 'error' }))
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '56px 20px 16px',
        position: 'sticky', top: 0, zIndex: 20, background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => navigate('/profile')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
            color: '#666666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <BackIcon />
        </button>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>Settings</h1>
      </div>

      <div style={{ padding: '0 20px' }}>

        {/* Account */}
        <SectionTitle>Account</SectionTitle>
        <Card>
          <Row icon="👤" label="Display Name" description={user?.name} right="›" onClick={() => setActiveModal('name')} />
          <Divider />
          <Row
            icon="📧" label="Email"
            description={user?.email ? user.email.slice(0, 2) + '••••@' + user.email.split('@')[1] : 'Not set'}
          />
          {!user?.isGuest && (
            <>
              <Divider />
              <Row icon="🔑" label="Change Password" right="›" onClick={() => setActiveModal('password')} />
            </>
          )}
        </Card>

        {/* Notifications */}
        <SectionTitle>Notifications</SectionTitle>
        <Card>
          {[
            { key: 'hangoutInvites', icon: '🎉', label: 'Hangout invites', desc: 'When someone adds you' },
            { key: 'rsvpUpdates', icon: '✅', label: 'RSVP updates', desc: 'When frens respond' },
            { key: 'frenRequests', icon: '👥', label: 'Fren requests' },
            { key: 'nearbyPings', icon: '📍', label: 'Nearby pings' },
            { key: 'hangoutReminders', icon: '⏰', label: 'Reminders', desc: '1 hour before' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', margin: 0 }}>{item.label}</p>
                  {item.desc && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#666666', margin: '2px 0 0' }}>{item.desc}</p>}
                </div>
                <Toggle value={notifs[item.key]} onChange={val => updateNotif(item.key, val)} />
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        {/* Privacy */}
        <SectionTitle>Privacy</SectionTitle>
        <Card>
          {[
            { key: 'showOnNearby', icon: '📍', label: 'Show on map' },
            { key: 'showStatus', icon: '🟢', label: 'Show status' },
            { key: 'allowFrenRequests', icon: '👋', label: 'Allow fren requests' },
            { key: 'showInSearch', icon: '🔍', label: 'Searchable' },
          ].map((item, i, arr) => (
            <React.Fragment key={item.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', flex: 1, margin: 0 }}>{item.label}</p>
                <Toggle value={privacy[item.key]} onChange={val => updatePriv(item.key, val)} />
              </div>
              {i < arr.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>

        {/* About */}
        <SectionTitle>About</SectionTitle>
        <Card>
          <Row icon="📄" label="Privacy Policy" right="›" onClick={() => window.open('https://frens.app/privacy', '_blank')} />
          <Divider />
          <Row icon="📋" label="Terms of Service" right="›" onClick={() => window.open('https://frens.app/terms', '_blank')} />
          <Divider />
          <Row icon="💬" label="Send Feedback" right="›" onClick={() => window.open('mailto:hello@frens.app', '_blank')} />
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>📦</div>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', flex: 1, margin: 0 }}>Version</p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3a3a3a', margin: 0 }}>1.0.0</p>
          </div>
        </Card>

        {/* Danger Zone */}
        <SectionTitle>Account Actions</SectionTitle>
        <Card>
          <Row
            icon="🚪" label="Sign Out" destructive
            onClick={async () => { await supabase.auth.signOut(); setUser(null); navigate('/onboarding') }}
          />
          <Divider />
          <Row
            icon="🗑️" label="Delete Account"
            description="Permanently remove your account"
            destructive right="›"
            onClick={() => setActiveModal('delete')}
          />
        </Card>

        <div style={{ height: 40 }} />
      </div>

      {/* ── Modals ── */}
      {activeModal === 'name' && (
        <ChangeNameModal user={user} onSave={async (n) => { await updateDisplayName(n); setUser({ ...user, name: n }); setToast({ message: 'Name updated', type: 'success' }); setActiveModal(null) }} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'password' && (
        <ChangePasswordModal onSave={async (pw) => { const { error } = await supabase.auth.updateUser({ password: pw }); if (error) throw error; setToast({ message: 'Password updated', type: 'success' }); setActiveModal(null) }} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'delete' && (
        <DeleteModal onConfirm={async () => { try { await deleteAccount() } catch {} await supabase.auth.signOut(); navigate('/onboarding') }} onClose={() => setActiveModal(null)} />
      )}
    </div>
  )
}

/* ── Sub-modals ── */

const ChangeNameModal = ({ user, onSave, onClose }) => {
  const [name, setName] = useState(user?.name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  return (
    <Modal title="Display Name" onClose={onClose}>
      <input type="text" value={name} onChange={e => setName(e.target.value)} maxLength={30} placeholder="Your name" className="input-frens" autoFocus style={{ marginBottom: 16 }} />
      {error && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ff4d4d', marginBottom: 12 }}>{error}</p>}
      <button
        onClick={async () => { if (!name.trim()) { setError('Name required'); return }; setLoading(true); try { await onSave(name.trim()) } catch { setError('Failed') } finally { setLoading(false) } }}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </Modal>
  )
}

const ChangePasswordModal = ({ onSave, onClose }) => {
  const [pw, setPw] = useState('')
  const [conf, setConf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  return (
    <Modal title="Change Password" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <input type="password" placeholder="New password" className="input-frens" value={pw} onChange={e => setPw(e.target.value)} />
        <input type="password" placeholder="Confirm new password" className="input-frens" value={conf} onChange={e => setConf(e.target.value)} />
      </div>
      {error && <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ff4d4d', marginBottom: 12 }}>{error}</p>}
      <button
        onClick={async () => { if (pw.length < 8) { setError('At least 8 characters'); return } if (pw !== conf) { setError("Passwords don't match"); return } setLoading(true); try { await onSave(pw) } catch { setError('Failed') } finally { setLoading(false) } }}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Saving...' : 'Update Password'}
      </button>
    </Modal>
  )
}

const DeleteModal = ({ onConfirm, onClose }) => {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  return (
    <Modal title="Delete Account" onClose={onClose}>
      <div style={{ padding: '12px 16px', background: '#1a1a1a', border: '1px solid rgba(255,77,77,0.2)', borderRadius: 12, marginBottom: 16 }}>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#ff4d4d', fontWeight: 600, margin: '0 0 4px' }}>This cannot be undone</p>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', margin: 0, lineHeight: 1.5 }}>All your data, hangouts, and connections will be permanently deleted.</p>
      </div>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', marginBottom: 8 }}>Type DELETE to confirm</p>
      <input type="text" placeholder="DELETE" className="input-frens" value={input} onChange={e => setInput(e.target.value)} style={{ marginBottom: 16, borderColor: 'rgba(255,77,77,0.3)' }} />
      <button
        onClick={async () => { if (input !== 'DELETE') return; setLoading(true); await onConfirm() }}
        disabled={input !== 'DELETE' || loading}
        className="btn-destructive"
        style={{ width: '100%', height: 52 }}
      >
        {loading ? 'Deleting...' : 'Delete Account'}
      </button>
    </Modal>
  )
}

export default Settings
