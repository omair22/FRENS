import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  getNotifications, markRead, markAllRead,
  deleteNotification, clearAllNotifications,
} from '../lib/api'
import { getNotifConfig } from '../lib/notifConfig'

const timeAgo = (dateStr) => {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + 'm ago'
  if (s < 86400) return Math.floor(s / 3600) + 'h ago'
  return Math.floor(s / 86400) + 'd ago'
}

const NotifCard = ({ notif, onTap, onDelete }) => {
  const cfg = getNotifConfig(notif.type)
  return (
    <div
      onClick={() => onTap(notif)}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all active:scale-[0.98] group"
      style={{
        background: notif.read ? '#16131f' : '#1d1928',
        border: notif.read ? '1px solid rgba(255,255,255,0.06)' : `1px solid ${cfg.color}25`,
        boxShadow: notif.read ? 'none' : `0 0 20px ${cfg.color}08`,
      }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${cfg.color}15` }}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-bold leading-tight ${notif.read ? 'text-white/70' : 'text-white'}`}>
            {notif.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!notif.read && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />}
            <span className="text-[10px] text-white/25 whitespace-nowrap">{timeAgo(notif.created_at)}</span>
          </div>
        </div>
        {notif.body && <p className="text-xs text-white/40 mt-0.5 leading-relaxed truncate">{notif.body}</p>}
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}
      >
        ✕
      </button>
    </div>
  )
}

const Notifications = () => {
  const navigate = useNavigate()
  const { setUnreadCount, setToast } = useStore()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadNotifications() }, [])

  const loadNotifications = async () => {
    try {
      const res = await getNotifications()
      setNotifications(res.data)
      setUnreadCount(0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleTap = async (notif) => {
    if (!notif.read) {
      await markRead(notif.id).catch(() => { })
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    const routes = {
      fren_request: '/frens', fren_accepted: '/frens',
      hangout_invite: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      rsvp_update: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      hangout_reminder: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      nearby_ping: '/nearby',
      new_photo: notif.data?.hangoutId ? `/album/${notif.data.hangoutId}` : '/',
      vibe_vote: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      idea_vote: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      hangout_updated: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      hangout_cancelled: '/',
      co_host_added: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      fren_nearby: '/nearby',
      plan_losing_momentum: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
    }
    if (routes[notif.type]) navigate(routes[notif.type])
  }

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await deleteNotification(id).catch(() => { })
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setToast({ message: 'All caught up', type: 'success' })
  }

  const handleClearAll = async () => {
    await clearAllNotifications()
    setNotifications([])
    setToast({ message: 'Cleared', type: 'info' })
  }

  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0e0c14' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3 sticky top-0 z-10"
        style={{ background: '#0e0c14', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-white/60">←</button>
          <h1 className="font-display font-black text-2xl italic">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {unread.length > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(77,150,255,0.15)', color: '#4d96ff' }}>
                Mark all read
              </button>
            )}
            <button onClick={handleClearAll}
              className="text-[10px] font-black uppercase px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}>
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="px-4 pt-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#16131f' }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="text-6xl">🔔</span>
            <p className="font-display font-black text-xl italic">All quiet</p>
            <p className="text-sm text-white/30 text-center">
              Pings, plans, and photos land here
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 px-1">
                  New · {unread.length}
                </p>
                <div className="space-y-2 mb-6">
                  {unread.map(n => <NotifCard key={n.id} notif={n} onTap={handleTap} onDelete={handleDelete} />)}
                </div>
              </>
            )}
            {read.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 px-1">Earlier</p>
                <div className="space-y-2">
                  {read.map(n => <NotifCard key={n.id} notif={n} onTap={handleTap} onDelete={handleDelete} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Notifications
