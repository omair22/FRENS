import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserStats, updateStatus, getMyProfile, updateProfile } from '../lib/api'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import Avatar from '../components/Avatar'
import { AVATAR_STYLES, getAvatarUrl } from '../lib/avatar'

const Profile = () => {
  const { user, setUser, setToast } = useStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [changingStyle, setChangingStyle] = useState(false)

  const fetchProfileAndStats = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        getMyProfile(),
        getUserStats()
      ])
      setUser(profileRes.data)
      setStats(statsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileAndStats()
  }, [])

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus(newStatus)
      setUser({ ...user, status: newStatus })
      setToast({ message: `Status set to ${newStatus}! ✨`, type: 'info' })
    } catch (err) {
      setToast({ message: 'Update failed', type: 'error' })
    }
  }

  const handleStyleChange = async (style) => {
    setChangingStyle(true)
    try {
      const res = await updateProfile(user.name, style)
      setUser(res.data)
      setToast({ message: 'Avatar updated! 🎨', type: 'success' })
    } catch (err) {
      setToast({ message: 'Failed to update avatar', type: 'error' })
    } finally {
      setChangingStyle(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    navigate('/onboarding')
  }

  if (loading) return <div className="p-6">Loading profile...</div>

  return (
    <div className="p-6 pb-32 max-w-md mx-auto space-y-10 animate-in fade-in duration-500 safe-top">
      {/* Header Profile */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar user={user} size="xl" className="border-4 border-primary-red shadow-2xl shadow-primary-red/20" />
          {changingStyle && (
            <div className="absolute inset-0 rounded-[2rem] bg-background/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary-red/30 border-t-primary-red rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-display font-black italic">{user?.name}</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Avatar Style Switcher */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center">Avatar Style</h3>
        <div className="grid grid-cols-3 gap-3">
          {AVATAR_STYLES.map(s => {
            const previewUser = { ...user, avatar_style: s.id }
            const active = (user?.avatar_style || 'adventurer') === s.id
            return (
              <button
                key={s.id}
                onClick={() => handleStyleChange(s.id)}
                disabled={changingStyle}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 ${
                  active
                    ? 'bg-primary-red/20 border-2 border-primary-red scale-105 shadow-lg shadow-primary-red/10'
                    : 'bg-card border border-white/5 opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={getAvatarUrl(previewUser, 80)}
                  alt={s.label}
                  className="w-12 h-12 rounded-full object-cover bg-card"
                />
                <span className="text-[8px] font-black uppercase tracking-wider">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Picker */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 text-center">Your Current Status</h3>
        <div className="flex gap-2">
          {[
            { id: 'free', label: 'Down for anything', emoji: '🕺', color: 'bg-primary-green' },
            { id: 'maybe', label: 'Convincable', emoji: '🤔', color: 'bg-primary-yellow' },
            { id: 'busy', label: 'Doing things', emoji: '💼', color: 'bg-primary-red' }
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => handleStatusUpdate(s.id)}
              className={`flex-1 p-4 rounded-3xl flex flex-col items-center gap-2 transition-all duration-300 border ${user?.status === s.id ? `${s.color} text-background border-transparent scale-95 shadow-lg` : 'bg-card border-white/5 opacity-40 hover:opacity-100'}`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-tight">
                {s.label}
              </span>
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

      {/* Top Frens Podium */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 px-1">Top Frens</h3>
        <div className="space-y-2">
          {stats?.topFrens?.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-4 glass rounded-[1.5rem]">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black ${i === 0 ? 'text-primary-yellow' : i === 1 ? 'text-white/40' : 'text-primary-red/40'}`}>
                  #{i + 1}
                </span>
                <Avatar user={f} size="sm" />
                <span className="font-display font-bold">{f.name}</span>
              </div>
              <span className="text-[10px] font-black uppercase opacity-30">{f.count} hangouts</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full card-frens p-6 border-primary-red/20 opacity-40 hover:opacity-100 hover:border-primary-red/50 transition-all font-display font-black italic"
      >
        SIGN OUT
      </button>
    </div>
  )
}

export default Profile
