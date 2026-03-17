import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserStats, updateStatus, getMyProfile, updateAvatarConfig } from '../lib/api'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import AvatarEditor from '../components/AvatarEditor'

const STATUS_OPTIONS = [
  { id: 'free', label: "I'm Free", dot: '#4caf7d' },
  { id: 'maybe', label: 'Maybe', dot: '#f5a623' },
  { id: 'busy', label: 'Busy', dot: '#ff4d4d' },
]

const Profile = () => {
  const { user, setUser, setToast } = useStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [activeTab, setActiveTab] = useState('hangouts')

  useEffect(() => {
    Promise.all([getMyProfile(), getUserStats()])
      .then(([p, s]) => { setUser(p.data); setStats(s.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusUpdate = async (s) => {
    try {
      await updateStatus(s)
      setUser({ ...user, status: s })
      setToast({ message: 'Status updated', type: 'success' })
    } catch { setToast({ message: 'Update failed', type: 'error' }) }
  }

  const handleSaveAvatar = async (config) => {
    try {
      await updateAvatarConfig(config)
      setUser({ ...user, avatar_config: config })
      setShowEditor(false)
      setToast({ message: 'Avatar updated', type: 'success' })
    } catch { setToast({ message: 'Failed to save', type: 'error' }) }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/onboarding')
  }

  if (loading) return (
    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a' }}>Loading</p>
    </div>
  )

  const statItems = [
    { label: 'Hangouts', value: stats?.hangoutsThisMonth || 0 },
    { label: 'Frens', value: stats?.frensCount || 0 },
    { label: 'Streak', value: stats?.streak || 0 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 }}>

      {/* ── Header ── */}
      <div style={{ padding: '56px 20px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Avatar — tappable */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar
              name={user?.name}
              config={user?.avatar_config || {}}
              size={72}
              status={user?.status}
              onClick={() => setShowEditor(true)}
            />
            <button
              onClick={() => setShowEditor(true)}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 22, height: 22, borderRadius: '50%',
                background: '#f5f5f5', border: '2px solid #0a0a0a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 11,
              }}
            >
              ✏
            </button>
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#f5f5f5', margin: '0 0 4px' }}>
              {user?.name}
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#666666', fontSize: 16, flexShrink: 0,
          }}
        >
          ⚙
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        margin: '0 20px',
        background: '#111111',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        display: 'flex',
      }}>
        {statItems.map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: 1, padding: '16px 0', textAlign: 'center',
              borderRight: i < statItems.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', margin: '0 0 4px' }}>
              {s.value}
            </p>
            <p className="section-label" style={{ margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Status picker ── */}
      <div style={{ margin: '24px 20px 0' }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Status</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {STATUS_OPTIONS.map(s => {
            const isActive = user?.status === s.id
            return (
              <button
                key={s.id}
                onClick={() => handleStatusUpdate(s.id)}
                style={{
                  flex: 1, height: 44, borderRadius: 8,
                  background: isActive ? '#1a1a1a' : 'transparent',
                  border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer',
                  transition: 'transform 0.1s ease',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot }} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 500, color: isActive ? '#f5f5f5' : '#666666' }}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        margin: '24px 20px 0',
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {['hangouts', 'frens', 'stats'].map(tab => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, height: 44,
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid #f5f5f5' : '2px solid transparent',
                marginBottom: -1,
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 14, fontWeight: 500,
                color: isActive ? '#f5f5f5' : '#3a3a3a',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '16px 20px' }}>
        {activeTab === 'frens' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats?.topFrens?.length > 0 ? stats.topFrens.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px',
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 12,
                }}
              >
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', width: 20 }}>#{i + 1}</span>
                <Avatar name={f.name} config={f.avatar_config || {}} size={32} />
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, color: '#f5f5f5', flex: 1 }}>{f.name}</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a' }}>{f.count} hangouts</span>
              </div>
            )) : (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', textAlign: 'center', padding: '32px 0' }}>No frens yet</p>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'This Month', value: stats?.hangoutsThisMonth || 0 },
              { label: 'Total Frens', value: stats?.frensCount || 0 },
              { label: 'Day Streak', value: stats?.streak || 0 },
              { label: 'Rank', value: 'Inner Circle' },
            ].map(s => (
              <div key={s.label} style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: '#f5f5f5', margin: '0 0 4px' }}>
                  {s.value}
                </p>
                <p className="section-label" style={{ margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'hangouts' && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#3a3a3a', textAlign: 'center', padding: '32px 0' }}>
            Hangout history coming soon
          </p>
        )}
      </div>

      {/* ── Sign out ── */}
      <div style={{ padding: '0 20px' }}>
        <button onClick={handleSignOut} className="btn-destructive" style={{ width: '100%' }}>
          Sign Out
        </button>
      </div>

      {showEditor && (
        <AvatarEditor user={user} onSave={handleSaveAvatar} onClose={() => setShowEditor(false)} />
      )}
    </div>
  )
}

export default Profile
