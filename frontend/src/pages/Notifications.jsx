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
  if (s < 3600) return Math.floor(s / 60) + 'm'
  if (s < 86400) return Math.floor(s / 3600) + 'h'
  return Math.floor(s / 86400) + 'd'
}

const BackIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
    <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const NotifCard = ({ notif, onTap, onDelete }) => {
  const cfg = getNotifConfig(notif.type)
  return (
    <div
      onClick={() => onTap(notif)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#111111',
        border: notif.read ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
        position: 'relative',
      }}
    >
      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: 'absolute', top: 14, left: 8,
          width: 4, height: 4, borderRadius: '50%', background: '#f5f5f5',
        }} />
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: 14, fontWeight: notif.read ? 400 : 600,
            color: notif.read ? '#666666' : '#f5f5f5',
            margin: 0, lineHeight: 1.4,
          }}>
            {notif.title}
          </p>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: '#3a3a3a', flexShrink: 0 }}>
            {timeAgo(notif.created_at)}
          </span>
        </div>
        {notif.body && (
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#666666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notif.body}
          </p>
        )}
      </div>

      <button
        onClick={e => { e.stopPropagation(); onDelete(notif.id) }}
        style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'none', border: '1px solid rgba(255,255,255,0.07)',
          color: '#3a3a3a', fontFamily: 'DM Sans, sans-serif', fontSize: 12,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, opacity: 0, transition: 'opacity 0.15s ease',
        }}
        className="delete-btn"
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
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleTap = async (notif) => {
    if (!notif.read) {
      await markRead(notif.id).catch(() => {})
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
    }
    const routes = {
      fren_request: '/frens', fren_accepted: '/frens',
      hangout_invite: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      rsvp_update: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      hangout_reminder: notif.data?.hangoutId ? `/hangout/${notif.data.hangoutId}` : '/',
      nearby_ping: '/nearby',
    }
    if (routes[notif.type]) navigate(routes[notif.type])
  }

  const handleDelete = async (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    await deleteNotification(id).catch(() => {})
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleClearAll = async () => {
    await clearAllNotifications()
    setNotifications([])
  }

  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '56px 20px 16px',
        position: 'sticky', top: 0, zIndex: 10,
        background: '#0a0a0a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
              color: '#666666', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <BackIcon />
          </button>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700, color: '#f5f5f5', margin: 0 }}>
            Notifications
          </h1>
        </div>
        {notifications.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {unread.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  padding: '6px 12px',
                  background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 8, color: '#666666',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={handleClearAll}
              style={{
                padding: '6px 12px',
                background: '#111111', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, color: '#3a3a3a',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#f5f5f5', marginBottom: 8 }}>
              All quiet
            </p>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#666666' }}>
              Pings and updates land here
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p className="section-label" style={{ marginBottom: 8 }}>New · {unread.length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {unread.map(n => <NotifCard key={n.id} notif={n} onTap={handleTap} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
            {read.length > 0 && (
              <div>
                <p className="section-label" style={{ marginBottom: 8 }}>Earlier</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {read.map(n => <NotifCard key={n.id} notif={n} onTap={handleTap} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Notifications
