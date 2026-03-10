import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserStats, updateStatus, getMyProfile, updateAvatarConfig } from '../lib/api'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import AvatarEditor from '../components/AvatarEditor'

const Profile = () => {
  const { user, setUser, setToast } = useStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)

  const fetchProfileAndStats = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([getMyProfile(), getUserStats()])
      setUser(profileRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProfileAndStats() }, [])

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus(newStatus)
      setUser({ ...user, status: newStatus })
      setToast({ message: `Status set to ${newStatus}!`, type: 'info' })
    } catch (err) {
      setToast({ message: 'Update failed', type: 'error' })
    }
  }

  const handleSaveAvatar = async (config) => {
    try {
      await updateAvatarConfig(config)
      setUser({ ...user, avatar_config: config })
      setShowEditor(false)
      setToast({ message: 'Avatar updated', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to save avatar', type: 'error' })
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/onboarding')
  }

  if (loading) return <div className="p-6 text-center pt-20 opacity-30">Loading profile...</div>

  return (
    <div className="p-6 pb-32 max-w-md mx-auto space-y-10 animate-in fade-in duration-500 safe-top relative">

      {/* Settings gear — top right */}
      <button
        onClick={() => navigate('/settings')}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg hover:bg-white/10 transition-colors z-10"
      >
        ⚙️
      </button>

      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Tappable avatar with edit badge */}
        <div className="relative">
          <Avatar
            name={user?.name}
            config={user?.avatar_config || {}}
            size={100}
            status={user?.status}
            onClick={() => setShowEditor(true)}
            className="ring-4 ring-primary-red/30 cursor-pointer hover:ring-primary-red/60 transition-all"
          />
          <button
            onClick={() => setShowEditor(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ background: '#ff6b6b', border: '2px solid #0e0c14' }}
          >
            ✏️
          </button>
        </div>
        <div>
          <h1 className="text-3xl font-display font-black italic">{user?.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Status Picker */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center">Your Status</h3>
        <div className="flex gap-2">
          {[
            { id: 'free', label: 'Down for anything', emoji: '🕺', color: 'bg-primary-green' },
            { id: 'maybe', label: 'Convincable', emoji: '🤔', color: 'bg-primary-yellow' },
            { id: 'busy', label: 'Doing things', emoji: '💼', color: 'bg-primary-red' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => handleStatusUpdate(s.id)}
              className={`flex-1 p-4 rounded-3xl flex flex-col items-center gap-2 transition-all duration-300 border ${user?.status === s.id ? `${s.color} text-background border-transparent scale-95 shadow-lg` : 'bg-card border-white/5 opacity-40 hover:opacity-100'}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card-frens p-6 flex flex-col items-center gap-2">
          <span className="text-3xl">🎉</span>
          <span className="text-2xl font-display font-black italic">{stats?.hangoutsThisMonth || 0}</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30">This Month</span>
        </div>
        <div className="card-frens p-6 flex flex-col items-center gap-2">
          <span className="text-3xl">👥</span>
          <span className="text-2xl font-display font-black italic">{stats?.frensCount || 0}</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Total Frens</span>
        </div>
        <div className="card-frens p-6 flex flex-col items-center gap-2">
          <span className="text-3xl">🔥</span>
          <span className="text-2xl font-display font-black italic">{stats?.streak || 0}</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Day Streak</span>
        </div>
        <div className="card-frens p-6 flex flex-col items-center gap-2">
          <span className="text-3xl">🥉</span>
          <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Standing</span>
          <span className="text-xs font-bold text-primary-yellow">INNER CIRCLE</span>
        </div>
      </div>

      {/* Top Frens */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Top Frens</h3>
        <div className="space-y-2">
          {stats?.topFrens?.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-4 glass rounded-[1.5rem]">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black ${i === 0 ? 'text-primary-yellow' : i === 1 ? 'text-white/40' : 'text-primary-red/40'}`}>
                  #{i + 1}
                </span>
                <Avatar name={f.name} config={f.avatar_config || {}} size={32} />
                <span className="font-display font-bold">{f.name}</span>
              </div>
              <span className="text-[10px] font-black uppercase opacity-30">{f.count} hangouts</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSignOut} className="w-full card-frens p-6 border-primary-red/20 opacity-40 hover:opacity-100 hover:border-primary-red/50 transition-all font-display font-black italic">
        SIGN OUT
      </button>

      {/* Avatar Editor Modal */}
      {showEditor && (
        <AvatarEditor
          user={user}
          onSave={handleSaveAvatar}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

export default Profile
